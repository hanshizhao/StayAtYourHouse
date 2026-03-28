using Gentle.Application.Dtos.RentalRecord;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;
using TenantEntity = Gentle.Core.Entities.Tenant;

namespace Gentle.Application.Services;

/// <summary>
/// 租住记录服务实现
/// </summary>
public class RentalRecordService : IRentalRecordService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly IRepository<RentalRecord> _repository;
    private readonly IRepository<TenantEntity> _tenantRepository;
    private readonly IRepository<Room> _roomRepository;

    public RentalRecordService(
        IRepository<RentalRecord> repository,
        IRepository<TenantEntity> tenantRepository,
        IRepository<Room> roomRepository)
    {
        _repository = repository;
        _tenantRepository = tenantRepository;
        _roomRepository = roomRepository;
    }

    /// <inheritdoc />
    public async Task<List<RentalRecordDto>> GetListAsync(RentalStatus? status = null, int? roomId = null, int? tenantId = null)
    {
        var query = _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .AsQueryable();

        // 状态筛选
        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        // 房间筛选
        if (roomId.HasValue)
        {
            query = query.Where(r => r.RoomId == roomId.Value);
        }

        // 租客筛选
        if (tenantId.HasValue)
        {
            query = query.Where(r => r.RenterId == tenantId.Value);
        }

        var list = await query.ToListAsync();

        return list
            .OrderByDescending(r => r.CreatedTime)
            .Adapt<List<RentalRecordDto>>();
    }

    /// <inheritdoc />
    public async Task<RentalRecordDto> GetByIdAsync(int id)
    {
        var record = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .Include(r => r.Bills)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"租住记录 {id} 不存在");
        }

        return record.Adapt<RentalRecordDto>();
    }

    /// <inheritdoc />
    public async Task<(List<RentalRecordDto> Items, int Total)> GetPagedListAsync(
        RentalStatus? status = null, int? roomId = null, int? tenantId = null,
        int page = 1, int pageSize = 20)
    {
        // 分页参数边界保护
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = DefaultPageSize;
        if (pageSize > MaxPageSize) pageSize = MaxPageSize;

        var query = _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .Include(r => r.Bills)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(r => r.Status == status.Value);
        }

        if (roomId.HasValue)
        {
            query = query.Where(r => r.RoomId == roomId.Value);
        }

        if (tenantId.HasValue)
        {
            query = query.Where(r => r.RenterId == tenantId.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items.Adapt<List<RentalRecordDto>>(), total);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> CheckInAsync(CheckInInput input)
    {
        // 验证租客是否存在
        var tenant = await _tenantRepository.FindAsync(input.TenantId);
        if (tenant == null)
        {
            throw Oops.Oh($"租客 {input.TenantId} 不存在");
        }

        // 验证房间是否存在
        var room = await _roomRepository
            .AsQueryable()
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RoomId);

        if (room == null)
        {
            throw Oops.Oh($"房间 {input.RoomId} 不存在");
        }

        // 验证房间状态是否为空置
        if (room.Status != RoomStatus.Vacant)
        {
            throw Oops.Oh($"房间 {room.Community.Name} {room.Building}栋 {room.RoomNumber}号 当前状态为「{GetRoomStatusText(room.Status)}」，无法入住");
        }

        // 计算合同结束日期
        var contractEndDate = CalculateContractEndDate(input.CheckInDate, input.LeaseType);

        // 创建租住记录
        var record = new RentalRecord
        {
            RenterId = input.TenantId,
            RoomId = input.RoomId,
            CheckInDate = input.CheckInDate,
            LeaseType = input.LeaseType,
            ContractEndDate = contractEndDate,
            MonthlyRent = input.MonthlyRent,
            Deposit = input.Deposit,
            DepositStatus = DepositStatus.Received,
            Status = RentalStatus.Active,
            Remark = input.Remark
        };

        var entry = await _repository.InsertAsync(record);

        // 更新房间状态为已出租，同时更新合同图片
        room.Status = RoomStatus.Rented;
        if (!string.IsNullOrEmpty(input.ContractImage))
        {
            room.ContractImage = input.ContractImage;
        }
        await _roomRepository.UpdateAsync(room);

        await _repository.SaveNowAsync();

        // 重新查询以获取完整导航属性
        var createdRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == entry.Entity.Id);

        return createdRecord!.Adapt<RentalRecordDto>();
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> CheckOutAsync(CheckOutInput input)
    {
        // 验证租住记录是否存在
        var record = await _repository
            .AsQueryable()
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RentalRecordId);

        if (record == null)
        {
            throw Oops.Oh($"租住记录 {input.RentalRecordId} 不存在");
        }

        // 验证租住记录状态
        if (record.Status != RentalStatus.Active)
        {
            throw Oops.Oh("该租住记录已终止，无法重复退租");
        }

        // 验证退租日期
        if (input.CheckOutDate <= record.CheckInDate)
        {
            throw Oops.Oh("退租日期必须晚于入住日期");
        }

        // 验证押金抵扣金额
        if (input.DepositDeduction.HasValue && input.DepositDeduction.Value > record.Deposit)
        {
            throw Oops.Oh($"押金抵扣金额({input.DepositDeduction.Value})不能超过押金金额({record.Deposit})");
        }

        // 验证押金状态与抵扣金额的一致性
        if (input.DepositStatus == DepositStatus.Deducted && !input.DepositDeduction.HasValue)
        {
            throw Oops.Oh("押金状态为「已抵扣」时，必须填写抵扣金额");
        }

        // 更新租住记录
        record.CheckOutDate = input.CheckOutDate;
        record.Status = RentalStatus.Terminated;
        record.DepositStatus = input.DepositStatus;
        record.DepositDeduction = input.DepositDeduction;
        record.CheckOutRemark = input.CheckOutRemark;

        await _repository.UpdateAsync(record);

        // 更新房间状态为空置
        var room = await _roomRepository.FindAsync(record.RoomId);
        if (room != null)
        {
            room.Status = RoomStatus.Vacant;
            await _roomRepository.UpdateAsync(room);
        }

        await _repository.SaveNowAsync();

        // 重新查询以获取完整导航属性
        var updatedRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == record.Id);

        return updatedRecord!.Adapt<RentalRecordDto>();
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task DeleteAsync(int id)
    {
        var record = await _repository.FindAsync(id);
        if (record == null)
        {
            throw Oops.Oh($"租住记录 {id} 不存在");
        }

        // 如果是活跃状态的租住记录，需要先恢复房间状态
        if (record.Status == RentalStatus.Active)
        {
            var room = await _roomRepository.FindAsync(record.RoomId);
            if (room != null)
            {
                room.Status = RoomStatus.Vacant;
                await _roomRepository.UpdateAsync(room);
            }
        }

        await _repository.DeleteAsync(record);
        await _repository.SaveNowAsync();
    }

    /// <summary>
    /// 计算合同结束日期
    /// </summary>
    private static DateTime CalculateContractEndDate(DateTime checkInDate, LeaseType leaseType)
    {
        return leaseType switch
        {
            LeaseType.Monthly => checkInDate.AddMonths(1).AddDays(-1),
            LeaseType.HalfYear => checkInDate.AddMonths(6).AddDays(-1),
            LeaseType.Yearly => checkInDate.AddYears(1).AddDays(-1),
            _ => checkInDate.AddMonths(1).AddDays(-1)
        };
    }

    /// <summary>
    /// 获取房间状态文本
    /// </summary>
    private static string GetRoomStatusText(RoomStatus status)
    {
        return status switch
        {
            RoomStatus.Vacant => "空置",
            RoomStatus.Rented => "已出租",
            RoomStatus.Renovating => "装修中",
            _ => "未知"
        };
    }
}

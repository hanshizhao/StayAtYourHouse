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

    private const int ReminderDaysBeforeExpiry = 3;

    private readonly IRepository<RentalRecord> _repository;
    private readonly IRepository<TenantEntity> _tenantRepository;
    private readonly IRepository<Room> _roomRepository;
    private readonly IRepository<RentalReminder> _rentalReminderRepository;

    public RentalRecordService(
        IRepository<RentalRecord> repository,
        IRepository<TenantEntity> tenantRepository,
        IRepository<Room> roomRepository,
        IRepository<RentalReminder> rentalReminderRepository)
    {
        _repository = repository;
        _tenantRepository = tenantRepository;
        _roomRepository = roomRepository;
        _rentalReminderRepository = rentalReminderRepository;
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
            .Include(r => r.UtilityBills)
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
            .Include(r => r.UtilityBills)
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
        var contractEndDate = CalculateContractEndDate(input.CheckInDate, input.LeaseMonths);

        // 创建租住记录
        var record = new RentalRecord
        {
            RenterId = input.TenantId,
            RoomId = input.RoomId,
            CheckInDate = input.CheckInDate,
            LeaseMonths = input.LeaseMonths,
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

        // 补录入住时，合同到期日可能已过或在提醒窗口内，立即创建催收提醒
        await CreateReminderIfNeededAsync(entry.Entity.Id, contractEndDate);

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

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id)
    {
        var record = await _repository
            .AsQueryable()
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"租住记录 {id} 不存在");
        }

        // 幂等处理：已提交则直接返回
        if (record.IsAnJuCodeSubmitted)
        {
            return record.Adapt<RentalRecordDto>();
        }

        record.IsAnJuCodeSubmitted = true;
        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        // 重新查询以获取完整导航属性
        var updatedRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        return updatedRecord!.Adapt<RentalRecordDto>();
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<RentalRecordDto> UpdateAsync(int id, UpdateRentalRecordInput input)
    {
        var record = await _repository
            .AsQueryable()
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"租住记录 {id} 不存在");
        }

        if (record.Status != RentalStatus.Active)
        {
            throw Oops.Oh("只有生效中的租约才能修改");
        }

        if (input.ContractEndDate <= input.CheckInDate)
        {
            throw Oops.Oh("合同结束日期必须晚于入住日期");
        }

        record.CheckInDate = input.CheckInDate;
        record.LeaseMonths = input.LeaseMonths;
        record.ContractEndDate = input.ContractEndDate;
        record.MonthlyRent = input.MonthlyRent;
        record.Deposit = input.Deposit;
        record.Remark = input.Remark;

        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        // 同步催收提醒：清理旧的 Pending 提醒，根据新合同日期重新创建
        var oldReminders = await _rentalReminderRepository
            .AsQueryable()
            .Where(r => r.RentalRecordId == id && r.Status == RentalReminderStatus.Pending)
            .ToListAsync();
        foreach (var old in oldReminders)
        {
            await _rentalReminderRepository.DeleteAsync(old);
        }

        if (oldReminders.Count > 0)
        {
            await _rentalReminderRepository.SaveNowAsync();
        }

        await CreateReminderIfNeededAsync(id, input.ContractEndDate);

        // 重新查询以获取完整导航属性
        var updatedRecord = await _repository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Include(r => r.Room)
                .ThenInclude(room => room.Community)
            .FirstOrDefaultAsync(r => r.Id == id);

        return updatedRecord!.Adapt<RentalRecordDto>();
    }

    /// <summary>
    /// 计算合同结束日期
    /// </summary>
    private static DateTime CalculateContractEndDate(DateTime checkInDate, int leaseMonths)
    {
        return checkInDate.AddMonths(leaseMonths).AddDays(-1);
    }

    /// <summary>
    /// 如果合同到期日在提醒窗口内或已过期，立即创建催收提醒
    /// </summary>
    /// <remarks>
    /// 处理补录入住场景：当入住日期为过去日期时，合同到期日可能已经过了或即将到来，
    /// 后台定时服务无法捕获这种情况，因此需要在入住时立即创建提醒。
    /// </remarks>
    private async Task CreateReminderIfNeededAsync(int rentalRecordId, DateTime contractEndDate)
    {
        var reminderThreshold = DateTime.Today.AddDays(ReminderDaysBeforeExpiry);

        if (contractEndDate > reminderThreshold)
        {
            return;
        }

        // 防重复：检查是否已存在待处理提醒
        var exists = await _rentalReminderRepository
            .AsQueryable()
            .AnyAsync(r => r.RentalRecordId == rentalRecordId
                && r.Status == RentalReminderStatus.Pending);

        if (exists)
        {
            return;
        }

        var reminder = new RentalReminder
        {
            RentalRecordId = rentalRecordId,
            ReminderDate = DateTime.Today,
            Status = RentalReminderStatus.Pending,
            Remark = $"系统自动创建：合同将于 {contractEndDate:yyyy-MM-dd} 到期"
        };

        await _rentalReminderRepository.InsertAsync(reminder);
        await _rentalReminderRepository.SaveNowAsync();
    }

    /// <summary>
    /// 获取房间状态文本
    /// </summary>
    private static string GetRoomStatusText(RoomStatus status) => status.ToText();
}

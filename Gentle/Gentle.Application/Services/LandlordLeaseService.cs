using Gentle.Application.Dtos.LandlordLease;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 房东租约服务实现
/// </summary>
public class LandlordLeaseService : ILandlordLeaseService
{
    private readonly IRepository<LandlordLease> _repository;
    private readonly IRepository<Room> _roomRepository;

    public LandlordLeaseService(IRepository<LandlordLease> repository, IRepository<Room> roomRepository)
    {
        _repository = repository;
        _roomRepository = roomRepository;
    }

    /// <inheritdoc />
    public async Task<LandlordLeaseDto?> GetByRoomIdAsync(int roomId)
    {
        var lease = await _repository
            .AsQueryable(false)
            .Include(l => l.Room)
                .ThenInclude(r => r!.Community)
            .FirstOrDefaultAsync(l => l.RoomId == roomId);

        return lease?.Adapt<LandlordLeaseDto>();
    }

    /// <inheritdoc />
    public async Task<LandlordLeaseDto> AddAsync(CreateLandlordLeaseInput input)
    {
        // 检查房间是否存在
        var room = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RoomId);

        if (room == null)
        {
            throw Oops.Oh($"房间 {input.RoomId} 不存在");
        }

        // 检查房间是否已有租约（一对一约束）
        var exists = await _repository.AsQueryable(false)
            .AnyAsync(l => l.RoomId == input.RoomId);

        if (exists)
        {
            throw Oops.Oh($"房间 {room.Community?.Name} {room.Building}栋 {room.RoomNumber}号 已存在房东租约");
        }

        // 日期校验
        if (input.StartDate.HasValue && input.EndDate.HasValue && input.EndDate <= input.StartDate)
        {
            throw Oops.Oh("租约结束日期必须晚于开始日期");
        }

        var lease = input.Adapt<LandlordLease>();
        lease.CreatedTime = DateTimeOffset.Now;

        var entry = await _repository.InsertAsync(lease);
        await _repository.SaveNowAsync();

        // 保存后手动设置导航属性，仅用于 DTO 映射（避免 EF Core 尝试重新插入 Room 实体）
        entry.Entity.Room = room;
        return entry.Entity.Adapt<LandlordLeaseDto>();
    }

    /// <inheritdoc />
    public async Task<LandlordLeaseDto> EditAsync(UpdateLandlordLeaseInput input)
    {
        var lease = await _repository
            .AsQueryable()
            .Include(l => l.Room)
                .ThenInclude(r => r!.Community)
            .FirstOrDefaultAsync(l => l.Id == input.Id);

        if (lease == null)
        {
            throw Oops.Oh($"房东租约 {input.Id} 不存在");
        }

        // 日期校验
        var startDate = input.StartDate ?? lease.StartDate;
        var endDate = input.EndDate ?? lease.EndDate;
        if (startDate.HasValue && endDate.HasValue && endDate <= startDate)
        {
            throw Oops.Oh("租约结束日期必须晚于开始日期");
        }

        // 更新字段
        lease.LandlordName = input.LandlordName;
        lease.LandlordPhone = input.LandlordPhone;
        lease.StartDate = input.StartDate;
        lease.EndDate = input.EndDate;
        lease.MonthlyRent = input.MonthlyRent;
        lease.PaymentMethod = input.PaymentMethod;
        lease.DepositMonths = input.DepositMonths;
        lease.WaterPrice = input.WaterPrice;
        lease.ElectricPrice = input.ElectricPrice;
        lease.ElevatorFee = input.ElevatorFee;
        lease.PropertyFee = input.PropertyFee;
        lease.InternetFee = input.InternetFee;
        lease.OtherFees = input.OtherFees;
        lease.Remark = input.Remark;
        lease.UpdatedTime = DateTimeOffset.Now;

        var entry = await _repository.UpdateAsync(lease);
        await _repository.SaveNowAsync();

        return entry.Entity.Adapt<LandlordLeaseDto>();
    }

    /// <inheritdoc />
    public async Task RemoveAsync(int id)
    {
        var lease = await _repository.FindAsync(id);
        if (lease == null)
        {
            throw Oops.Oh($"房东租约 {id} 不存在");
        }

        await _repository.DeleteAsync(lease);
        await _repository.SaveNowAsync();
    }
}

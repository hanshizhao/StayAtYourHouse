using Gentle.Application.Dtos.Room;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 房间服务实现
/// </summary>
public class RoomService : IRoomService
{
    private readonly IRepository<Room> _repository;
    private readonly IRepository<Community> _communityRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;

    public RoomService(IRepository<Room> repository, IRepository<Community> communityRepository, IRepository<RentalRecord> rentalRecordRepository)
    {
        _repository = repository;
        _communityRepository = communityRepository;
        _rentalRecordRepository = rentalRecordRepository;
    }

    /// <inheritdoc />
    public async Task<RoomListResult> GetListAsync(RoomListInput input)
    {
        IQueryable<Room> query = _repository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Include(r => r.LandlordLease);

        if (input.CommunityId.HasValue)
        {
            query = query.Where(r => r.CommunityId == input.CommunityId.Value);
        }

        if (input.Status.HasValue)
        {
            query = query.Where(r => r.Status == input.Status.Value);
        }

        var allRooms = await query.ToListAsync();

        var roomIds = allRooms.Select(r => r.Id).ToHashSet();
        var activeRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Where(r => r.Status == RentalStatus.Active && roomIds.Contains(r.RoomId))
            .OrderByDescending(r => r.CreatedTime)
            .ToListAsync();

        var rentalByRoomId = activeRentals
            .GroupBy(r => r.RoomId)
            .ToDictionary(g => g.Key, g => g.First());

        var dtoList = allRooms
            .Select(r =>
            {
                var dto = r.Adapt<RoomDto>();

                dto.LandlordLeaseStatus = CalculateLeaseStatus(r.LandlordLease?.EndDate);
                dto.LandlordLeaseExpiredDays = CalculateExpiredDays(r.LandlordLease?.EndDate);

                if (rentalByRoomId.TryGetValue(r.Id, out var rental))
                {
                    dto.TenantLeaseStatus = CalculateLeaseStatus(rental.ContractEndDate);
                    dto.TenantLeaseExpiredDays = CalculateExpiredDays(rental.ContractEndDate);
                    dto.TenantMonthlyRent = rental.MonthlyRent;
                    dto.AnjuCodeSubmitted = rental.IsAnJuCodeSubmitted;
                    dto.TenantName = rental.Renter?.Name;
                    dto.RentalStartDate = rental.CheckInDate;
                    dto.RentalEndDate = rental.ContractEndDate;
                    dto.Profit = rental.MonthlyRent - (r.LandlordLease?.MonthlyRent ?? 0);
                }
                else
                {
                    dto.TenantLeaseStatus = LeaseStatus.None;
                    dto.TenantLeaseExpiredDays = null;
                    dto.TenantMonthlyRent = null;
                    dto.Profit = r.RentPrice - (r.LandlordLease?.MonthlyRent ?? 0);
                }

                return dto;
            })
            .ToList();

        if (input.HasLeaseAlert == true)
        {
            dtoList = dtoList
                .Where(dto => dto.LandlordLeaseStatus is LeaseStatus.ExpiringSoon or LeaseStatus.Expired
                    || dto.TenantLeaseStatus is LeaseStatus.ExpiringSoon or LeaseStatus.Expired)
                .ToList();
        }

        var sorted = dtoList
            .OrderBy(r => r.CommunityName)
            .ThenBy(r => ExtractLeadingNumber(r.Building))
            .ThenBy(r => ExtractLeadingNumber(r.RoomNumber))
            .ToList();

        var total = sorted.Count;
        var pagedItems = sorted
            .Skip((input.Page - 1) * input.PageSize)
            .Take(input.PageSize)
            .ToList();

        return new RoomListResult
        {
            List = pagedItems,
            Total = total,
            Page = input.Page,
            PageSize = input.PageSize
        };
    }

    /// <inheritdoc />
    public async Task<RoomDto> GetByIdAsync(int id)
    {
        var room = await _repository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Include(r => r.LandlordLease)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (room == null)
        {
            throw Oops.Oh($"房间 {id} 不存在");
        }

        return room.Adapt<RoomDto>();
    }

    /// <inheritdoc />
    public async Task<RoomDto> AddAsync(CreateRoomInput input)
    {
        // 检查小区是否存在
        var community = await _communityRepository.FindAsync(input.CommunityId);
        if (community == null)
        {
            throw Oops.Oh($"所属小区 {input.CommunityId} 不存在");
        }

        // 检查同一小区下房间是否重复
        var exists = await _repository.AsQueryable(false)
            .AnyAsync(r => r.CommunityId == input.CommunityId
                && r.Building == input.Building
                && r.RoomNumber == input.RoomNumber);

        if (exists)
        {
            throw Oops.Oh($"小区 {community.Name} 的 {input.Building}栋 {input.RoomNumber} 号房间已存在");
        }

        var room = input.Adapt<Room>();
        // 新建房间不允许直接设为已收回状态
        if (room.Status == RoomStatus.Reclaimed)
        {
            throw Oops.Oh("新建房间不允许直接设为已收回状态");
        }
        room.CreatedTime = DateTimeOffset.Now;
        // 设置 Community 导航属性，以便 Mapster 映射 CommunityName
        room.Community = community;

        var entry = await _repository.InsertAsync(room);
        await _repository.SaveNowAsync();

        return entry.Entity.Adapt<RoomDto>();
    }

    /// <inheritdoc />
    public async Task<RoomDto> UpdateAsync(UpdateRoomInput input)
    {
        // 检查房间是否存在
        var existing = await _repository
            .AsQueryable()
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.Id);

        if (existing == null)
        {
            throw Oops.Oh($"房间 {input.Id} 不存在");
        }

        // 检查小区是否存在
        var community = await _communityRepository.FindAsync(input.CommunityId);
        if (community == null)
        {
            throw Oops.Oh($"所属小区 {input.CommunityId} 不存在");
        }

        // 检查同一小区下房间是否与其他房间重复
        var exists = await _repository.AsQueryable(false)
            .AnyAsync(r => r.CommunityId == input.CommunityId
                && r.Building == input.Building
                && r.RoomNumber == input.RoomNumber
                && r.Id != input.Id);

        if (exists)
        {
            throw Oops.Oh($"小区 {community.Name} 的 {input.Building}栋 {input.RoomNumber} 号房间已存在");
        }

        // 状态转换校验
        if (input.Status != existing.Status)
        {
            var transitionValid = (existing.Status, input.Status) switch
            {
                (RoomStatus.Vacant, RoomStatus.Reclaimed) => true,    // 空置 → 已收回
                (RoomStatus.Reclaimed, RoomStatus.Vacant) => true,    // 已收回 → 空置
                (RoomStatus.Reclaimed, _) => false,                    // 已收回不能转为其他状态
                (_, RoomStatus.Reclaimed) => false,                    // 只有空置可以转为已收回
                _ => true                                              // 其他状态转换允许
            };

            if (!transitionValid)
            {
                throw Oops.Oh("状态转换不合法：仅空置状态可收回，已收回状态只能恢复为空置");
            }
        }

        // 更新字段
        existing.CommunityId = input.CommunityId;
        existing.Building = input.Building;
        existing.RoomNumber = input.RoomNumber;
        existing.RentPrice = input.RentPrice;
        existing.Deposit = input.Deposit;
        existing.WaterPrice = input.WaterPrice;
        existing.ElectricPrice = input.ElectricPrice;
        existing.ElevatorFee = input.ElevatorFee;
        existing.PropertyFee = input.PropertyFee;
        existing.InternetFee = input.InternetFee;
        existing.OtherFees = input.OtherFees;
        existing.Status = input.Status;
        existing.ContractImage = input.ContractImage;
        existing.Remark = input.Remark;
        existing.UpdatedTime = DateTimeOffset.Now;
        // 更新 Community 导航属性，以便 Mapster 映射 CommunityName
        existing.Community = community;

        var entry = await _repository.UpdateAsync(existing);
        await _repository.SaveNowAsync();

        return entry.Entity.Adapt<RoomDto>();
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var room = await _repository.FindAsync(id);
        if (room == null)
        {
            throw Oops.Oh($"房间 {id} 不存在");
        }

        // 仅检查活跃租约（在租中）——历史已退租记录不再阻止回收
        var hasActiveRental = await _rentalRecordRepository.AsQueryable(false)
            .AnyAsync(r => r.RoomId == id && r.Status == RentalStatus.Active);

        // 已出租 或 有活跃租约 → 必须先办理退租
        if (!CanReclaim(room.Status, hasActiveRental))
        {
            throw Oops.Oh("房间有在租租客，请先办理退租后再回收");
        }

        // 回收：转为 Reclaimed 状态（不物理删除），历史租赁记录保留可追溯
        room.Status = RoomStatus.Reclaimed;
        await _repository.UpdateAsync(room);
        await _repository.SaveNowAsync();
    }

    private const int LeaseAlertThresholdDays = 7;

    /// <summary>
    /// 判断房间是否可回收（转 Reclaimed 状态）。
    /// 已出租（Rented）必须先退租；有活跃租约的也不可回收。
    /// </summary>
    internal static bool CanReclaim(RoomStatus status, bool hasActiveRental)
    {
        if (status == RoomStatus.Rented) return false;
        if (hasActiveRental) return false;
        return true;
    }

    private static LeaseStatus CalculateLeaseStatus(DateTime? endDate)
    {
        if (!endDate.HasValue)
            return LeaseStatus.None;

        var today = DateTime.Today;
        var daysRemaining = (endDate.Value.Date - today).Days;

        if (daysRemaining < 0)
            return LeaseStatus.Expired;
        if (daysRemaining <= LeaseAlertThresholdDays)
            return LeaseStatus.ExpiringSoon;
        return LeaseStatus.Normal;
    }

    private static int? CalculateExpiredDays(DateTime? endDate)
    {
        if (!endDate.HasValue)
            return null;
        return (DateTime.Today - endDate.Value.Date).Days;
    }

    /// <summary>
    /// 提取字符串开头的数字，用于栋号/房号的自然数排序。
    /// 纯数字开头（如 "10栋""204"）返回数值；空或非数字开头返回 int.MaxValue 排到末尾。
    /// </summary>
    private static int ExtractLeadingNumber(string? s)
    {
        if (string.IsNullOrEmpty(s)) return int.MaxValue;
        var digits = new string(s.TakeWhile(char.IsDigit).ToArray());
        return int.TryParse(digits, out var n) ? n : int.MaxValue;
    }
}

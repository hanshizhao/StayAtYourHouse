using Gentle.Application.Dtos.Meter;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 水电抄表服务实现
/// </summary>
public class MeterService : IMeterService
{
    private readonly IRepository<MeterRecord> _meterRecordRepository;
    private readonly IRepository<UtilityBill> _utilityBillRepository;
    private readonly IRepository<Room> _roomRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;

    public MeterService(
        IRepository<MeterRecord> meterRecordRepository,
        IRepository<UtilityBill> utilityBillRepository,
        IRepository<Room> roomRepository,
        IRepository<RentalRecord> rentalRecordRepository)
    {
        _meterRecordRepository = meterRecordRepository;
        _utilityBillRepository = utilityBillRepository;
        _roomRepository = roomRepository;
        _rentalRecordRepository = rentalRecordRepository;
    }

    /// <inheritdoc />
    public async Task<(List<MeterRecordDto> Items, int Total)> GetListAsync(
        int? communityId = null,
        int? roomId = null,
        int page = 1,
        int pageSize = 20)
    {
        // 分页参数边界验证
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _meterRecordRepository
            .AsQueryable(false)
            .Include(m => m.Room)
                .ThenInclude(r => r.Community)
            .Include(m => m.UtilityBill)
            .AsQueryable();

        // 小区筛选
        if (communityId.HasValue)
        {
            query = query.Where(m => m.Room.CommunityId == communityId.Value);
        }

        // 房间筛选
        if (roomId.HasValue)
        {
            query = query.Where(m => m.RoomId == roomId.Value);
        }

        // 获取总数
        var total = await query.CountAsync();

        // 分页
        var items = await query
            .OrderByDescending(m => m.MeterDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToMeterRecordDto).ToList();
        return (dtos, total);
    }

    /// <inheritdoc />
    public async Task<(decimal WaterReading, decimal ElectricReading)> GetLastReadingsAsync(int roomId)
    {
        var lastRecord = await _meterRecordRepository
            .AsQueryable(false)
            .Where(m => m.RoomId == roomId)
            .OrderByDescending(m => m.MeterDate)
            .FirstOrDefaultAsync();

        if (lastRecord == null)
        {
            return (0, 0);
        }

        return (lastRecord.WaterReading, lastRecord.ElectricReading);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<MeterRecordDto> RecordAsync(RecordMeterInput input)
    {
        // 验证房间存在
        var room = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RoomId);

        if (room == null)
        {
            throw Oops.Oh($"房间 {input.RoomId} 不存在");
        }

        // 获取上次读数
        var (prevWaterReading, prevElectricReading) = await GetLastReadingsAsync(input.RoomId);

        // 验证读数递增
        if (input.WaterReading < prevWaterReading)
        {
            throw Oops.Oh($"本次水表读数 {input.WaterReading} 不能小于上次读数 {prevWaterReading}");
        }

        if (input.ElectricReading < prevElectricReading)
        {
            throw Oops.Oh($"本次电表读数 {input.ElectricReading} 不能小于上次读数 {prevElectricReading}");
        }

        // 计算用量
        var waterUsage = input.WaterReading - prevWaterReading;
        var electricUsage = input.ElectricReading - prevElectricReading;

        // 计算费用（使用房间单价，如果未设置则默认水费5元/吨，电费1元/度）
        var waterPrice = room.WaterPrice ?? 5m;
        var electricPrice = room.ElectricPrice ?? 1m;
        var waterFee = waterUsage * waterPrice;
        var electricFee = electricUsage * electricPrice;

        // 创建抄表记录
        var meterRecord = new MeterRecord
        {
            RoomId = input.RoomId,
            MeterDate = input.MeterDate,
            WaterReading = input.WaterReading,
            ElectricReading = input.ElectricReading,
            PrevWaterReading = prevWaterReading,
            PrevElectricReading = prevElectricReading,
            WaterUsage = waterUsage,
            ElectricUsage = electricUsage,
            WaterFee = waterFee,
            ElectricFee = electricFee,
            Remark = input.Remark
        };

        await _meterRecordRepository.InsertAsync(meterRecord);

        // 自动生成水电账单
        await CreateUtilityBillAsync(meterRecord, room);

        // 返回完整的 DTO
        return await GetMeterRecordByIdAsync(meterRecord.Id);
    }

    /// <inheritdoc />
    public async Task<(List<UtilityBillDto> Items, int Total)> GetBillsAsync(
        UtilityBillStatus? status = null,
        int? communityId = null,
        string? month = null,
        int page = 1,
        int pageSize = 20)
    {
        // 分页参数边界验证
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _utilityBillRepository
            .AsQueryable(false)
            .Include(b => b.Room)
                .ThenInclude(r => r.Community)
            .Include(b => b.BillTenant)
            .Include(b => b.MeterRecord)
            .AsQueryable();

        // 状态筛选
        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

        // 小区筛选
        if (communityId.HasValue)
        {
            query = query.Where(b => b.Room.CommunityId == communityId.Value);
        }

        // 月份筛选
        if (!string.IsNullOrEmpty(month) && DateTime.TryParse($"{month}-01", out var monthDate))
        {
            var monthEnd = monthDate.AddMonths(1).AddDays(-1);
            query = query.Where(b => b.PeriodStart >= monthDate && b.PeriodStart <= monthEnd);
        }

        // 获取总数
        var total = await query.CountAsync();

        // 分页
        var items = await query
            .OrderByDescending(b => b.PeriodStart)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToUtilityBillDto).ToList();
        return (dtos, total);
    }

    /// <inheritdoc />
    public async Task<UtilityBillDto> GetBillByIdAsync(int id)
    {
        var bill = await _utilityBillRepository
            .AsQueryable(false)
            .Include(b => b.Room)
                .ThenInclude(r => r.Community)
            .Include(b => b.BillTenant)
            .Include(b => b.MeterRecord)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null)
        {
            throw Oops.Oh($"水电账单 {id} 不存在");
        }

        return MapToUtilityBillDto(bill);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<UtilityBillDto> PayAsync(PayUtilityBillInput input)
    {
        var bill = await _utilityBillRepository
            .AsQueryable()
            .Include(b => b.Room)
                .ThenInclude(r => r.Community)
            .Include(b => b.BillTenant)
            .Include(b => b.MeterRecord)
            .FirstOrDefaultAsync(b => b.Id == input.BillId);

        if (bill == null)
        {
            throw Oops.Oh($"水电账单 {input.BillId} 不存在");
        }

        if (bill.Status == UtilityBillStatus.Paid)
        {
            throw Oops.Oh("该账单已收款，无法重复操作");
        }

        if (bill.Status == UtilityBillStatus.Merged)
        {
            throw Oops.Oh("该账单已合并到房租账单，无法单独收款");
        }

        // 更新账单状态
        bill.Status = UtilityBillStatus.Paid;
        bill.PaidAmount = input.PaidAmount ?? bill.TotalAmount;
        bill.PaidDate = DateTime.Today;

        if (!string.IsNullOrEmpty(input.Remark))
        {
            bill.Remark = string.IsNullOrEmpty(bill.Remark)
                ? input.Remark
                : $"{bill.Remark}; {input.Remark}";
        }

        await _utilityBillRepository.UpdateAsync(bill);

        return MapToUtilityBillDto(bill);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task DeleteRecordAsync(int id)
    {
        var record = await _meterRecordRepository
            .AsQueryable()
            .Include(m => m.UtilityBill)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"抄表记录 {id} 不存在");
        }

        if (record.UtilityBill != null && record.UtilityBill.Status != UtilityBillStatus.Pending)
        {
            throw Oops.Oh("该抄表记录已生成非待收取账单，无法删除。请先删除关联的账单。");
        }

        // 如果有待收取的账单，先删除账单
        if (record.UtilityBill != null)
        {
            await _utilityBillRepository.DeleteAsync(record.UtilityBill);
        }

        await _meterRecordRepository.DeleteAsync(record);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task DeleteBillAsync(int id)
    {
        var bill = await _utilityBillRepository
            .AsQueryable()
            .Include(b => b.MeterRecord)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null)
        {
            throw Oops.Oh($"水电账单 {id} 不存在");
        }

        if (bill.Status == UtilityBillStatus.Paid)
        {
            throw Oops.Oh("已收款的账单不能删除");
        }

        if (bill.Status == UtilityBillStatus.Merged)
        {
            throw Oops.Oh("已合并的账单不能删除");
        }

        var meterRecordId = bill.MeterRecordId;

        // 删除账单
        await _utilityBillRepository.DeleteAsync(bill);

        // 同时删除关联的抄表记录
        var meterRecord = await _meterRecordRepository.FindAsync(meterRecordId);
        if (meterRecord != null)
        {
            await _meterRecordRepository.DeleteAsync(meterRecord);
        }
    }

    /// <summary>
    /// 创建水电账单
    /// </summary>
    private async Task CreateUtilityBillAsync(MeterRecord meterRecord, Room room)
    {
        // 获取当前租客
        var activeRental = await _rentalRecordRepository
            .AsQueryable(false)
            .Where(r => r.RoomId == meterRecord.RoomId && r.Status == RentalStatus.Active)
            .FirstOrDefaultAsync();

        // 计算账单周期（从上次抄表日期到本次抄表日期）
        DateTime periodStart;
        if (meterRecord.PrevWaterReading == 0 && meterRecord.PrevElectricReading == 0)
        {
            // 首次抄表，默认上一个月
            periodStart = meterRecord.MeterDate.AddMonths(-1);
        }
        else
        {
            var lastMeterDate = await _meterRecordRepository
                .AsQueryable(false)
                .Where(m => m.RoomId == meterRecord.RoomId && m.MeterDate < meterRecord.MeterDate)
                .OrderByDescending(m => m.MeterDate)
                .Select(m => m.MeterDate)
                .FirstOrDefaultAsync();

            periodStart = lastMeterDate == default ? meterRecord.MeterDate.AddMonths(-1) : lastMeterDate;
        }

        var utilityBill = new UtilityBill
        {
            RoomId = meterRecord.RoomId,
            BillTenantId = activeRental?.RenterId,
            MeterRecordId = meterRecord.Id,
            PeriodStart = periodStart,
            PeriodEnd = meterRecord.MeterDate,
            WaterUsage = meterRecord.WaterUsage,
            ElectricUsage = meterRecord.ElectricUsage,
            WaterFee = meterRecord.WaterFee,
            ElectricFee = meterRecord.ElectricFee,
            TotalAmount = meterRecord.WaterFee + meterRecord.ElectricFee,
            Status = UtilityBillStatus.Pending
        };

        await _utilityBillRepository.InsertAsync(utilityBill);
    }

    /// <summary>
    /// 获取抄表记录详情
    /// </summary>
    private async Task<MeterRecordDto> GetMeterRecordByIdAsync(int id)
    {
        var record = await _meterRecordRepository
            .AsQueryable(false)
            .Include(m => m.Room)
                .ThenInclude(r => r.Community)
            .Include(m => m.UtilityBill)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"抄表记录 {id} 不存在");
        }

        return MapToMeterRecordDto(record);
    }

    /// <summary>
    /// 映射到 MeterRecordDto
    /// </summary>
    private static MeterRecordDto MapToMeterRecordDto(MeterRecord record)
    {
        var dto = record.Adapt<MeterRecordDto>();

        var room = record.Room;
        var community = room?.Community;

        dto.RoomInfo = room != null
            ? $"{community?.Name ?? "未知小区"} {room.Building}栋 {room.RoomNumber}号"
            : "未知房间";

        dto.WaterPrice = room?.WaterPrice;
        dto.ElectricPrice = room?.ElectricPrice;
        dto.HasBill = record.UtilityBill != null;

        return dto;
    }

    /// <summary>
    /// 映射到 UtilityBillDto
    /// </summary>
    private static UtilityBillDto MapToUtilityBillDto(UtilityBill bill)
    {
        var dto = bill.Adapt<UtilityBillDto>();

        var room = bill.Room;
        var community = room?.Community;
        var tenant = bill.BillTenant;

        dto.RoomInfo = room != null
            ? $"{community?.Name ?? "未知小区"} {room.Building}栋 {room.RoomNumber}号"
            : "未知房间";

        dto.TenantId = bill.BillTenantId;
        dto.TenantName = tenant?.Name;
        dto.PeriodStart = bill.PeriodStart;
        dto.PeriodEnd = bill.PeriodEnd;

        return dto;
    }
}

using Gentle.Application.Dtos.Report;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 统计报表服务实现
/// </summary>
public class ReportService : IReportService
{
    private readonly IRepository<Bill> _billRepository;
    private readonly IRepository<Room> _roomRepository;
    private readonly IRepository<Community> _communityRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;
    private readonly IRepository<UtilityBill> _utilityBillRepository;

    public ReportService(
        IRepository<Bill> billRepository,
        IRepository<Room> roomRepository,
        IRepository<Community> communityRepository,
        IRepository<RentalRecord> rentalRecordRepository,
        IRepository<UtilityBill> utilityBillRepository)
    {
        _billRepository = billRepository;
        _roomRepository = roomRepository;
        _communityRepository = communityRepository;
        _rentalRecordRepository = rentalRecordRepository;
        _utilityBillRepository = utilityBillRepository;
    }

    /// <inheritdoc />
    public async Task<IncomeReportDto> GetIncomeReportAsync(int year)
    {
        // 参数验证
        if (year < 2000 || year > DateTime.Today.Year + 1)
            throw Oops.Oh($"年份参数无效：{year}，请输入2000-{DateTime.Today.Year + 1}之间的年份");

        var yearStart = new DateTime(year, 1, 1);
        var yearEnd = new DateTime(year, 12, 31);

        // 获取已收款账单（租金）
        var paidBills = await _billRepository
            .AsQueryable(false)
            .Where(b => b.Status == BillStatus.Paid && b.PaidDate >= yearStart && b.PaidDate <= yearEnd)
            .ToListAsync();

        // 获取已收款水电账单
        var paidUtilityBills = await _utilityBillRepository
            .AsQueryable(false)
            .Where(b => b.Status == UtilityBillStatus.Paid && b.PaidDate >= yearStart && b.PaidDate <= yearEnd)
            .ToListAsync();

        // 计算年度总支出（成本）
        // 获取所有活跃租住记录关联的房间成本
        var activeRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Include(r => r.Room)
            .Where(r => r.CheckInDate <= yearEnd && (r.CheckOutDate == null || r.CheckOutDate >= yearStart))
            .ToListAsync();

        // 按月计算成本（简化计算：每个活跃租住记录按月计算成本）
        var monthlyExpenses = new decimal[12];
        foreach (var rental in activeRentals)
        {
            var startMonth = Math.Max(1, rental.CheckInDate.Month);
            var endMonth = rental.CheckOutDate?.Month ?? 12;

            if (rental.CheckInDate.Year < year) startMonth = 1;
            if (rental.CheckOutDate == null || rental.CheckOutDate.Value.Year > year) endMonth = 12;

            for (var m = startMonth; m <= endMonth; m++)
            {
                monthlyExpenses[m - 1] += rental.Room.CostPrice;
            }
        }

        // 按月汇总收入
        var monthlyDetails = new List<MonthlyIncomeDto>();
        for (var month = 1; month <= 12; month++)
        {
            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var rentIncome = paidBills
                .Where(b => b.PaidDate >= monthStart && b.PaidDate <= monthEnd)
                .Sum(b => b.PaidAmount ?? b.TotalAmount);

            var utilityIncome = paidUtilityBills
                .Where(b => b.PaidDate >= monthStart && b.PaidDate <= monthEnd)
                .Sum(b => b.PaidAmount ?? b.TotalAmount);

            monthlyDetails.Add(new MonthlyIncomeDto
            {
                Month = month,
                RentIncome = rentIncome,
                UtilityIncome = utilityIncome,
                Expense = monthlyExpenses[month - 1]
            });
        }

        return new IncomeReportDto
        {
            Year = year,
            TotalRentIncome = paidBills.Sum(b => b.PaidAmount ?? b.TotalAmount),
            TotalUtilityIncome = paidUtilityBills.Sum(b => b.PaidAmount ?? b.TotalAmount),
            TotalExpense = monthlyExpenses.Sum(),
            MonthlyDetails = monthlyDetails
        };
    }

    /// <inheritdoc />
    public async Task<HousingOverviewDto> GetHousingOverviewAsync()
    {
        // 获取所有房间及其小区信息
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .ToListAsync();

        // 获取活跃租住记录以计算空置天数
        var activeRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Where(r => r.Status == RentalStatus.Active)
            .ToListAsync();

        // 已退租的记录（用于计算空置天数）
        var terminatedRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Where(r => r.Status == RentalStatus.Terminated && r.CheckOutDate.HasValue)
            .GroupBy(r => r.RoomId)
            .Select(g => new { RoomId = g.Key, LastCheckOut = g.Max(r => r.CheckOutDate!.Value) })
            .ToListAsync();

        var today = DateTime.Today;

        // 按小区分组统计
        var communityStats = rooms
            .GroupBy(r => r.Community)
            .Select(g => new CommunityStatsDto
            {
                CommunityId = g.Key.Id,
                CommunityName = g.Key.Name,
                TotalRooms = g.Count(),
                RentedCount = g.Count(r => r.Status == RoomStatus.Rented),
                VacantCount = g.Count(r => r.Status == RoomStatus.Vacant),
                RenovatingCount = g.Count(r => r.Status == RoomStatus.Renovating)
            })
            .OrderBy(c => c.CommunityName)
            .ToList();

        // 获取空置房源列表
        var vacantRooms = rooms
            .Where(r => r.Status == RoomStatus.Vacant)
            .Select(r =>
            {
                var lastRental = terminatedRentals.FirstOrDefault(t => t.RoomId == r.Id);
                var vacantDays = lastRental != null
                    ? (int)(today - lastRental.LastCheckOut).TotalDays
                    : (int?)null;

                return new VacantRoomDto
                {
                    RoomId = r.Id,
                    CommunityName = r.Community.Name,
                    Building = r.Building,
                    RoomNumber = r.RoomNumber,
                    RentPrice = r.RentPrice,
                    CostPrice = r.CostPrice,
                    Area = r.Area,
                    RoomType = r.RoomType,
                    VacantDays = vacantDays
                };
            })
            .OrderBy(r => r.CommunityName)
            .ThenBy(r => r.Building)
            .ThenBy(r => r.RoomNumber)
            .ToList();

        return new HousingOverviewDto
        {
            TotalRooms = rooms.Count,
            RentedCount = rooms.Count(r => r.Status == RoomStatus.Rented),
            VacantCount = rooms.Count(r => r.Status == RoomStatus.Vacant),
            RenovatingCount = rooms.Count(r => r.Status == RoomStatus.Renovating),
            CommunityStats = communityStats,
            VacantRooms = vacantRooms
        };
    }

    /// <inheritdoc />
    public async Task<List<RoomProfitRankingDto>> GetRoomProfitRankingAsync(string sortBy = "monthly", int limit = 50)
    {
        // 参数边界验证
        if (limit < 1 || limit > 200) limit = 50;

        // 获取所有房间及关联信息
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .ToListAsync();

        // 获取当前活跃租住记录
        var activeRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Include(r => r.Renter)
            .Where(r => r.Status == RentalStatus.Active)
            .ToListAsync();

        var result = rooms.Select(room =>
        {
            var activeRental = activeRentals.FirstOrDefault(r => r.RoomId == room.Id);

            return new RoomProfitRankingDto
            {
                RoomId = room.Id,
                CommunityName = room.Community.Name,
                Building = room.Building,
                RoomNumber = room.RoomNumber,
                Status = room.Status.ToText(),
                CostPrice = room.CostPrice,
                RentPrice = room.RentPrice,
                CurrentTenantName = activeRental?.Renter.Name,
                Area = room.Area,
                RoomType = room.RoomType
            };
        });

        // 排序
        result = sortBy.ToLower() switch
        {
            "yearly" => result.OrderByDescending(r => r.MonthlyProfit * 12),
            _ => result.OrderByDescending(r => r.MonthlyProfit)
        };

        return result.Take(limit).ToList();
    }

    /// <inheritdoc />
    public async Task<CollectionReportDto> GetCollectionReportAsync(int year, int? month = null)
    {
        // 参数验证
        if (year < 2000 || year > DateTime.Today.Year + 1)
            throw Oops.Oh($"年份参数无效：{year}，请输入2000-{DateTime.Today.Year + 1}之间的年份");
        // month=0 表示全年统计，1-12 表示具体月份
        if (month.HasValue && month.Value != 0 && (month.Value < 1 || month.Value > 12))
            throw Oops.Oh($"月份参数无效：{month}，请输入0(全年)或1-12之间的月份");

        DateTime periodStart;
        DateTime periodEnd;

        // month=0 或 null 表示全年统计
        if (month.HasValue && month.Value > 0)
        {
            periodStart = new DateTime(year, month.Value, 1);
            periodEnd = periodStart.AddMonths(1).AddDays(-1);
        }
        else
        {
            periodStart = new DateTime(year, 1, 1);
            periodEnd = new DateTime(year, 12, 31);
        }

        var today = DateTime.Today;

        // 获取指定期间内到期的账单
        var bills = await _billRepository
            .AsQueryable(false)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Renter)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Room)
                    .ThenInclude(room => room.Community)
            .Where(b => b.DueDate >= periodStart && b.DueDate <= periodEnd)
            .ToListAsync();

        // 统计各项数据
        // 注意：pendingBills 排除已逾期的账单（DueDate < today），避免与 overdueBills 重复统计
        var totalBills = bills.Count;
        var totalAmount = bills.Sum(b => b.TotalAmount);
        var paidBills = bills.Where(b => b.Status == BillStatus.Paid).ToList();
        var pendingBills = bills.Where(b => b.Status == BillStatus.Pending && b.DueDate >= today).ToList();
        var overdueBills = bills.Where(b => b.Status == BillStatus.Overdue || (b.Status == BillStatus.Pending && b.DueDate < today)).ToList();
        var graceBills = bills.Where(b => b.Status == BillStatus.Grace).ToList();

        // 构建逾期名单
        var overdueList = overdueBills.Select(b => new OverdueBillDto
        {
            BillId = b.Id,
            TenantName = b.RentalRecord?.Renter?.Name ?? "未知租客",
            RoomInfo = b.RentalRecord?.Room != null
                ? $"{b.RentalRecord.Room.Community?.Name ?? "未知小区"} {b.RentalRecord.Room.Building}栋 {b.RentalRecord.Room.RoomNumber}"
                : "未知房间",
            DueDate = b.DueDate,
            TotalAmount = b.TotalAmount,
            OverdueDays = (int)(today - b.DueDate).TotalDays,
            PeriodText = $"{b.PeriodStart:yyyy-MM-dd} 至 {b.PeriodEnd:yyyy-MM-dd}"
        }).OrderBy(b => b.OverdueDays).ToList();

        // 构建宽限名单
        var graceList = graceBills.Where(b => b.GraceUntil.HasValue).Select(b => new GraceBillDto
        {
            BillId = b.Id,
            TenantName = b.RentalRecord?.Renter?.Name ?? "未知租客",
            RoomInfo = b.RentalRecord?.Room != null
                ? $"{b.RentalRecord.Room.Community?.Name ?? "未知小区"} {b.RentalRecord.Room.Building}栋 {b.RentalRecord.Room.RoomNumber}"
                : "未知房间",
            DueDate = b.DueDate,
            GraceUntil = b.GraceUntil!.Value,
            RemainingDays = Math.Max(0, (int)(b.GraceUntil!.Value - today).TotalDays),
            TotalAmount = b.TotalAmount,
            PeriodText = $"{b.PeriodStart:yyyy-MM-dd} 至 {b.PeriodEnd:yyyy-MM-dd}"
        }).OrderBy(b => b.RemainingDays).ToList();

        return new CollectionReportDto
        {
            Year = year,
            Month = month ?? 0,
            TotalBills = totalBills,
            TotalAmount = totalAmount,
            PaidBills = paidBills.Count,
            PaidAmount = paidBills.Sum(b => b.PaidAmount ?? b.TotalAmount),
            PendingBills = pendingBills.Count,
            PendingAmount = pendingBills.Sum(b => b.TotalAmount),
            OverdueBills = overdueBills.Count,
            OverdueAmount = overdueBills.Sum(b => b.TotalAmount),
            GraceBills = graceBills.Count,
            GraceAmount = graceBills.Sum(b => b.TotalAmount),
            OverdueList = overdueList,
            GraceList = graceList
        };
    }
}

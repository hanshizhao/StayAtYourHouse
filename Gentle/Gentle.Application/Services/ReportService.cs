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
    private readonly IRepository<Room> _roomRepository;
    private readonly IRepository<Community> _communityRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;
    private readonly IRepository<UtilityBill> _utilityBillRepository;

    public ReportService(
        IRepository<Room> roomRepository,
        IRepository<Community> communityRepository,
        IRepository<RentalRecord> rentalRecordRepository,
        IRepository<UtilityBill> utilityBillRepository)
    {
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

        // 获取已收款水电账单
        var paidUtilityBills = await _utilityBillRepository
            .AsQueryable(false)
            .Where(b => b.Status == UtilityBillStatus.Paid && b.PaidDate >= yearStart && b.PaidDate <= yearEnd)
            .ToListAsync();

        // 获取所有相关租住记录（用于计算租金收入、押金收入和成本）
        var relevantRentals = await _rentalRecordRepository
            .AsQueryable(false)
            .Include(r => r.Room)
                .ThenInclude(r => r.LandlordLease)
            .Where(r => r.CheckInDate <= yearEnd && (r.CheckOutDate == null || r.CheckOutDate >= yearStart))
            .ToListAsync();

        // 按月计算成本
        var monthlyExpenses = new decimal[12];
        foreach (var rental in relevantRentals)
        {
            var startMonth = Math.Max(1, rental.CheckInDate.Month);
            var endMonth = rental.CheckOutDate?.Month ?? 12;

            if (rental.CheckInDate.Year < year) startMonth = 1;
            if (rental.CheckOutDate == null || rental.CheckOutDate.Value.Year > year) endMonth = 12;

            for (var m = startMonth; m <= endMonth; m++)
            {
                monthlyExpenses[m - 1] += rental.Room.LandlordLease?.MonthlyRent ?? 0;
            }
        }

        // 按月计算租金收入（仅在入住月份一次性计入全部租金）
        var monthlyRentIncomes = new decimal[12];
        foreach (var rental in relevantRentals)
        {
            // 只有在当前年份入住的记录才计入租金收入
            if (rental.CheckInDate.Year == year)
            {
                var checkInMonth = rental.CheckInDate.Month;
                // 计算租期月数（从入住到合同结束）
                var leaseMonths = (rental.ContractEndDate.Year - rental.CheckInDate.Year) * 12
                                  + rental.ContractEndDate.Month - rental.CheckInDate.Month + 1;
                // 一次性在入住月份计入全部租金收入
                monthlyRentIncomes[checkInMonth - 1] += rental.MonthlyRent * leaseMonths;
            }
        }

        // 按月计算押金收入（仅在入住月份计入，且押金状态为已收）
        var monthlyDepositIncomes = new decimal[12];
        foreach (var rental in relevantRentals)
        {
            // 只有在当前年份入住且押金已收的记录才计入
            if (rental.CheckInDate.Year == year && rental.DepositStatus == DepositStatus.Received)
            {
                var checkInMonth = rental.CheckInDate.Month;
                monthlyDepositIncomes[checkInMonth - 1] += rental.Deposit;
            }
        }

        // 按月汇总
        var monthlyDetails = new List<MonthlyIncomeDto>();
        for (var month = 1; month <= 12; month++)
        {
            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var utilityIncome = paidUtilityBills
                .Where(b => b.PaidDate >= monthStart && b.PaidDate <= monthEnd)
                .Sum(b => b.PaidAmount ?? b.TotalAmount);

            monthlyDetails.Add(new MonthlyIncomeDto
            {
                Month = month,
                RentIncome = monthlyRentIncomes[month - 1],
                UtilityIncome = utilityIncome,
                DepositIncome = monthlyDepositIncomes[month - 1],
                Expense = monthlyExpenses[month - 1]
            });
        }

        return new IncomeReportDto
        {
            Year = year,
            TotalRentIncome = monthlyRentIncomes.Sum(),
            TotalUtilityIncome = paidUtilityBills.Sum(b => b.PaidAmount ?? b.TotalAmount),
            TotalDepositIncome = monthlyDepositIncomes.Sum(),
            TotalExpense = monthlyExpenses.Sum(),
            MonthlyDetails = monthlyDetails
        };
    }

    /// <inheritdoc />
    public async Task<HousingOverviewDto> GetHousingOverviewAsync()
    {
        // 获取所有房间及其小区信息（排除已收回房间）
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Include(r => r.LandlordLease)
            .Where(r => r.Status != RoomStatus.Reclaimed)
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
                    LandlordLeaseMonthlyRent = r.LandlordLease?.MonthlyRent,
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

        // 获取所有房间及关联信息（排除已收回房间）
        var rooms = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .Include(r => r.LandlordLease)
            .Where(r => r.Status != RoomStatus.Reclaimed)
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
                LandlordLeaseMonthlyRent = room.LandlordLease?.MonthlyRent,
                RentPrice = room.RentPrice,
                MonthlyProfit = room.RentPrice - (room.LandlordLease?.MonthlyRent ?? 0),
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
}

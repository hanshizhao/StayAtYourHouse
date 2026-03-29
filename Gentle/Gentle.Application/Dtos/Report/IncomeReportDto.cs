namespace Gentle.Application.Dtos.Report;

/// <summary>
/// 收支统计报表
/// </summary>
public class IncomeReportDto
{
    /// <summary>
    /// 年份
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// 年度租金总收入
    /// </summary>
    public decimal TotalRentIncome { get; set; }

    /// <summary>
    /// 年度水电费总收入
    /// </summary>
    public decimal TotalUtilityIncome { get; set; }

    /// <summary>
    /// 年度押金收入（不计入净利润）
    /// </summary>
    public decimal TotalDepositIncome { get; set; }

    /// <summary>
    /// 年度总收入（用于净利润计算，不含押金）
    /// </summary>
    public decimal TotalIncome => TotalRentIncome + TotalUtilityIncome;

    /// <summary>
    /// 年度总支出（成本）
    /// </summary>
    public decimal TotalExpense { get; set; }

    /// <summary>
    /// 年度净利润
    /// </summary>
    public decimal NetProfit => TotalIncome - TotalExpense;

    /// <summary>
    /// 月度明细
    /// </summary>
    public List<MonthlyIncomeDto> MonthlyDetails { get; set; } = new();
}

/// <summary>
/// 月度收入明细
/// </summary>
public class MonthlyIncomeDto
{
    /// <summary>
    /// 月份（1-12）
    /// </summary>
    public int Month { get; set; }

    /// <summary>
    /// 月份文本（如：2026年1月）
    /// </summary>
    public string MonthText => $"{Month}月";

    /// <summary>
    /// 租金收入
    /// </summary>
    public decimal RentIncome { get; set; }

    /// <summary>
    /// 水电费收入
    /// </summary>
    public decimal UtilityIncome { get; set; }

    /// <summary>
    /// 押金收入（不计入净利润）
    /// </summary>
    public decimal DepositIncome { get; set; }

    /// <summary>
    /// 总收入（用于净利润计算，不含押金）
    /// </summary>
    public decimal TotalIncome => RentIncome + UtilityIncome;

    /// <summary>
    /// 支出（成本）
    /// </summary>
    public decimal Expense { get; set; }

    /// <summary>
    /// 净利润
    /// </summary>
    public decimal NetProfit => TotalIncome - Expense;
}

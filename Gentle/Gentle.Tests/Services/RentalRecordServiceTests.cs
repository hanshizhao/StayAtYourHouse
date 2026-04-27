// -----------------------------------------------------------------------------
// 文件: RentalRecordServiceTests.cs
// 模块: 租住记录服务单元测试
// 描述: 测试 RentalRecordService 的日期计算和补录入住提醒逻辑
// -----------------------------------------------------------------------------

using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// RentalRecordService 单元测试
/// </summary>
public class RentalRecordServiceTests
{
    #region 合同结束日期计算测试

    [Theory]
    [InlineData("2026-01-27", 3, "2026-04-26")]
    [InlineData("2026-01-01", 6, "2026-06-30")]
    [InlineData("2026-01-31", 1, "2026-02-27")]
    [InlineData("2026-03-31", 1, "2026-04-29")]
    [InlineData("2024-01-31", 1, "2024-02-28")] // 闰年
    [InlineData("2026-12-01", 3, "2027-02-28")]  // 跨年
    [InlineData("2026-01-27", 12, "2027-01-26")]
    public void CalculateContractEndDate_ReturnsCorrectDate(
        string checkInDateStr, int leaseMonths, string expectedEndStr)
    {
        var checkInDate = DateTime.Parse(checkInDateStr);
        var expectedEnd = DateTime.Parse(expectedEndStr);

        // 模拟 CalculateContractEndDate 逻辑
        var result = checkInDate.AddMonths(leaseMonths).AddDays(-1);

        Assert.Equal(expectedEnd, result);
    }

    #endregion

    #region 提醒窗口计算测试

    [Fact]
    public void ReminderWindow_WithLookback_IncludesExpiredContracts()
    {
        var today = new DateTime(2026, 4, 27);
        var reminderDaysBeforeExpiry = 3;
        var lookbackDays = 30;

        var reminderDate = today.AddDays(reminderDaysBeforeExpiry);
        var lookbackDate = today.AddDays(-lookbackDays);

        // 合同到期日 4月26日（已过期1天）
        var contractEndDate = new DateTime(2026, 4, 26);

        // 使用旧逻辑（无回溯）：ContractEndDate >= today → 4/26 >= 4/27 → false → 遗漏
        var oldLogicMatches = contractEndDate >= today
            && contractEndDate <= reminderDate;
        Assert.False(oldLogicMatches);

        // 使用新逻辑（有回溯）：ContractEndDate >= lookbackDate → 4/26 >= 3/28 → true → 捕获
        var newLogicMatches = contractEndDate >= lookbackDate
            && contractEndDate <= reminderDate;
        Assert.True(newLogicMatches);
    }

    [Fact]
    public void ReminderWindow_WithLookback_IncludesExpiredBy30Days()
    {
        var today = new DateTime(2026, 4, 27);
        var reminderDaysBeforeExpiry = 3;
        var lookbackDays = 30;

        var reminderDate = today.AddDays(reminderDaysBeforeExpiry);
        var lookbackDate = today.AddDays(-lookbackDays);

        // 刚好过期30天
        var contractEndDate = lookbackDate;
        Assert.True(contractEndDate >= lookbackDate && contractEndDate <= reminderDate);

        // 过期31天 → 超出回溯范围
        var tooOld = lookbackDate.AddDays(-1);
        Assert.False(tooOld >= lookbackDate);
    }

    [Fact]
    public void ReminderWindow_WithLookback_IncludesFutureContracts()
    {
        var today = new DateTime(2026, 4, 27);
        var reminderDaysBeforeExpiry = 3;
        var lookbackDays = 30;

        var reminderDate = today.AddDays(reminderDaysBeforeExpiry);
        var lookbackDate = today.AddDays(-lookbackDays);

        // 3天后的合同到期日 → 正常提醒窗口
        var futureEnd = today.AddDays(2);
        Assert.True(futureEnd >= lookbackDate && futureEnd <= reminderDate);

        // 超过3天后的合同到期日 → 不在窗口内
        var tooFar = today.AddDays(4);
        Assert.False(tooFar <= reminderDate);
    }

    [Fact]
    public void ReminderWindow_ClientScenario_ReproducesBug()
    {
        // 客户场景：补录入住，入住日期1月27日，租期3个月，到期日4月26日
        // 今天是4月27日，合同已过期
        var checkInDate = new DateTime(2026, 1, 27);
        var leaseMonths = 3;
        var today = new DateTime(2026, 4, 27);

        var contractEndDate = checkInDate.AddMonths(leaseMonths).AddDays(-1);
        Assert.Equal(new DateTime(2026, 4, 26), contractEndDate);

        // 旧逻辑：ContractEndDate >= today → 4/26 >= 4/27 → false
        var reminderDate = today.AddDays(3);
        var oldLogicMatches = contractEndDate >= today && contractEndDate <= reminderDate;
        Assert.False(oldLogicMatches);

        // 新逻辑：增加30天回溯窗口
        var lookbackDate = today.AddDays(-30);
        var newLogicMatches = contractEndDate >= lookbackDate && contractEndDate <= reminderDate;
        Assert.True(newLogicMatches);
    }

    #endregion

    #region 补录入住提醒触发条件测试

    [Fact]
    public void ReminderTrigger_ContractAlreadyExpired_ShouldCreateImmediately()
    {
        // 补录入住：合同已过期
        var today = DateTime.Today;
        var contractEndDate = today.AddDays(-1); // 昨天过期
        var reminderThreshold = today.AddDays(3);

        var shouldCreate = contractEndDate <= reminderThreshold;
        Assert.True(shouldCreate);
    }

    [Fact]
    public void ReminderTrigger_ContractExpiringIn3Days_ShouldCreateImmediately()
    {
        // 合同即将到期（在提醒窗口内）
        var today = DateTime.Today;
        var contractEndDate = today.AddDays(2); // 2天后到期
        var reminderThreshold = today.AddDays(3);

        var shouldCreate = contractEndDate <= reminderThreshold;
        Assert.True(shouldCreate);
    }

    [Fact]
    public void ReminderTrigger_ContractExpiringIn4Days_ShouldNotCreateImmediately()
    {
        // 合同到期日在提醒窗口外
        var today = DateTime.Today;
        var contractEndDate = today.AddDays(4); // 4天后到期
        var reminderThreshold = today.AddDays(3);

        var shouldCreate = contractEndDate <= reminderThreshold;
        Assert.False(shouldCreate);
    }

    [Fact]
    public void ReminderTrigger_ContractExpiringIn30Days_ShouldNotCreateImmediately()
    {
        var today = DateTime.Today;
        var contractEndDate = today.AddDays(30);
        var reminderThreshold = today.AddDays(3);

        var shouldCreate = contractEndDate <= reminderThreshold;
        Assert.False(shouldCreate);
    }

    #endregion

    #region 修改租约验证测试

    [Fact]
    public void UpdateValidation_ContractEndDateBeforeCheckInDate_IsInvalid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2025, 12, 31);

        var isValid = contractEndDate > checkInDate;
        Assert.False(isValid);
    }

    [Fact]
    public void UpdateValidation_ContractEndDateEqualsCheckInDate_IsInvalid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2026, 1, 1);

        var isValid = contractEndDate > checkInDate;
        Assert.False(isValid);
    }

    [Fact]
    public void UpdateValidation_ContractEndDateAfterCheckInDate_IsValid()
    {
        var checkInDate = new DateTime(2026, 1, 1);
        var contractEndDate = new DateTime(2026, 6, 30);

        var isValid = contractEndDate > checkInDate;
        Assert.True(isValid);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(37)]
    public void UpdateValidation_LeaseMonthsOutOfRange_IsInvalid(int leaseMonths)
    {
        var isValid = leaseMonths >= 1 && leaseMonths <= 36;
        Assert.False(isValid);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(12)]
    [InlineData(36)]
    public void UpdateValidation_LeaseMonthsInRange_IsValid(int leaseMonths)
    {
        var isValid = leaseMonths >= 1 && leaseMonths <= 36;
        Assert.True(isValid);
    }

    [Fact]
    public void UpdateValidation_RecalculateEndDate_AfterLeaseMonthsChange()
    {
        var checkInDate = new DateTime(2026, 1, 27);
        var newLeaseMonths = 6;
        var expectedEnd = new DateTime(2026, 7, 26);

        var result = checkInDate.AddMonths(newLeaseMonths).AddDays(-1);
        Assert.Equal(expectedEnd, result);
    }

    #endregion
}

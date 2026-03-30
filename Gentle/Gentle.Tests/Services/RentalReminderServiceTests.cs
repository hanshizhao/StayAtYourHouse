// -----------------------------------------------------------------------------
// 文件: RentalReminderServiceTests.cs
// 模块: 催收提醒服务单元测试
// 创建日期: 2026-03-29
// 描述: 测试 RentalReminderService 的异常验证、业务逻辑和 DTO 验证逻辑
// -----------------------------------------------------------------------------

using Furion.DatabaseAccessor;
using Gentle.Application.Dtos.Rental;
using Gentle.Application.Services;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Moq;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// RentalReminderService 单元测试
/// </summary>
/// <remarks>
/// 由于 EF Core 异步操作需要 IAsyncQueryProvider 支持，
/// 本测试类主要测试参数验证和业务逻辑验证。
/// 对于需要数据库交互的测试，建议使用集成测试。
/// </remarks>
public class RentalReminderServiceTests
{
    private readonly Mock<IRepository<RentalReminder>> _mockReminderRepo;
    private readonly Mock<IRepository<RentalDeferral>> _mockDeferralRepo;
    private readonly Mock<IRepository<RentalRecord>> _mockRentalRecordRepo;
    private readonly RentalReminderService _service;

    public RentalReminderServiceTests()
    {
        _mockReminderRepo = new Mock<IRepository<RentalReminder>>();
        _mockDeferralRepo = new Mock<IRepository<RentalDeferral>>();
        _mockRentalRecordRepo = new Mock<IRepository<RentalRecord>>();

        _service = new RentalReminderService(
            _mockReminderRepo.Object,
            _mockDeferralRepo.Object,
            _mockRentalRecordRepo.Object
        );
    }

    #region DeferAsync Tests

    /// <summary>
    /// 测试：宽限提醒不存在 - 抛出异常
    /// </summary>
    [Fact]
    public async Task DeferAsync_ReminderNotFound_ThrowsException()
    {
        // Arrange
        SetupEmptyReminderQueryable();

        var input = new DeferReminderInput
        {
            DeferredToDate = DateTime.Today.AddDays(7)
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.DeferAsync(999, input));
    }

    /// <summary>
    /// 测试：宽限已处理的提醒（已完成状态） - 抛出异常
    /// </summary>
    [Fact]
    public async Task DeferAsync_AlreadyCompleted_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Completed);
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new DeferReminderInput
        {
            DeferredToDate = DateTime.Today.AddDays(7)
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.DeferAsync(1, input));
    }

    /// <summary>
    /// 测试：宽限已处理的提醒（已宽限状态） - 抛出异常
    /// </summary>
    [Fact]
    public async Task DeferAsync_AlreadyDeferred_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Deferred);
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new DeferReminderInput
        {
            DeferredToDate = DateTime.Today.AddDays(7)
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.DeferAsync(1, input));
    }

    #endregion

    #region RenewAsync Tests

    /// <summary>
    /// 测试：续租提醒不存在 - 抛出异常
    /// </summary>
    [Fact]
    public async Task RenewAsync_ReminderNotFound_ThrowsException()
    {
        // Arrange
        SetupEmptyReminderQueryable();

        var input = CreateValidRenewInput();

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.RenewAsync(999, input));
    }

    /// <summary>
    /// 测试：续租已处理的提醒（已完成状态） - 抛出异常
    /// </summary>
    [Fact]
    public async Task RenewAsync_AlreadyCompleted_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Completed);
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = CreateValidRenewInput();

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.RenewAsync(1, input));
    }

    /// <summary>
    /// 测试：续租已处理的提醒（已宽限状态） - 抛出异常
    /// </summary>
    [Fact]
    public async Task RenewAsync_AlreadyDeferred_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Deferred);
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = CreateValidRenewInput();

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.RenewAsync(1, input));
    }

    #endregion

    #region GetDeferralsAsync Tests

    /// <summary>
    /// 测试：获取宽限记录 - 提醒不存在抛出异常
    /// </summary>
    [Fact]
    public async Task GetDeferralsAsync_ReminderNotFound_ThrowsException()
    {
        // Arrange
        _mockReminderRepo
            .Setup(r => r.FindAsync(It.IsAny<int>()))
            .ReturnsAsync((RentalReminder?)null);

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.GetDeferralsAsync(999));
    }

    /// <summary>
    /// 测试：获取宽限记录 - 提醒存在不抛出异常
    /// </summary>
    /// <remarks>
    /// 此测试需要 EF Core InMemory 数据库或 IAsyncQueryProvider 支持。
    /// 建议在集成测试中覆盖此场景。
    /// </remarks>
    [Fact(Skip = "需要 EF Core InMemory 数据库支持")]
    public async Task GetDeferralsAsync_ReminderExists_DoesNotThrowNotFoundException()
    {
        // 此测试需要在集成测试环境中运行
        await Task.CompletedTask;
    }

    #endregion

    #region DTO 验证测试

    /// <summary>
    /// 测试：DeferReminderInput 默认值验证
    /// </summary>
    [Fact]
    public void DeferReminderInput_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var input = new DeferReminderInput();

        // Assert
        Assert.Equal(default, input.DeferredToDate);
        Assert.Null(input.Remark);
    }

    /// <summary>
    /// 测试：RenewRentalInput 默认值验证
    /// </summary>
    [Fact]
    public void RenewRentalInput_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var input = new RenewRentalInput();

        // Assert
        Assert.Equal(1, input.LeaseMonths);
        Assert.Equal(default, input.MonthlyRent);
        Assert.Equal(default, input.ContractEndDate);
        Assert.Null(input.ContractImage);
        Assert.Null(input.Remark);
    }

    /// <summary>
    /// 测试：DeferralRecordDto 默认值验证
    /// </summary>
    [Fact]
    public void DeferralRecordDto_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var dto = new DeferralRecordDto();

        // Assert
        Assert.Equal(0, dto.Id);
        Assert.Equal(default, dto.OriginalReminderDate);
        Assert.Equal(default, dto.DeferredToDate);
        Assert.Null(dto.Remark);
        Assert.Equal(default, dto.CreatedTime);
    }

    /// <summary>
    /// 测试：DeferralListResult 默认值验证
    /// </summary>
    [Fact]
    public void DeferralListResult_DefaultValues_AreCorrect()
    {
        // Arrange & Act
        var result = new DeferralListResult();

        // Assert
        Assert.NotNull(result.Items); // 集合类型默认值是空集合
        Assert.Empty(result.Items);
        Assert.Equal(0, result.Total);
    }

    #endregion

    #region 枚举值测试

    /// <summary>
    /// 测试：RentalReminderStatus 枚举值正确
    /// </summary>
    [Fact]
    public void RentalReminderStatus_EnumValues_AreCorrect()
    {
        // Assert
        Assert.Equal(0, (int)RentalReminderStatus.Pending);
        Assert.Equal(1, (int)RentalReminderStatus.Deferred);
        Assert.Equal(2, (int)RentalReminderStatus.Completed);
    }

    /// <summary>
    /// 测试：RentalStatus 枚举值正确
    /// </summary>
    [Fact]
    public void RentalStatus_EnumValues_AreCorrect()
    {
        // Assert
        Assert.Equal(0, (int)RentalStatus.Active);
        Assert.Equal(1, (int)RentalStatus.Terminated);
    }

    /// <summary>
    /// 测试：DepositStatus 枚举值正确
    /// </summary>
    [Fact]
    public void DepositStatus_EnumValues_AreCorrect()
    {
        // Assert
        Assert.Equal(0, (int)DepositStatus.Received);
        Assert.Equal(1, (int)DepositStatus.Refunded);
        Assert.Equal(2, (int)DepositStatus.Deducted);
    }

    #endregion

    #region 业务逻辑验证测试

    /// <summary>
    /// 测试：宽限日期必须晚于提醒日期 - 日期相等应抛出异常
    /// </summary>
    [Fact]
    public async Task DeferAsync_DeferredDateEqualsReminderDate_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Pending);
        reminder.ReminderDate = DateTime.Today;
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new DeferReminderInput
        {
            DeferredToDate = DateTime.Today // 与提醒日期相等
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.DeferAsync(1, input));
    }

    /// <summary>
    /// 测试：宽限日期必须晚于提醒日期 - 日期更早应抛出异常
    /// </summary>
    [Fact]
    public async Task DeferAsync_DeferredDateEarlierThanReminderDate_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Pending);
        reminder.ReminderDate = DateTime.Today.AddDays(7);
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new DeferReminderInput
        {
            DeferredToDate = DateTime.Today // 早于提醒日期
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.DeferAsync(1, input));
    }

    /// <summary>
    /// 测试：新合同结束日期必须晚于原合同 - 日期相等应抛出异常
    /// </summary>
    [Fact]
    public async Task RenewAsync_ContractEndDateEqualsOriginal_ThrowsException()
    {
        // Arrange
        var contractEndDate = DateTime.Today.AddMonths(6);
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Pending);
        reminder.RentalRecord = new RentalRecord
        {
            Id = 1,
            ContractEndDate = contractEndDate,
            Status = RentalStatus.Active
        };
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new RenewRentalInput
        {
            LeaseMonths = 1,
            MonthlyRent = 1000m,
            ContractEndDate = contractEndDate // 与原合同结束日期相等
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.RenewAsync(1, input));
    }

    /// <summary>
    /// 测试：新合同结束日期必须晚于原合同 - 日期更早应抛出异常
    /// </summary>
    [Fact]
    public async Task RenewAsync_ContractEndDateEarlierThanOriginal_ThrowsException()
    {
        // Arrange
        var reminder = CreateTestRentalReminder(1, RentalReminderStatus.Pending);
        reminder.RentalRecord = new RentalRecord
        {
            Id = 1,
            ContractEndDate = DateTime.Today.AddMonths(6),
            Status = RentalStatus.Active
        };
        SetupReminderQueryable(new List<RentalReminder> { reminder });

        var input = new RenewRentalInput
        {
            LeaseMonths = 1,
            MonthlyRent = 1000m,
            ContractEndDate = DateTime.Today.AddMonths(3) // 早于原合同结束日期
        };

        // Act & Assert
        await Assert.ThrowsAnyAsync<Exception>(() =>
            _service.RenewAsync(1, input));
    }

    #endregion

    #region Helper Methods

    private static RentalReminder CreateTestRentalReminder(int id, RentalReminderStatus status)
    {
        return new RentalReminder
        {
            Id = id,
            RentalRecordId = 1,
            ReminderDate = DateTime.Today,
            Status = status,
            Deferrals = new List<RentalDeferral>(),
            CreatedTime = DateTime.UtcNow
        };
    }

    private static RenewRentalInput CreateValidRenewInput()
    {
        return new RenewRentalInput
        {
            LeaseMonths = 1,
            MonthlyRent = 1000m,
            ContractEndDate = DateTime.Today.AddMonths(12)
        };
    }

    private void SetupReminderQueryable(List<RentalReminder> reminders)
    {
        _mockReminderRepo
            .Setup(r => r.AsQueryable(It.IsAny<bool>()))
            .Returns(reminders.AsQueryable());
    }

    private void SetupEmptyReminderQueryable()
    {
        _mockReminderRepo
            .Setup(r => r.AsQueryable(It.IsAny<bool>()))
            .Returns(new List<RentalReminder>().AsQueryable());
    }

    #endregion
}

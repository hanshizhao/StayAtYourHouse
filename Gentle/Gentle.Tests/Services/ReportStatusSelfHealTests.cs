using Gentle.Application.Services;
using Gentle.Core.Enums;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// 空置房源统计自愈逻辑单元测试。
/// 通过 ReportService.IsVacantRoomActuallyRented 纯静态方法验证
/// "标记为空置但实际已入住"的判定。
/// </summary>
public class ReportStatusSelfHealTests
{
    [Theory]
    [InlineData(RoomStatus.Vacant, true, true)]    // 标记空置但有活跃租约 → 应修正
    [InlineData(RoomStatus.Vacant, false, false)]  // 标记空置且无租约 → 正常空置
    [InlineData(RoomStatus.Rented, true, false)]   // 已出租 → 无需修正
    [InlineData(RoomStatus.Rented, false, false)]  // 已出租无租约 → 无需修正
    public void IsVacantRoomActuallyRented_Decision(RoomStatus status, bool hasActiveRental, bool expected)
    {
        Assert.Equal(expected, ReportService.IsVacantRoomActuallyRented(status, hasActiveRental));
    }
}

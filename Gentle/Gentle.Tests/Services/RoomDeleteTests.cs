using Gentle.Application.Services;
using Gentle.Core.Enums;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// 房间回收（DeleteAsync 语义改为转 Reclaimed 状态）逻辑单元测试。
/// 通过 RoomService.CanReclaim 纯静态方法验证回收判定。
/// </summary>
public class RoomDeleteTests
{
    [Theory]
    [InlineData(RoomStatus.Vacant, false, true)]      // 空置 + 无活跃租约 → 可回收
    [InlineData(RoomStatus.Renovating, false, true)]  // 装修中 + 无活跃租约 → 可回收
    [InlineData(RoomStatus.Reclaimed, false, true)]   // 已回收 + 无活跃租约 → 幂等回收
    [InlineData(RoomStatus.Rented, false, false)]     // 已出租 → 不可回收（应先退租）
    [InlineData(RoomStatus.Vacant, true, false)]      // 空置但有活跃租约 → 不可回收
    [InlineData(RoomStatus.Renovating, true, false)]  // 装修中但有活跃租约 → 不可回收
    [InlineData(RoomStatus.Reclaimed, true, false)]   // 已回收但有活跃租约 → 不可回收
    public void CanReclaim_Decision(RoomStatus status, bool hasActiveRental, bool expected)
    {
        Assert.Equal(expected, RoomService.CanReclaim(status, hasActiveRental));
    }
}

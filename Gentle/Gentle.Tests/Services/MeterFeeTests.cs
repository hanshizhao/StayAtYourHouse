using Gentle.Application.Services;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// 抄表固定费用合计计算单元测试。
/// 验证 MeterService.SumFixedFees 正确合计电梯/物业/网络/其他费用（null 视为 0）。
/// </summary>
public class MeterFeeTests
{
    [Fact]
    public void SumFixedFees_AllNull_ReturnsZero()
    {
        Assert.Equal(0m, MeterService.SumFixedFees(null, null, null, null));
    }

    [Fact]
    public void SumFixedFees_SumsAllWithNullSkipped()
    {
        Assert.Equal(70m, MeterService.SumFixedFees(30m, 20m, null, 20m));
    }

    [Theory]
    [InlineData(0, 0, 0, 0, 0)]
    [InlineData(30, 20, 15, 10, 75)]
    public void SumFixedFees_Cases(decimal e, decimal p, decimal i, decimal o, decimal expected)
    {
        Assert.Equal(expected, MeterService.SumFixedFees(e, p, i, o));
    }
}

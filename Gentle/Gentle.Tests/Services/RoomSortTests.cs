using System.Reflection;
using Gentle.Application.Services;
using Xunit;

namespace Gentle.Tests.Services;

/// <summary>
/// 房间列表自然数排序单元测试。
/// 通过反射调用 RoomService 的私有静态方法 ExtractLeadingNumber，
/// 验证栋号/房号按自然数排序（10栋 排在 2栋 之后而非之前）。
/// </summary>
public class RoomSortTests
{
    // 通过反射调用私有静态方法 ExtractLeadingNumber
    private static int InvokeExtract(string? s)
    {
        var method = typeof(RoomService)
            .GetMethod("ExtractLeadingNumber", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(method);
        return (int)method!.Invoke(null, new object?[] { s })!;
    }

    [Theory]
    [InlineData("10栋", 10)]
    [InlineData("2栋", 2)]
    [InlineData("204", 204)]
    [InlineData("1", 1)]
    public void ExtractLeadingNumber_ParsesLeadingDigits(string input, int expected)
    {
        Assert.Equal(expected, InvokeExtract(input));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ExtractLeadingNumber_NullOrEmpty_ReturnsMaxValue(string? input)
    {
        Assert.Equal(int.MaxValue, InvokeExtract(input));
    }

    [Theory]
    [InlineData("东栋")]      // 非数字开头
    public void ExtractLeadingNumber_NonDigitStart_ReturnsMaxValue(string input)
    {
        Assert.Equal(int.MaxValue, InvokeExtract(input));
    }

    [Fact]
    public void ExtractLeadingNumber_NaturalOrder()
    {
        // 模拟排序：1,2,10,11 应升序，而非字典序 1,10,11,2
        var buildings = new[] { "10栋", "2栋", "11栋", "1栋" };
        var sorted = buildings.OrderBy(InvokeExtract).Select(x => x).ToArray();
        Assert.Equal(new[] { "1栋", "2栋", "10栋", "11栋" }, sorted);
    }
}

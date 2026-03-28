namespace Gentle.Core.Enums;

/// <summary>
/// RoomStatus 枚举扩展方法
/// </summary>
public static class RoomStatusExtensions
{
    /// <summary>
    /// 获取房间状态的中文文本
    /// </summary>
    public static string ToText(this RoomStatus status)
    {
        return status switch
        {
            RoomStatus.Vacant => "空置",
            RoomStatus.Rented => "已出租",
            RoomStatus.Renovating => "装修中",
            RoomStatus.Reclaimed => "已收回",
            _ => "未知"
        };
    }
}

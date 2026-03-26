using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Meter;

/// <summary>
/// 抄表录入输入
/// </summary>
public class RecordMeterInput
{
    /// <summary>
    /// 房间ID
    /// </summary>
    [Required(ErrorMessage = "房间ID不能为空")]
    public int RoomId { get; set; }

    /// <summary>
    /// 抄表日期
    /// </summary>
    [Required(ErrorMessage = "抄表日期不能为空")]
    public DateTime MeterDate { get; set; }

    /// <summary>
    /// 本次水表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "水表读数不能为负数")]
    public decimal WaterReading { get; set; }

    /// <summary>
    /// 本次电表读数
    /// </summary>
    [Range(0, double.MaxValue, ErrorMessage = "电表读数不能为负数")]
    public decimal ElectricReading { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}

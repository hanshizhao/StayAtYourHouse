namespace Gentle.Application.Dtos.Meter;

/// <summary>
/// 抄表记录 DTO
/// </summary>
public class MeterRecordDto
{
    /// <summary>
    /// 记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 房间信息（小区+楼栋+房间号）
    /// </summary>
    public string RoomInfo { get; set; } = string.Empty;

    /// <summary>
    /// 抄表日期
    /// </summary>
    public DateTime MeterDate { get; set; }

    /// <summary>
    /// 抄表日期文本
    /// </summary>
    public string MeterDateText => MeterDate.ToString("yyyy-MM-dd");

    /// <summary>
    /// 本次水表读数
    /// </summary>
    public decimal WaterReading { get; set; }

    /// <summary>
    /// 本次电表读数
    /// </summary>
    public decimal ElectricReading { get; set; }

    /// <summary>
    /// 上次水表读数
    /// </summary>
    public decimal PrevWaterReading { get; set; }

    /// <summary>
    /// 上次电表读数
    /// </summary>
    public decimal PrevElectricReading { get; set; }

    /// <summary>
    /// 本次用水量（吨）
    /// </summary>
    public decimal WaterUsage { get; set; }

    /// <summary>
    /// 本次用电量（度）
    /// </summary>
    public decimal ElectricUsage { get; set; }

    /// <summary>
    /// 水费单价（元/吨）
    /// </summary>
    public decimal? WaterPrice { get; set; }

    /// <summary>
    /// 电费单价（元/度）
    /// </summary>
    public decimal? ElectricPrice { get; set; }

    /// <summary>
    /// 水费（元）
    /// </summary>
    public decimal WaterFee { get; set; }

    /// <summary>
    /// 电费（元）
    /// </summary>
    public decimal ElectricFee { get; set; }

    /// <summary>
    /// 总费用（元）
    /// </summary>
    public decimal TotalFee => WaterFee + ElectricFee;

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 是否已生成账单
    /// </summary>
    public bool HasBill { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}

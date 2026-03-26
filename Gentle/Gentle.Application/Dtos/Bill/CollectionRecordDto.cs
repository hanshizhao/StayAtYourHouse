using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Bill;

/// <summary>
/// 催收记录 DTO
/// </summary>
public class CollectionRecordDto
{
    /// <summary>
    /// 记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 账单ID
    /// </summary>
    public int BillId { get; set; }

    /// <summary>
    /// 催收日期
    /// </summary>
    public DateTime CollectDate { get; set; }

    /// <summary>
    /// 催收结果
    /// </summary>
    public CollectResult Result { get; set; }

    /// <summary>
    /// 催收结果文本
    /// </summary>
    public string ResultText => Result switch
    {
        CollectResult.Success => "催收成功",
        CollectResult.Grace => "宽限处理",
        CollectResult.Refuse => "拒绝支付",
        _ => "未知"
    };

    /// <summary>
    /// 宽限截止日期
    /// </summary>
    public DateTime? GraceUntil { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}

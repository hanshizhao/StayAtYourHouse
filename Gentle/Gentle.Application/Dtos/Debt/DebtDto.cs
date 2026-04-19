using System.ComponentModel.DataAnnotations;
using Gentle.Core.Enums;

namespace Gentle.Application.Dtos.Debt;

/// <summary>
/// 欠款列表项 DTO
/// </summary>
public class DebtListDto
{
    /// <summary>
    /// 欠款ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租客ID
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 租客电话
    /// </summary>
    public string? TenantPhone { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 已还金额
    /// </summary>
    public decimal PaidAmount { get; set; }

    /// <summary>
    /// 剩余欠款
    /// </summary>
    public decimal RemainingAmount => TotalAmount - PaidAmount;

    /// <summary>
    /// 欠款状态
    /// </summary>
    public DebtStatus Status { get; set; }

    /// <summary>
    /// 欠款状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        DebtStatus.Ongoing => "进行中",
        DebtStatus.Settled => "已结清",
        _ => "未知"
    };

    /// <summary>
    /// 欠款说明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}

/// <summary>
/// 欠款详情 DTO
/// </summary>
public class DebtDetailDto
{
    /// <summary>
    /// 欠款ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租客ID
    /// </summary>
    public int TenantId { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    public string TenantName { get; set; } = string.Empty;

    /// <summary>
    /// 租客电话
    /// </summary>
    public string? TenantPhone { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 已还金额
    /// </summary>
    public decimal PaidAmount { get; set; }

    /// <summary>
    /// 剩余欠款
    /// </summary>
    public decimal RemainingAmount => TotalAmount - PaidAmount;

    /// <summary>
    /// 欠款状态
    /// </summary>
    public DebtStatus Status { get; set; }

    /// <summary>
    /// 欠款状态文本
    /// </summary>
    public string StatusText => Status switch
    {
        DebtStatus.Ongoing => "进行中",
        DebtStatus.Settled => "已结清",
        _ => "未知"
    };

    /// <summary>
    /// 欠款说明
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }

    /// <summary>
    /// 还款记录
    /// </summary>
    public List<DebtRepaymentDto> Repayments { get; set; } = [];
}

/// <summary>
/// 还款记录 DTO
/// </summary>
public class DebtRepaymentDto
{
    /// <summary>
    /// 还款记录ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 欠款ID
    /// </summary>
    public int DebtId { get; set; }

    /// <summary>
    /// 还款金额
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// 还款日期
    /// </summary>
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// 还款方式
    /// </summary>
    public PaymentChannel PaymentChannel { get; set; }

    /// <summary>
    /// 还款方式文本
    /// </summary>
    public string PaymentChannelText => PaymentChannel switch
    {
        PaymentChannel.Cash => "现金",
        PaymentChannel.WeChat => "微信",
        PaymentChannel.Alipay => "支付宝",
        PaymentChannel.BankTransfer => "银行转账",
        _ => "未知"
    };

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }
}

/// <summary>
/// 欠款列表查询参数
/// </summary>
public class DebtListInput
{
    /// <summary>
    /// 搜索关键字（租客姓名/电话）
    /// </summary>
    public string? Keyword { get; set; }

    /// <summary>
    /// 欠款状态筛选
    /// </summary>
    public DebtStatus? Status { get; set; }

    /// <summary>
    /// 页码（从1开始）
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// 欠款列表分页结果
/// </summary>
public class DebtListResult
{
    /// <summary>
    /// 欠款列表
    /// </summary>
    public List<DebtListDto> List { get; set; } = [];

    /// <summary>
    /// 总记录数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 当前页码
    /// </summary>
    public int Page { get; set; }

    /// <summary>
    /// 每页数量
    /// </summary>
    public int PageSize { get; set; }
}

/// <summary>
/// 新增欠款输入
/// </summary>
public class CreateDebtInput
{
    /// <summary>
    /// 租客ID
    /// </summary>
    [Required(ErrorMessage = "租客ID不能为空")]
    public int TenantId { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 欠款说明
    /// </summary>
    [MaxLength(500, ErrorMessage = "欠款说明长度不能超过500个字符")]
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}

/// <summary>
/// 编辑欠款输入
/// </summary>
public class UpdateDebtInput
{
    /// <summary>
    /// 欠款ID
    /// </summary>
    [Required(ErrorMessage = "欠款ID不能为空")]
    public int Id { get; set; }

    /// <summary>
    /// 总欠款金额
    /// </summary>
    [Required(ErrorMessage = "欠款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "欠款金额必须大于0")]
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// 欠款说明
    /// </summary>
    [MaxLength(500, ErrorMessage = "欠款说明长度不能超过500个字符")]
    public string? Description { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}

/// <summary>
/// 添加还款输入
/// </summary>
public class AddRepaymentInput
{
    /// <summary>
    /// 还款金额
    /// </summary>
    [Required(ErrorMessage = "还款金额不能为空")]
    [Range(0.01, double.MaxValue, ErrorMessage = "还款金额必须大于0")]
    public decimal Amount { get; set; }

    /// <summary>
    /// 还款日期
    /// </summary>
    [Required(ErrorMessage = "还款日期不能为空")]
    public DateTime PaymentDate { get; set; }

    /// <summary>
    /// 还款方式
    /// </summary>
    public PaymentChannel PaymentChannel { get; set; } = PaymentChannel.Cash;

    /// <summary>
    /// 备注
    /// </summary>
    [MaxLength(500, ErrorMessage = "备注长度不能超过500个字符")]
    public string? Remark { get; set; }
}

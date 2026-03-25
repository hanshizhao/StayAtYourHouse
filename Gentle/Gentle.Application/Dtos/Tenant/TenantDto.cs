using Gentle.Core.Enums;
using System.ComponentModel.DataAnnotations;

namespace Gentle.Application.Dtos.Tenant;

/// <summary>
/// 租客列表查询参数
/// </summary>
public class TenantListInput
{
    /// <summary>
    /// 搜索关键字（姓名/电话/身份证号/房间信息）
    /// </summary>
    public string? Keyword { get; set; }

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
/// 分页租客列表结果
/// </summary>
public class TenantListResult
{
    /// <summary>
    /// 租客列表
    /// </summary>
    public List<TenantDto> List { get; set; } = [];

    /// <summary>
    /// 总数量
    /// </summary>
    public int Total { get; set; }
}

/// <summary>
/// 当前房间信息（简化版)
/// </summary>
public class CurrentRoomInfoDto
{
    /// <summary>
    /// 房间ID
    /// </summary>
    public int RoomId { get; set; }

    /// <summary>
    /// 小区名称
    /// </summary>
    public string CommunityName { get; set; } = string.Empty;

    /// <summary>
    /// 楼栋
    /// </summary>
    public string Building { get; set; } = string.Empty;

    /// <summary>
    /// 房间号
    /// </summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>
    /// 完整房间信息(如: "xx小区 1栋 101")
    /// </summary>
    public string FullInfo => $"{CommunityName} {Building} {RoomNumber}";
}

/// <summary>
/// 租客列表项
/// </summary>
public class TenantDto
{
    /// <summary>
    /// 租客ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// 租客姓名
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 联系电话
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 身份证号
    /// </summary>
    public string? IdCard { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    public Gender Gender { get; set; }

    /// <summary>
    /// 性别文本
    /// </summary>
    public string GenderText => Gender == Gender.Male ? "男" : "女";

    /// <summary>
    /// 紧急联系人
    /// </summary>
    public string? EmergencyContact { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTimeOffset CreatedTime { get; set; }

    /// <summary>
    /// 当前房间信息(如果有活跃租住记录)
    /// </summary>
    public CurrentRoomInfoDto? CurrentRoom { get; set; }

    /// <summary>
    /// 当前活跃租住记录ID(用于退租)
    /// </summary>
    public int? RentalRecordId { get; set; }

    /// <summary>
    /// 租住状态(如果有活跃租住记录)
    /// </summary>
    public RentalStatus? Status { get; set; }

    /// <summary>
    /// 租住状态文本
    /// </summary>
    public string? StatusText => Status switch
    {
        RentalStatus.Active => "在租",
        RentalStatus.Terminated => "已退租",
        _ => null
    };
}

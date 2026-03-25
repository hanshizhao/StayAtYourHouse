using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Furion.DatabaseAccessor;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Core.Entities;

/// <summary>
/// 租客实体
/// </summary>
public class Tenant : Entity<int>, IEntitySeedData<Tenant>
{
    /// <summary>
    /// 租客姓名
    /// </summary>
    [Required(ErrorMessage = "租客姓名不能为空")]
    [MaxLength(50, ErrorMessage = "租客姓名长度不能超过50个字符")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 联系电话
    /// </summary>
    [Required(ErrorMessage = "联系电话不能为空")]
    [MaxLength(20, ErrorMessage = "联系电话长度不能超过20个字符")]
    [RegularExpression(@"^1[3-9]\d{9}$", ErrorMessage = "手机号格式不正确")]
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// 身份证号
    /// </summary>
    [MinLength(15, ErrorMessage = "身份证号长度不能少于15个字符")]
    [MaxLength(18, ErrorMessage = "身份证号长度不能超过18个字符")]
    [RegularExpression(@"^(\d{15}|\d{18}|\d{17}[\dXx])$", ErrorMessage = "身份证号格式不正确")]
    public string? IdCard { get; set; }

    /// <summary>
    /// 性别
    /// </summary>
    public Gender Gender { get; set; } = Gender.Male;

    /// <summary>
    /// 紧急联系人
    /// </summary>
    [MaxLength(100, ErrorMessage = "紧急联系人长度不能超过100个字符")]
    public string? EmergencyContact { get; set; }

    /// <summary>
    /// 备注
    /// </summary>
    public string? Remark { get; set; }

    /// <summary>
    /// 配置种子数据
    /// </summary>
    public IEnumerable<Tenant> HasData(DbContext dbContext, Type dbContextLocator)
    {
        return new[]
        {
            new Tenant
            {
                Id = 1,
                Name = "张三",
                Phone = "13800138001",
                IdCard = "110101199001011234",
                Gender = Gender.Male,
                EmergencyContact = "张父 13900139001",
                CreatedTime = DateTime.Parse("2024-01-01")
            },
            new Tenant
            {
                Id = 2,
                Name = "李四",
                Phone = "13800138002",
                IdCard = "110101199002022345",
                Gender = Gender.Female,
                EmergencyContact = "李母 13900139002",
                CreatedTime = DateTime.Parse("2024-01-01")
            }
        };
    }
}

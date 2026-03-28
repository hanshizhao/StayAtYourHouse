using Gentle.Application.Dtos.RentalRecord;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 租住管理应用服务
/// </summary>
[ApiDescriptionSettings("Rental", Name = "RentalApp", Order = 20)]
[Route("api/rental")]
[Authorize]
public class RentalAppService : IDynamicApiController
{
    private readonly IRentalRecordService _rentalRecordService;

    public RentalAppService(IRentalRecordService rentalRecordService)
    {
        _rentalRecordService = rentalRecordService;
    }

    /// <summary>
    /// 获取租住记录列表
    /// </summary>
    /// <param name="status">状态筛选（active/terminated）</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="tenantId">租客ID筛选</param>
    [HttpGet("list")]
    public async Task<List<RentalRecordDto>> GetList(string? status = null, int? roomId = null, int? tenantId = null)
    {
        RentalStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status))
        {
            statusEnum = status.ToLower() switch
            {
                "active" => RentalStatus.Active,
                "terminated" => RentalStatus.Terminated,
                _ => null
            };
        }

        return await _rentalRecordService.GetListAsync(statusEnum, roomId, tenantId);
    }

    /// <summary>
    /// 分页获取租住记录列表（含关联账单）
    /// </summary>
    /// <param name="status">状态筛选（active/terminated）</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="tenantId">租客ID筛选</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量（默认20）</param>
    [HttpGet("page")]
    public async Task<RentalRecordListResult> GetPage(string? status = null, int? roomId = null, int? tenantId = null, int page = 1, int pageSize = 20)
    {
        RentalStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status))
        {
            statusEnum = status.ToLower() switch
            {
                "active" => RentalStatus.Active,
                "terminated" => RentalStatus.Terminated,
                _ => null
            };
        }

        // 分页参数边界保护
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var (items, total) = await _rentalRecordService.GetPagedListAsync(statusEnum, roomId, tenantId, page, pageSize);

        return new RentalRecordListResult
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// 根据ID获取租住记录
    /// </summary>
    [HttpGet("{id}")]
    public async Task<RentalRecordDto> GetById(int id)
    {
        return await _rentalRecordService.GetByIdAsync(id);
    }

    /// <summary>
    /// 入住办理
    /// </summary>
    [HttpPost("check-in")]
    public async Task<RentalRecordDto> CheckIn(CheckInInput input)
    {
        return await _rentalRecordService.CheckInAsync(input);
    }

    /// <summary>
    /// 退租办理
    /// </summary>
    [HttpPost("check-out")]
    public async Task<RentalRecordDto> CheckOut(CheckOutInput input)
    {
        return await _rentalRecordService.CheckOutAsync(input);
    }

    /// <summary>
    /// 删除租住记录
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _rentalRecordService.DeleteAsync(id);
    }
}

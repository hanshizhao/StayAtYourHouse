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

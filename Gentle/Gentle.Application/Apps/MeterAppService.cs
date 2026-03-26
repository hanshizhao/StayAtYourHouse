using Gentle.Application.Dtos.Meter;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 水电抄表管理应用服务
/// </summary>
[ApiDescriptionSettings("Meter", Name = "MeterApp", Order = 40)]
[Route("api/meter-app")]
[Authorize]
public class MeterAppService : IDynamicApiController
{
    private readonly IMeterService _meterService;

    public MeterAppService(IMeterService meterService)
    {
        _meterService = meterService;
    }

    #region 抄表记录

    /// <summary>
    /// 获取抄表记录列表
    /// </summary>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    [HttpGet("get-list")]
    public async Task<MeterListResult> GetList(
        int? communityId = null,
        int? roomId = null,
        int page = 1,
        int pageSize = 20)
    {
        var (items, total) = await _meterService.GetListAsync(communityId, roomId, page, pageSize);
        return new MeterListResult
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// 获取房间上次抄表读数
    /// </summary>
    /// <param name="roomId">房间ID</param>
    [HttpGet("get-last-readings/{roomId}")]
    public async Task<LastReadingsResult> GetLastReadings(int roomId)
    {
        var (waterReading, electricReading) = await _meterService.GetLastReadingsAsync(roomId);
        return new LastReadingsResult
        {
            WaterReading = waterReading,
            ElectricReading = electricReading
        };
    }

    /// <summary>
    /// 录入抄表记录
    /// </summary>
    /// <param name="input">抄表录入输入</param>
    [HttpPost("record")]
    public async Task<MeterRecordDto> Record(RecordMeterInput input)
    {
        // 设置默认抄表日期为今天
        if (input.MeterDate == default)
        {
            input.MeterDate = DateTime.Today;
        }

        return await _meterService.RecordAsync(input);
    }

    /// <summary>
    /// 删除抄表记录
    /// </summary>
    /// <param name="id">抄表记录ID</param>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _meterService.DeleteRecordAsync(id);
    }

    #endregion

    #region 水电账单

    /// <summary>
    /// 获取水电账单列表
    /// </summary>
    /// <param name="status">状态筛选（pending/paid/merged）</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="month">月份筛选（格式：yyyy-MM）</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    [HttpGet("get-utility-bills")]
    public async Task<UtilityBillListResult> GetUtilityBills(
        string? status = null,
        int? communityId = null,
        string? month = null,
        int page = 1,
        int pageSize = 20)
    {
        UtilityBillStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status))
        {
            statusEnum = status.ToLower() switch
            {
                "pending" => UtilityBillStatus.Pending,
                "paid" => UtilityBillStatus.Paid,
                "merged" => UtilityBillStatus.Merged,
                _ => null
            };
        }

        var (items, total) = await _meterService.GetBillsAsync(statusEnum, communityId, month, page, pageSize);
        return new UtilityBillListResult
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    /// <summary>
    /// 根据ID获取水电账单详情
    /// </summary>
    /// <param name="id">账单ID</param>
    [HttpGet("get-utility-bill/{id}")]
    public async Task<UtilityBillDto> GetUtilityBill(int id)
    {
        return await _meterService.GetBillByIdAsync(id);
    }

    /// <summary>
    /// 收取水电费
    /// </summary>
    /// <param name="input">收款输入</param>
    [HttpPost("pay")]
    public async Task<UtilityBillDto> Pay(PayUtilityBillInput input)
    {
        return await _meterService.PayAsync(input);
    }

    /// <summary>
    /// 删除水电账单
    /// </summary>
    /// <param name="id">账单ID</param>
    [HttpDelete("remove-utility-bill/{id}")]
    public async Task RemoveUtilityBill(int id)
    {
        await _meterService.DeleteBillAsync(id);
    }

    #endregion
}

/// <summary>
/// 上次抄表读数结果
/// </summary>
public class LastReadingsResult
{
    /// <summary>
    /// 上次水表读数
    /// </summary>
    public decimal WaterReading { get; set; }

    /// <summary>
    /// 上次电表读数
    /// </summary>
    public decimal ElectricReading { get; set; }
}

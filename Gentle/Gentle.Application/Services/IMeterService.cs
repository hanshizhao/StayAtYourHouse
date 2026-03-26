using Gentle.Application.Dtos.Meter;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 水电抄表服务接口
/// </summary>
public interface IMeterService : ITransient
{
    /// <summary>
    /// 获取抄表记录列表
    /// </summary>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>抄表记录列表和总数</returns>
    Task<(List<MeterRecordDto> Items, int Total)> GetListAsync(
        int? communityId = null,
        int? roomId = null,
        int page = 1,
        int pageSize = 20);

    /// <summary>
    /// 获取房间上次抄表读数
    /// </summary>
    /// <param name="roomId">房间ID</param>
    /// <returns>上次抄表读数（水表、电表），如果没有记录返回 (0, 0)</returns>
    Task<(decimal WaterReading, decimal ElectricReading)> GetLastReadingsAsync(int roomId);

    /// <summary>
    /// 录入抄表记录（自动计算用量和费用，生成水电账单）
    /// </summary>
    /// <param name="input">抄表录入输入</param>
    /// <returns>抄表记录</returns>
    Task<MeterRecordDto> RecordAsync(RecordMeterInput input);

    /// <summary>
    /// 获取水电账单列表
    /// </summary>
    /// <param name="status">状态筛选</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="month">月份筛选（格式：yyyy-MM）</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>水电账单列表和总数</returns>
    Task<(List<UtilityBillDto> Items, int Total)> GetBillsAsync(
        UtilityBillStatus? status = null,
        int? communityId = null,
        string? month = null,
        int page = 1,
        int pageSize = 20);

    /// <summary>
    /// 根据ID获取水电账单详情
    /// </summary>
    /// <param name="id">账单ID</param>
    /// <returns>水电账单详情</returns>
    Task<UtilityBillDto> GetBillByIdAsync(int id);

    /// <summary>
    /// 收取水电费
    /// </summary>
    /// <param name="input">收款输入</param>
    /// <returns>更新后的账单</returns>
    Task<UtilityBillDto> PayAsync(PayUtilityBillInput input);

    /// <summary>
    /// 删除抄表记录（仅限未生成账单或账单为待收取状态的记录）
    /// </summary>
    /// <param name="id">抄表记录ID</param>
    Task DeleteRecordAsync(int id);

    /// <summary>
    /// 根据ID获取抄表记录详情
    /// </summary>
    /// <param name="id">抄表记录ID</param>
    /// <returns>抄表记录详情</returns>
    Task<MeterRecordDto> GetRecordByIdAsync(int id);

    /// <summary>
    /// 删除水电账单（仅限待收取状态）
    /// </summary>
    /// <param name="id">账单ID</param>
    Task DeleteBillAsync(int id);
}

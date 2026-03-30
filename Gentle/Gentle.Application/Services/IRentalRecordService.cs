using Gentle.Application.Dtos.RentalRecord;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 租住记录服务接口
/// </summary>
public interface IRentalRecordService : ITransient
{
    /// <summary>
    /// 获取租住记录列表
    /// </summary>
    /// <param name="status">状态筛选（可选）</param>
    /// <param name="roomId">房间ID筛选（可选）</param>
    /// <param name="tenantId">租客ID筛选（可选）</param>
    Task<List<RentalRecordDto>> GetListAsync(RentalStatus? status = null, int? roomId = null, int? tenantId = null);

    /// <summary>
    /// 分页获取租住记录列表（含关联账单）
    /// </summary>
    /// <param name="status">状态筛选（可选）</param>
    /// <param name="roomId">房间ID筛选（可选）</param>
    /// <param name="tenantId">租客ID筛选（可选）</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量</param>
    Task<(List<RentalRecordDto> Items, int Total)> GetPagedListAsync(RentalStatus? status = null, int? roomId = null, int? tenantId = null, int page = 1, int pageSize = 20);

    /// <summary>
    /// 根据ID获取租住记录
    /// </summary>
    Task<RentalRecordDto> GetByIdAsync(int id);

    /// <summary>
    /// 入住办理
    /// </summary>
    Task<RentalRecordDto> CheckInAsync(CheckInInput input);

    /// <summary>
    /// 退租办理
    /// </summary>
    Task<RentalRecordDto> CheckOutAsync(CheckOutInput input);

    /// <summary>
    /// 删除租住记录
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// 确认安居码已提交
    /// </summary>
    Task<RentalRecordDto> ConfirmAnJuCodeAsync(int id);
}

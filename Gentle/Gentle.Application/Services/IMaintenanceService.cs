using Gentle.Application.Dtos.Maintenance;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 维修管理服务接口
/// </summary>
public interface IMaintenanceService : ITransient
{
    /// <summary>
    /// 获取维修记录列表
    /// </summary>
    /// <param name="status">状态筛选</param>
    /// <param name="priority">优先级筛选</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="page">页码</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>维修记录列表和总数</returns>
    Task<(List<MaintenanceDetailDto> Items, int Total)> GetListAsync(
        MaintenanceStatus? status = null,
        MaintenancePriority? priority = null,
        int? roomId = null,
        int? communityId = null,
        int page = 1,
        int pageSize = 20);

    /// <summary>
    /// 根据ID获取维修记录详情
    /// </summary>
    /// <param name="id">维修记录ID</param>
    /// <returns>维修记录详情</returns>
    Task<MaintenanceDetailDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增维修记录
    /// </summary>
    /// <param name="input">新增输入</param>
    /// <returns>新增后的维修记录</returns>
    Task<MaintenanceDetailDto> AddAsync(MaintenanceAddInput input);

    /// <summary>
    /// 更新维修记录
    /// </summary>
    /// <param name="input">更新输入</param>
    /// <returns>更新后的维修记录</returns>
    Task<MaintenanceDetailDto> UpdateAsync(MaintenanceUpdateInput input);

    /// <summary>
    /// 完成维修
    /// </summary>
    /// <param name="id">维修记录ID</param>
    /// <param name="input">完成输入</param>
    /// <returns>完成后的维修记录</returns>
    Task<MaintenanceDetailDto> CompleteAsync(int id, CompleteMaintenanceInput input);

    /// <summary>
    /// 删除维修记录
    /// </summary>
    /// <param name="id">维修记录ID</param>
    Task DeleteAsync(int id);
}

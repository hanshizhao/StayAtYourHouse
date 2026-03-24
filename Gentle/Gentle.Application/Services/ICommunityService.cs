using Gentle.Core.Entities;

namespace Gentle.Application.Services;

/// <summary>
/// 小区服务接口
/// </summary>
public interface ICommunityService : ITransient
{
    /// <summary>
    /// 获取小区列表
    /// </summary>
    Task<List<Community>> GetListAsync();

    /// <summary>
    /// 根据ID获取小区
    /// </summary>
    Task<Community> GetByIdAsync(int id);

    /// <summary>
    /// 新增小区
    /// </summary>
    Task<Community> AddAsync(Community community);

    /// <summary>
    /// 保存小区（新增或更新）
    /// </summary>
    Task<Community> SaveAsync(Community community);

    /// <summary>
    /// 更新小区
    /// </summary>
    Task<Community> UpdateAsync(Community community);

    /// <summary>
    /// 删除小区
    /// </summary>
    Task DeleteAsync(int id);
}

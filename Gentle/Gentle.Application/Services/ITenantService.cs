using Gentle.Application.Dtos.Tenant;

namespace Gentle.Application.Services;

/// <summary>
/// 租客服务接口
/// </summary>
public interface ITenantService : ITransient
{
    /// <summary>
    /// 获取租客列表
    /// </summary>
    Task<List<TenantDto>> GetListAsync(string? keyword);

    /// <summary>
    /// 根据ID获取租客
    /// </summary>
    Task<TenantDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增租客
    /// </summary>
    Task<TenantDto> AddAsync(CreateTenantInput input);

    /// <summary>
    /// 更新租客
    /// </summary>
    Task<TenantDto> UpdateAsync(UpdateTenantInput input);

    /// <summary>
    /// 删除租客
    /// </summary>
    Task DeleteAsync(int id);
}

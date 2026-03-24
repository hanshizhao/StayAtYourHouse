using Gentle.Application.Dtos.Community;

namespace Gentle.Application.Services;

/// <summary>
/// 小区服务接口
/// </summary>
public interface ICommunityService : ITransient
{
    /// <summary>
    /// 获取小区列表
    /// </summary>
    Task<List<CommunityDto>> GetListAsync();

    /// <summary>
    /// 根据ID获取小区
    /// </summary>
    Task<CommunityDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增小区
    /// </summary>
    Task<CommunityDto> AddAsync(CreateCommunityInput input);

    /// <summary>
    /// 更新小区
    /// </summary>
    Task<CommunityDto> UpdateAsync(UpdateCommunityInput input);

    /// <summary>
    /// 删除小区
    /// </summary>
    Task DeleteAsync(int id);
}

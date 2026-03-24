using Gentle.Application.Dtos.Community;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 小区管理应用服务
/// </summary>
[ApiDescriptionSettings("Housing", Name = "Community", Order = 1)]
[Route("api/community")]
[Authorize]
public class CommunityAppService : IDynamicApiController
{
    private readonly ICommunityService _communityService;

    public CommunityAppService(ICommunityService communityService)
    {
        _communityService = communityService;
    }

    /// <summary>
    /// 获取小区列表
    /// </summary>
    [HttpGet("list")]
    public async Task<List<CommunityDto>> GetList()
    {
        return await _communityService.GetListAsync();
    }

    /// <summary>
    /// 根据ID获取小区
    /// </summary>
    [HttpGet("{id}")]
    public async Task<CommunityDto> GetById(int id)
    {
        return await _communityService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增小区
    /// </summary>
    [HttpPost("add")]
    public async Task<CommunityDto> Add(CreateCommunityInput input)
    {
        return await _communityService.AddAsync(input);
    }

    /// <summary>
    /// 更新小区
    /// </summary>
    [HttpPut("edit")]
    public async Task<CommunityDto> Edit(UpdateCommunityInput input)
    {
        return await _communityService.UpdateAsync(input);
    }

    /// <summary>
    /// 删除小区
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _communityService.DeleteAsync(id);
    }
}

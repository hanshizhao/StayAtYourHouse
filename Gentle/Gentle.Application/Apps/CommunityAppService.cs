using Gentle.Application.Services;
using Gentle.Core.Entities;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 小区管理应用服务
/// </summary>
[Route("api/community")]
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
    public async Task<List<Community>> GetList()
    {
        return await _communityService.GetListAsync();
    }

    /// <summary>
    /// 根据ID获取小区
    /// </summary>
    [HttpGet("{id}")]
    public async Task<Community> GetById(int id)
    {
        return await _communityService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增小区
    /// </summary>
    [HttpPost("add")]
    public async Task<Community> Add(Community community)
    {
        return await _communityService.AddAsync(community);
    }

    /// <summary>
    /// 更新小区
    /// </summary>
    [HttpPut("edit")]
    public async Task<Community> Edit(Community community)
    {
        return await _communityService.UpdateAsync(community);
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

using Gentle.Application.Dtos.Tenant;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 租客管理应用服务
/// </summary>
[ApiDescriptionSettings("Tenant", Name = "TenantApp", Order = 10)]
[Route("api/tenant-app")]
[Authorize]
public class TenantAppService : IDynamicApiController
{
    private readonly ITenantService _tenantService;

    public TenantAppService(ITenantService tenantService)
    {
        _tenantService = tenantService;
    }

    /// <summary>
    /// 获取租客列表（支持关键字搜索）
    /// </summary>
    /// <param name="keyword">搜索关键字（姓名/电话/身份证号）</param>
    [HttpGet("list")]
    public async Task<List<TenantDto>> GetList(string? keyword = null)
    {
        return await _tenantService.GetListAsync(keyword);
    }

    /// <summary>
    /// 根据ID获取租客
    /// </summary>
    [HttpGet("{id}")]
    public async Task<TenantDto> GetById(int id)
    {
        return await _tenantService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增租客
    /// </summary>
    [HttpPost("add")]
    public async Task<TenantDto> Add(CreateTenantInput input)
    {
        return await _tenantService.AddAsync(input);
    }

    /// <summary>
    /// 更新租客
    /// </summary>
    [HttpPut("edit")]
    public async Task<TenantDto> Edit(UpdateTenantInput input)
    {
        return await _tenantService.UpdateAsync(input);
    }

    /// <summary>
    /// 删除租客
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _tenantService.DeleteAsync(id);
    }
}

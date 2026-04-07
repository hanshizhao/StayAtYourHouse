using System.ComponentModel.DataAnnotations;
using Gentle.Application.Dtos.Maintenance;
using Gentle.Application.Services;
using Gentle.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 维修管理应用服务
/// </summary>
/// <remarks>
/// 提供维修记录的增删改查、完成维修等操作。
/// </remarks>
[ApiDescriptionSettings("Maintenance", Name = "MaintenanceApp", Order = 40)]
[Route("api/maintenance")]
[Authorize]
public class MaintenanceAppService : IDynamicApiController
{
    private readonly IMaintenanceService _maintenanceService;

    public MaintenanceAppService(IMaintenanceService maintenanceService)
    {
        _maintenanceService = maintenanceService;
    }

    /// <summary>
    /// 获取维修记录列表
    /// </summary>
    /// <param name="status">状态筛选（Pending/InProgress/Completed）</param>
    /// <param name="priority">优先级筛选（Urgent/Normal/Low）</param>
    /// <param name="roomId">房间ID筛选</param>
    /// <param name="communityId">小区ID筛选</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量（默认20）</param>
    /// <returns>维修记录列表和总数</returns>
    [HttpGet("list")]
    public async Task<MaintenanceListResult> GetList(
        MaintenanceStatus? status = null,
        MaintenancePriority? priority = null,
        int? roomId = null,
        int? communityId = null,
        int page = 1,
        int pageSize = 20)
    {
        // 分页参数边界保护
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var (items, total) = await _maintenanceService.GetListAsync(status, priority, roomId, communityId, page, pageSize);
        return new MaintenanceListResult { Items = items, Total = total, Page = page, PageSize = pageSize };
    }

    /// <summary>
    /// 根据ID获取维修记录详情
    /// </summary>
    /// <param name="id">维修记录ID</param>
    /// <returns>维修记录详情</returns>
    [HttpGet("{id}")]
    public async Task<MaintenanceDetailDto> GetById([Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id)
    {
        return await _maintenanceService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增维修记录
    /// </summary>
    /// <param name="input">新增输入</param>
    /// <returns>新增后的维修记录</returns>
    [HttpPost("add")]
    public async Task<MaintenanceDetailDto> Add(MaintenanceAddInput input)
    {
        return await _maintenanceService.AddAsync(input);
    }

    /// <summary>
    /// 更新维修记录
    /// </summary>
    /// <param name="input">更新输入</param>
    /// <returns>更新后的维修记录</returns>
    [HttpPut("edit")]
    public async Task<MaintenanceDetailDto> Edit(MaintenanceUpdateInput input)
    {
        return await _maintenanceService.UpdateAsync(input);
    }

    /// <summary>
    /// 完成维修
    /// </summary>
    /// <param name="id">维修记录ID</param>
    /// <param name="input">完成输入</param>
    /// <returns>完成后的维修记录</returns>
    [HttpPost("{id}/complete")]
    public async Task<MaintenanceDetailDto> Complete(
        [Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id,
        CompleteMaintenanceInput input)
    {
        return await _maintenanceService.CompleteAsync(id, input);
    }

    /// <summary>
    /// 删除维修记录
    /// </summary>
    /// <param name="id">维修记录ID</param>
    [HttpDelete("remove/{id}")]
    public async Task Remove([Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id)
    {
        await _maintenanceService.DeleteAsync(id);
    }
}

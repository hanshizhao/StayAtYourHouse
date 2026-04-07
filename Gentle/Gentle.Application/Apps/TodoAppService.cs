using System.ComponentModel.DataAnnotations;
using Gentle.Application.Dtos.Rental;
using Gentle.Application.Dtos.Todo;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 待办事项应用服务
/// </summary>
/// <remarks>
/// 提供待办事项列表查询、催收提醒宽限、续租处理等功能。
/// </remarks>
[ApiDescriptionSettings("Todo", Name = "TodoApp", Order = 30)]
[Route("api/todo")]
[Authorize]
public class TodoAppService : IDynamicApiController
{
    private readonly ITodoService _todoService;
    private readonly IRentalReminderService _rentalReminderService;

    public TodoAppService(
        ITodoService todoService,
        IRentalReminderService rentalReminderService)
    {
        _todoService = todoService;
        _rentalReminderService = rentalReminderService;
    }

    /// <summary>
    /// 获取待办事项列表
    /// </summary>
    /// <param name="type">待办类型筛选（utility=水电费, rental=催收房租, maintenance=维修, null=全部）</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量（默认20）</param>
    /// <returns>待办事项列表结果</returns>
    [HttpGet("list")]
    public async Task<TodoListResult> GetList(string? type = null, int page = 1, int pageSize = 20)
    {
        // 参数验证
        if (type is not null and not ("utility" or "rental" or "maintenance"))
        {
            throw Oops.Oh("待办类型参数无效，仅支持 utility、rental 或 maintenance");
        }

        // 分页参数边界保护
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        return await _todoService.GetTodoListAsync(type, page, pageSize);
    }

    /// <summary>
    /// 宽限催收提醒
    /// </summary>
    /// <param name="id">催收提醒ID</param>
    /// <param name="input">宽限输入参数</param>
    /// <remarks>
    /// 创建宽限记录，更新提醒状态为 Deferred，并创建新的催收提醒。
    /// </remarks>
    [HttpPost("rental-reminder/{id}/defer")]
    public async Task Defer([Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id, DeferReminderInput input)
    {
        await _rentalReminderService.DeferAsync(id, input);
    }

    /// <summary>
    /// 续租处理
    /// </summary>
    /// <param name="id">催收提醒ID</param>
    /// <param name="input">续租输入参数</param>
    /// <returns>新租赁记录ID</returns>
    /// <remarks>
    /// 创建新的租赁记录，继承押金，更新原租赁记录状态为已完成。
    /// </remarks>
    [HttpPost("rental-reminder/{id}/renew")]
    public async Task<int> Renew([Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id, RenewRentalInput input)
    {
        return await _rentalReminderService.RenewAsync(id, input);
    }

    /// <summary>
    /// 获取宽限记录列表
    /// </summary>
    /// <param name="id">催收提醒ID</param>
    /// <returns>宽限记录列表结果</returns>
    [HttpGet("rental-reminder/{id}/deferrals")]
    public async Task<DeferralListResult> GetDeferrals([Range(1, int.MaxValue, ErrorMessage = "ID 必须大于 0")] int id)
    {
        return await _rentalReminderService.GetDeferralsAsync(id);
    }
}

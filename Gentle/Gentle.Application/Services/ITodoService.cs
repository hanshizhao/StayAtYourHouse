using Gentle.Application.Dtos.Todo;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 待办事项服务接口
/// </summary>
/// <remarks>
/// 聚合水电费和催收房租待办事项的服务接口。
/// </remarks>
public interface ITodoService : ITransient
{
    /// <summary>
    /// 获取待办事项列表
    /// </summary>
    /// <param name="type">待办类型筛选：null=全部, "utility"=水电费, "rental"=催收房租</param>
    /// <param name="page">页码（从1开始）</param>
    /// <param name="pageSize">每页数量</param>
    /// <returns>待办事项列表结果</returns>
    Task<TodoListResult> GetTodoListAsync(string? type, int page, int pageSize);
}

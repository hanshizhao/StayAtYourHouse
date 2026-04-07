namespace Gentle.Application.Dtos.Todo;

/// <summary>
/// 待办事项列表结果
/// </summary>
/// <remarks>
/// 包含水电费、催收房租和维修待办的聚合列表结果。
/// </remarks>
public class TodoListResult
{
    /// <summary>
    /// 待办事项列表
    /// </summary>
    public List<TodoItemDto> Items { get; set; } = [];

    /// <summary>
    /// 待办总数
    /// </summary>
    public int Total { get; set; }

    /// <summary>
    /// 水电费待办数量
    /// </summary>
    public int UtilityCount { get; set; }

    /// <summary>
    /// 催收房租待办数量
    /// </summary>
    public int RentalCount { get; set; }

    /// <summary>
    /// 维修待办数量
    /// </summary>
    public int MaintenanceCount { get; set; }
}

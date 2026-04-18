using Gentle.Application.Dtos.Room;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 房间服务接口
/// </summary>
public interface IRoomService : ITransient
{
    /// <summary>
    /// 获取房间列表（支持筛选和分页）
    /// </summary>
    Task<RoomListResult> GetListAsync(RoomListInput input);

    /// <summary>
    /// 根据ID获取房间
    /// </summary>
    Task<RoomDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增房间
    /// </summary>
    Task<RoomDto> AddAsync(CreateRoomInput input);

    /// <summary>
    /// 更新房间
    /// </summary>
    Task<RoomDto> UpdateAsync(UpdateRoomInput input);

    /// <summary>
    /// 删除房间
    /// </summary>
    Task DeleteAsync(int id);
}

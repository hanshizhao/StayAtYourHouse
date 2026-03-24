using Gentle.Application.Dtos.Room;
using Gentle.Core.Enums;

namespace Gentle.Application.Services;

/// <summary>
/// 房间服务接口
/// </summary>
public interface IRoomService : ITransient
{
    /// <summary>
    /// 获取房间列表（支持按小区和状态筛选）
    /// </summary>
    Task<List<RoomDto>> GetListAsync(int? communityId, RoomStatus? status);

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

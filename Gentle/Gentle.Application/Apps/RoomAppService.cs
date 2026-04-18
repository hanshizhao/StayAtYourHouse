using Gentle.Application.Dtos.Room;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 房间管理应用服务
/// </summary>
[ApiDescriptionSettings("Housing", Name = "Room", Order = 2)]
[Route("api/room")]
[Authorize]
public class RoomAppService : IDynamicApiController
{
    private readonly IRoomService _roomService;

    public RoomAppService(IRoomService roomService)
    {
        _roomService = roomService;
    }

    /// <summary>
    /// 获取房间列表（支持筛选和分页）
    /// </summary>
    [HttpGet("list")]
    public async Task<RoomListResult> GetList([FromQuery] RoomListInput input)
    {
        return await _roomService.GetListAsync(input);
    }

    /// <summary>
    /// 根据ID获取房间
    /// </summary>
    [HttpGet("{id}")]
    public async Task<RoomDto> GetById(int id)
    {
        return await _roomService.GetByIdAsync(id);
    }

    /// <summary>
    /// 新增房间
    /// </summary>
    [HttpPost("add")]
    public async Task<RoomDto> Add(CreateRoomInput input)
    {
        return await _roomService.AddAsync(input);
    }

    /// <summary>
    /// 更新房间
    /// </summary>
    [HttpPut("edit")]
    public async Task<RoomDto> Edit(UpdateRoomInput input)
    {
        return await _roomService.UpdateAsync(input);
    }

    /// <summary>
    /// 删除房间
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _roomService.DeleteAsync(id);
    }
}

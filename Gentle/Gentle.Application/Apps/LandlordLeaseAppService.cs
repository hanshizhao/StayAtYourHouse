using Gentle.Application.Dtos.LandlordLease;
using Gentle.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gentle.Application.Apps;

/// <summary>
/// 房东租约管理应用服务
/// </summary>
[ApiDescriptionSettings("Housing", Name = "LandlordLease", Order = 3)]
[Route("api/landlord-lease")]
[Authorize]
public class LandlordLeaseAppService : IDynamicApiController
{
    private readonly ILandlordLeaseService _landlordLeaseService;

    public LandlordLeaseAppService(ILandlordLeaseService landlordLeaseService)
    {
        _landlordLeaseService = landlordLeaseService;
    }

    /// <summary>
    /// 根据房间ID获取房东租约
    /// </summary>
    [HttpGet("room/{roomId}")]
    public async Task<LandlordLeaseDto?> GetByRoomId(int roomId)
    {
        return await _landlordLeaseService.GetByRoomIdAsync(roomId);
    }

    /// <summary>
    /// 新增房东租约
    /// </summary>
    [HttpPost("add")]
    public async Task<LandlordLeaseDto> Add(CreateLandlordLeaseInput input)
    {
        return await _landlordLeaseService.AddAsync(input);
    }

    /// <summary>
    /// 编辑房东租约
    /// </summary>
    [HttpPut("edit")]
    public async Task<LandlordLeaseDto> Edit(UpdateLandlordLeaseInput input)
    {
        return await _landlordLeaseService.EditAsync(input);
    }

    /// <summary>
    /// 删除房东租约
    /// </summary>
    [HttpDelete("remove/{id}")]
    public async Task Remove(int id)
    {
        await _landlordLeaseService.RemoveAsync(id);
    }
}

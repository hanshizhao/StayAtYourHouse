using Gentle.Application.Dtos.LandlordLease;

namespace Gentle.Application.Services;

/// <summary>
/// 房东租约服务接口
/// </summary>
public interface ILandlordLeaseService : ITransient
{
    /// <summary>
    /// 根据房间ID获取房东租约
    /// </summary>
    Task<LandlordLeaseDto?> GetByRoomIdAsync(int roomId);

    /// <summary>
    /// 新增房东租约
    /// </summary>
    Task<LandlordLeaseDto> AddAsync(CreateLandlordLeaseInput input);

    /// <summary>
    /// 编辑房东租约
    /// </summary>
    Task<LandlordLeaseDto> EditAsync(UpdateLandlordLeaseInput input);

    /// <summary>
    /// 删除房东租约
    /// </summary>
    Task RemoveAsync(int id);
}

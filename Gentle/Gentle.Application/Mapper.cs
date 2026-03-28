using Gentle.Application.Dtos.Community;
using Gentle.Application.Dtos.Meter;
using Gentle.Application.Dtos.RentalRecord;
using Gentle.Application.Dtos.Room;
using Gentle.Application.Dtos.User;
using Gentle.Core.Entities;
using Mapster;

namespace Gentle.Application;

/// <summary>
/// Mapster 映射配置
/// </summary>
public class Mapper : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // User -> UserDto 映射配置
        config.NewConfig<User, UserDto>();

        // Community -> CommunityDto 映射配置
        config.NewConfig<Community, CommunityDto>();

        // CreateCommunityInput -> Community 映射配置
        config.NewConfig<CreateCommunityInput, Community>();

        // UpdateCommunityInput -> Community 映射配置
        config.NewConfig<UpdateCommunityInput, Community>();

        // Room -> RoomDto 映射配置
        config.NewConfig<Room, RoomDto>()
            .Map(dest => dest.CommunityName, src => src.Community != null ? src.Community.Name : string.Empty)
            .Map(dest => dest.Profit, src => src.RentPrice - src.CostPrice);

        // CreateRoomInput -> Room 映射配置
        config.NewConfig<CreateRoomInput, Room>();

        // UpdateRoomInput -> Room 映射配置
        config.NewConfig<UpdateRoomInput, Room>();

        // RentalRecord -> RentalRecordDto 映射配置
        config.NewConfig<RentalRecord, RentalRecordDto>()
            .Map(dest => dest.TenantId, src => src.RenterId)
            .Map(dest => dest.TenantName, src => src.Renter != null ? src.Renter.Name : string.Empty)
            .Map(dest => dest.RoomInfo, src => src.Room != null && src.Room.Community != null
                ? $"{src.Room.Community.Name} {src.Room.Building}栋 {src.Room.RoomNumber}号"
                : string.Empty);

        // CheckInInput -> RentalRecord 映射配置
        config.NewConfig<CheckInInput, RentalRecord>()
            .Map(dest => dest.RenterId, src => src.TenantId);

        // MeterRecord -> MeterRecordDto 映射配置
        config.NewConfig<MeterRecord, MeterRecordDto>();
        config.NewConfig<MeterRecord, MeterRecordDto>();

        // UtilityBill -> UtilityBillDto 映射配置
        config.NewConfig<UtilityBill, UtilityBillDto>()
            .Map(dest => dest.TenantId, src => src.BillTenantId);
    }
}

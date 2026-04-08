using Gentle.Application.Dtos.Maintenance;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 维修管理服务实现
/// </summary>
public class MaintenanceService : IMaintenanceService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private readonly IRepository<MaintenanceRecord> _repository;
    private readonly IRepository<Room> _roomRepository;

    public MaintenanceService(
        IRepository<MaintenanceRecord> repository,
        IRepository<Room> roomRepository)
    {
        _repository = repository;
        _roomRepository = roomRepository;
    }

    /// <inheritdoc />
    public async Task<(List<MaintenanceDetailDto> Items, int Total)> GetListAsync(
        MaintenanceStatus? status = null,
        MaintenancePriority? priority = null,
        int? roomId = null,
        int? communityId = null,
        int page = 1,
        int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > MaxPageSize) pageSize = DefaultPageSize;

        var query = _repository
            .AsQueryable(false)
            .Include(m => m.Room)
                .ThenInclude(r => r.Community)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(m => m.Status == status.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(m => m.Priority == priority.Value);
        }

        if (roomId.HasValue)
        {
            query = query.Where(m => m.RoomId == roomId.Value);
        }

        if (communityId.HasValue)
        {
            query = query.Where(m => m.Room.CommunityId == communityId.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.CreatedTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToDto).ToList();
        return (dtos, total);
    }

    /// <inheritdoc />
    public async Task<MaintenanceDetailDto> GetByIdAsync(int id)
    {
        var record = await _repository
            .AsQueryable(false)
            .Include(m => m.Room)
                .ThenInclude(r => r.Community)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"维修记录 {id} 不存在");
        }

        return MapToDto(record);
    }

    /// <inheritdoc />
    public async Task<MaintenanceDetailDto> AddAsync(MaintenanceAddInput input)
    {
        var room = await _roomRepository
            .AsQueryable(false)
            .Include(r => r.Community)
            .FirstOrDefaultAsync(r => r.Id == input.RoomId);

        if (room == null)
        {
            throw Oops.Oh($"房间 {input.RoomId} 不存在");
        }

        var entity = input.Adapt<MaintenanceRecord>();
        entity.CreatedTime = DateTimeOffset.Now;

        await _repository.InsertAsync(entity);
        await _repository.SaveNowAsync();

        return await GetByIdAsync(entity.Id);
    }

    /// <inheritdoc />
    public async Task<MaintenanceDetailDto> UpdateAsync(MaintenanceUpdateInput input)
    {
        var record = await _repository
            .AsQueryable()
            .FirstOrDefaultAsync(m => m.Id == input.Id);

        if (record == null)
        {
            throw Oops.Oh($"维修记录 {input.Id} 不存在");
        }

        record.Description = input.Description;
        record.Priority = input.Priority;
        record.ReportDate = input.ReportDate;
        record.Cost = input.Cost;
        record.RepairPerson = input.RepairPerson;
        record.RepairPhone = input.RepairPhone;
        record.Images = input.Images;
        record.Remark = input.Remark;
        record.Status = input.Status;

        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        return await GetByIdAsync(record.Id);
    }

    /// <inheritdoc />
    public async Task<MaintenanceDetailDto> CompleteAsync(int id, CompleteMaintenanceInput input)
    {
        var record = await _repository
            .AsQueryable()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"维修记录 {id} 不存在");
        }

        if (record.Status == MaintenanceStatus.Completed)
        {
            throw Oops.Oh("该维修记录已完成，无法重复操作");
        }

        record.Status = MaintenanceStatus.Completed;
        record.CompletedDate = DateTime.Today;
        record.Cost = input.ActualCost ?? record.Cost;

        if (!string.IsNullOrEmpty(input.Remark))
        {
            record.Remark = string.IsNullOrEmpty(record.Remark)
                ? input.Remark
                : $"{record.Remark}; {input.Remark}";
        }

        await _repository.UpdateAsync(record);
        await _repository.SaveNowAsync();

        return await GetByIdAsync(record.Id);
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var record = await _repository
            .AsQueryable()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (record == null)
        {
            throw Oops.Oh($"维修记录 {id} 不存在");
        }

        await _repository.DeleteAsync(record);
        await _repository.SaveNowAsync();
    }

    /// <summary>
    /// 映射到 MaintenanceDetailDto
    /// </summary>
    private static MaintenanceDetailDto MapToDto(MaintenanceRecord record)
    {
        var dto = record.Adapt<MaintenanceDetailDto>();

        var room = record.Room;
        var community = room?.Community;

        dto.RoomInfo = room != null
            ? $"{community?.Name ?? "未知小区"} {room.Building}栋 {room.RoomNumber}号"
            : "未知房间";

        return dto;
    }
}

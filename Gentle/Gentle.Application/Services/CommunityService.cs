using Gentle.Application.Dtos.Community;
using Gentle.Core.Entities;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 小区服务实现
/// </summary>
public class CommunityService : ICommunityService
{
    private readonly IRepository<Community> _repository;
    private readonly IRepository<Room> _roomRepository;

    public CommunityService(IRepository<Community> repository, IRepository<Room> roomRepository)
    {
        _repository = repository;
        _roomRepository = roomRepository;
    }

    /// <inheritdoc />
    public async Task<List<CommunityDto>> GetListAsync()
    {
        // SQLite 不支持 DateTimeOffset 排序，改为内存排序
        var list = await _repository.AsQueryable(false).ToListAsync();
        var roomCounts = await _roomRepository.AsQueryable(false)
            .GroupBy(r => r.CommunityId)
            .Select(g => new { CommunityId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.CommunityId, x => x.Count);

        return list
            .OrderByDescending(c => c.CreatedTime)
            .Select(c =>
            {
                var dto = c.Adapt<CommunityDto>();
                dto.RoomCount = roomCounts.GetValueOrDefault(c.Id, 0);
                return dto;
            })
            .ToList();
    }

    /// <inheritdoc />
    public async Task<CommunityDto> GetByIdAsync(int id)
    {
        var community = await _repository.FindAsync(id);
        if (community == null)
        {
            throw Oops.Oh($"小区 {id} 不存在");
        }
        return community.Adapt<CommunityDto>();
    }

    /// <inheritdoc />
    public async Task<CommunityDto> AddAsync(CreateCommunityInput input)
    {
        // 检查名称是否重复
        var exists = await _repository.AsQueryable(false)
            .AnyAsync(c => c.Name == input.Name);

        if (exists)
        {
            throw Oops.Oh($"小区名称 {input.Name} 已存在");
        }

        var community = input.Adapt<Community>();
        community.CreatedTime = DateTimeOffset.Now;
        var entry = await _repository.InsertAsync(community);
        await _repository.SaveNowAsync();  // 立即保存以获取生成的 ID
        return entry.Entity.Adapt<CommunityDto>();
    }

    /// <inheritdoc />
    public async Task<CommunityDto> UpdateAsync(UpdateCommunityInput input)
    {
        // 检查小区是否存在
        var existing = await _repository.FindAsync(input.Id);
        if (existing == null)
        {
            throw Oops.Oh($"小区 {input.Id} 不存在");
        }

        // 检查名称是否与其他小区重复
        var nameExists = await _repository.AsQueryable(false)
            .AnyAsync(c => c.Name == input.Name && c.Id != input.Id);

        if (nameExists)
        {
            throw Oops.Oh($"小区名称 {input.Name} 已存在");
        }

        // 直接更新字段
        existing.Name = input.Name;
        existing.Address = input.Address;
        existing.PropertyPhone = input.PropertyPhone;
        existing.Remark = input.Remark;

        var entry = await _repository.UpdateAsync(existing);
        await _repository.SaveNowAsync();  // 立即保存
        return entry.Entity.Adapt<CommunityDto>();
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var community = await _repository.FindAsync(id);
        if (community == null)
        {
            throw Oops.Oh($"小区 {id} 不存在");
        }

        // 检查是否有关联的房间，如果有则不允许删除
        var hasRooms = await _roomRepository.AsQueryable(false).AnyAsync(r => r.CommunityId == id);
        if (hasRooms)
        {
            throw Oops.Oh("该小区下存在房间，无法删除");
        }

        await _repository.DeleteAsync(community);
        await _repository.SaveNowAsync();  // 立即保存
    }
}

using Gentle.Core.Entities;

namespace Gentle.Application.Services;

/// <summary>
/// 小区服务实现
/// </summary>
public class CommunityService : ICommunityService
{
    private readonly IRepository<Community> _repository;

    public CommunityService(IRepository<Community> repository)
    {
        _repository = repository;
    }

    /// <inheritdoc />
    public async Task<List<Community>> GetListAsync()
    {
        // SQLite 不支持 DateTimeOffset 排序，改为内存排序
        var list = await _repository.AsQueryable(false).ToListAsync();
        return list.OrderByDescending(c => c.CreatedTime).ToList();
    }

    /// <inheritdoc />
    public async Task<Community> GetByIdAsync(int id)
    {
        var community = await _repository.FindAsync(id);
        if (community == null)
        {
            throw Oops.Oh($"小区 {id} 不存在");
        }
        return community;
    }

    /// <inheritdoc />
    public async Task<Community> AddAsync(Community community)
    {
        var entry = await _repository.InsertAsync(community);
        return entry.Entity;
    }

    /// <inheritdoc />
    public async Task<Community> SaveAsync(Community community)
    {
        if (community.Id > 0)
        {
            return await UpdateAsync(community);
        }
        return await AddAsync(community);
    }

    /// <inheritdoc />
    public async Task<Community> UpdateAsync(Community community)
    {
        var existing = await _repository.FindAsync(community.Id);
        if (existing == null)
        {
            throw Oops.Oh($"小区 {community.Id} 不存在");
        }

        existing.Name = community.Name;
        existing.Address = community.Address;
        existing.PropertyPhone = community.PropertyPhone;
        existing.Remark = community.Remark;

        var entry = await _repository.UpdateAsync(existing);
        return entry.Entity;
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var community = await _repository.FindAsync(id);
        if (community == null)
        {
            throw Oops.Oh($"小区 {id} 不存在");
        }

        await _repository.DeleteAsync(community);
    }
}

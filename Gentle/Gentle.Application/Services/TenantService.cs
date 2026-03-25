using Gentle.Application.Dtos.Tenant;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 租客服务实现
/// </summary>
public class TenantService : ITenantService
{
    private readonly IRepository<Core.Entities.Tenant> _repository;

    public TenantService(IRepository<Core.Entities.Tenant> repository)
    {
        _repository = repository;
    }

    /// <inheritdoc />
    public async Task<List<TenantDto>> GetListAsync(string? keyword)
    {
        var query = _repository.AsQueryable(false);

        // 关键字搜索（姓名、电话、身份证号）
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(t =>
                t.Name.Contains(keyword) ||
                t.Phone.Contains(keyword) ||
                (t.IdCard != null && t.IdCard.Contains(keyword)));
        }

        var list = await query.ToListAsync();
        return list
            .OrderByDescending(t => t.CreatedTime)
            .Adapt<List<TenantDto>>();
    }

    /// <inheritdoc />
    public async Task<TenantDto> GetByIdAsync(int id)
    {
        var tenant = await _repository.FindAsync(id);
        if (tenant == null)
        {
            throw Oops.Oh($"租客 {id} 不存在");
        }
        return tenant.Adapt<TenantDto>();
    }

    /// <inheritdoc />
    public async Task<TenantDto> AddAsync(CreateTenantInput input)
    {
        // 检查电话是否重复
        var phoneExists = await _repository.AsQueryable(false)
            .AnyAsync(t => t.Phone == input.Phone);

        if (phoneExists)
        {
            throw Oops.Oh($"联系电话 {input.Phone} 已存在");
        }

        // 检查身份证号是否重复（如果填写了）
        if (!string.IsNullOrWhiteSpace(input.IdCard))
        {
            var idCardExists = await _repository.AsQueryable(false)
                .AnyAsync(t => t.IdCard == input.IdCard);

            if (idCardExists)
            {
                throw Oops.Oh($"身份证号 {input.IdCard} 已存在");
            }
        }

        var tenant = input.Adapt<Core.Entities.Tenant>();
        var entry = await _repository.InsertAsync(tenant);
        await _repository.SaveNowAsync();
        return entry.Entity.Adapt<TenantDto>();
    }

    /// <inheritdoc />
    public async Task<TenantDto> UpdateAsync(UpdateTenantInput input)
    {
        var existing = await _repository.FindAsync(input.Id);
        if (existing == null)
        {
            throw Oops.Oh($"租客 {input.Id} 不存在");
        }

        // 检查电话是否与其他租客重复
        var phoneExists = await _repository.AsQueryable(false)
            .AnyAsync(t => t.Phone == input.Phone && t.Id != input.Id);

        if (phoneExists)
        {
            throw Oops.Oh($"联系电话 {input.Phone} 已存在");
        }

        // 检查身份证号是否与其他租客重复（如果填写了）
        if (!string.IsNullOrWhiteSpace(input.IdCard))
        {
            var idCardExists = await _repository.AsQueryable(false)
                .AnyAsync(t => t.IdCard == input.IdCard && t.Id != input.Id);

            if (idCardExists)
            {
                throw Oops.Oh($"身份证号 {input.IdCard} 已存在");
            }
        }

        // 更新字段
        existing.Name = input.Name;
        existing.Phone = input.Phone;
        existing.IdCard = input.IdCard;
        existing.Gender = input.Gender;
        existing.EmergencyContact = input.EmergencyContact;
        existing.Remark = input.Remark;

        var entry = await _repository.UpdateAsync(existing);
        await _repository.SaveNowAsync();
        return entry.Entity.Adapt<TenantDto>();
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var tenant = await _repository.FindAsync(id);
        if (tenant == null)
        {
            throw Oops.Oh($"租客 {id} 不存在");
        }

        // TODO: 检查是否有关联的租住记录，如果有则不允许删除
        // var hasRentals = await _rentalRecordRepository.AsQueryable(false).AnyAsync(r => r.TenantId == id);
        // if (hasRentals)
        // {
        //     throw Oops.Oh("该租客存在租住记录，无法删除");
        // }

        await _repository.DeleteAsync(tenant);
        await _repository.SaveNowAsync();
    }
}

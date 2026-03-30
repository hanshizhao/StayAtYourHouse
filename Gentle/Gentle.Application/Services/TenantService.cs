using Gentle.Application.Dtos.Tenant;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 租客服务实现
/// </summary>
public class TenantService : ITenantService
{
    private readonly IRepository<Core.Entities.Tenant> _repository;
    private readonly IRepository<Core.Entities.RentalRecord> _rentalRecordRepository;

    public TenantService(
        IRepository<Core.Entities.Tenant> repository,
        IRepository<Core.Entities.RentalRecord> rentalRecordRepository)
    {
        _repository = repository;
        _rentalRecordRepository = rentalRecordRepository;
    }

    /// <inheritdoc />
    public async Task<TenantListResult> GetListAsync(TenantListInput input)
    {
        var query = _repository.AsQueryable(false);

        // 关键字搜索（姓名、电话、身份证号）
        if (!string.IsNullOrWhiteSpace(input.Keyword))
        {
            query = query.Where(t =>
                t.Name.Contains(input.Keyword) ||
                t.Phone.Contains(input.Keyword) ||
                (t.IdCard != null && t.IdCard.Contains(input.Keyword)));
        }

        // 先获取总数
        var total = await query.CountAsync();

        // 分页查询
        var pagedQuery = query
            .OrderByDescending(t => t.CreatedTime)
            .Skip((input.Page - 1) * input.PageSize)
            .Take(input.PageSize);

        // 使用单次 JOIN 查询：租客 LEFT JOIN 活跃租住记录（含房间和小区）
        // 优化：避免 N+1 查询问题
        var result = await pagedQuery
            .GroupJoin(
                _rentalRecordRepository.AsQueryable(false)
                    .Include(r => r.Room)
                    .ThenInclude(r => r.Community)
                    .Where(r => r.Status == RentalStatus.Active),
                tenant => tenant.Id,
                rental => rental.RenterId,
                (tenant, rentals) => new { Tenant = tenant, Rentals = rentals })
            .ToListAsync();

        // 手动映射，添加房间信息
        var list = result.Select(item =>
        {
            var dto = item.Tenant.Adapt<TenantDto>();
            // 取最新的活跃租住记录（业务上每个租客最多一条活跃记录）
            var latestRental = item.Rentals.OrderByDescending(r => r.CreatedTime).FirstOrDefault();
            if (latestRental != null)
            {
                dto.CurrentRoom = new CurrentRoomInfoDto
                {
                    RoomId = latestRental.RoomId,
                    CommunityName = latestRental.Room.Community.Name,
                    Building = latestRental.Room.Building,
                    RoomNumber = latestRental.Room.RoomNumber
                };
                dto.RentalRecordId = latestRental.Id;
                dto.Status = latestRental.Status;
            }
            return dto;
        }).ToList();

        return new TenantListResult { List = list, Total = total };
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
        tenant.CreatedTime = DateTimeOffset.Now;
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

        // 检查是否有关联的租住记录，如果有则不允许删除
        var hasRentals = await _rentalRecordRepository.AsQueryable(false).AnyAsync(r => r.RenterId == id);
        if (hasRentals)
        {
            throw Oops.Oh("该租客存在租住记录，无法删除");
        }

        await _repository.DeleteAsync(tenant);
        await _repository.SaveNowAsync();
    }
}

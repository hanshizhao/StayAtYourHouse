using Gentle.Application.Dtos.Bill;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 账单服务实现
/// </summary>
public class BillService : IBillService
{
    private readonly IRepository<Bill> _billRepository;
    private readonly IRepository<CollectionRecord> _collectionRecordRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;

    public BillService(
        IRepository<Bill> billRepository,
        IRepository<CollectionRecord> collectionRecordRepository,
        IRepository<RentalRecord> rentalRecordRepository)
    {
        _billRepository = billRepository;
        _collectionRecordRepository = collectionRecordRepository;
        _rentalRecordRepository = rentalRecordRepository;
    }

    /// <inheritdoc />
    public async Task<(List<BillDto> Items, int Total)> GetListAsync(
        BillStatus? status = null,
        int? communityId = null,
        string? month = null,
        int page = 1,
        int pageSize = 20)
    {
        // 分页参数边界验证
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var query = _billRepository
            .AsQueryable(false)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Renter)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Room)
                    .ThenInclude(room => room.Community)
            .Include(b => b.CollectionRecords)
            .Where(b => b.RentalRecord.Status == RentalStatus.Active);

        // 状态筛选
        if (status.HasValue)
        {
            query = query.Where(b => b.Status == status.Value);
        }

        // 小区筛选
        if (communityId.HasValue)
        {
            query = query.Where(b => b.RentalRecord.Room.CommunityId == communityId.Value);
        }

        // 月份筛选
        if (!string.IsNullOrEmpty(month) && DateTime.TryParse($"{month}-01", out var monthDate))
        {
            var monthEnd = monthDate.AddMonths(1).AddDays(-1);
            query = query.Where(b => b.PeriodStart >= monthDate && b.PeriodStart <= monthEnd);
        }

        // 获取总数
        var total = await query.CountAsync();

        // 分页
        var items = await query
            .OrderByDescending(b => b.DueDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(b => MapToDto(b)).ToList();
        return (dtos, total);
    }

    /// <inheritdoc />
    public async Task<BillDto> GetByIdAsync(int id)
    {
        var bill = await _billRepository
            .AsQueryable(false)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Renter)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Room)
                    .ThenInclude(room => room.Community)
            .Include(b => b.CollectionRecords)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (bill == null)
        {
            throw Oops.Oh($"账单 {id} 不存在");
        }

        return MapToDto(bill);
    }

    /// <inheritdoc />
    [UnitOfWork]
    public async Task<BillDto> CollectAsync(CollectInput input)
    {
        // 验证输入
        ValidateCollectInput(input);

        var bill = await _billRepository
            .AsQueryable()
            .Include(b => b.RentalRecord)
            .FirstOrDefaultAsync(b => b.Id == input.BillId);

        if (bill == null)
        {
            throw Oops.Oh($"账单 {input.BillId} 不存在");
        }

        if (bill.Status == BillStatus.Paid)
        {
            throw Oops.Oh("该账单已收款，无法重复催收");
        }

        // 创建催收记录
        var collectionRecord = new CollectionRecord
        {
            BillId = input.BillId,
            CollectDate = DateTime.Today,
            Result = input.Result,
            GraceUntil = input.GraceUntil,
            Remark = input.Remark
        };

        await _collectionRecordRepository.InsertAsync(collectionRecord);

        // 根据催收结果更新账单状态
        switch (input.Result)
        {
            case CollectResult.Success:
                // 催收成功：更新账单状态为已收款
                bill.Status = BillStatus.Paid;
                bill.PaidAmount = input.PaidAmount ?? bill.TotalAmount;
                bill.PaidDate = DateTime.Today;
                await _billRepository.UpdateAsync(bill);

                // 生成下一期账单
                await GenerateNextBillAsync(bill);
                break;

            case CollectResult.Grace:
                // 宽限处理：更新账单状态为宽限中
                bill.Status = BillStatus.Grace;
                bill.GraceUntil = input.GraceUntil ?? DateTime.Today.AddDays(7);
                await _billRepository.UpdateAsync(bill);
                break;

            case CollectResult.Refuse:
                // 拒绝支付：更新账单状态为逾期
                bill.Status = BillStatus.Overdue;
                await _billRepository.UpdateAsync(bill);
                break;
        }

        // UnitOfWork 会在方法结束时自动提交事务，无需手动调用 SaveNowAsync

        // 重新查询以获取完整信息
        return await GetByIdAsync(bill.Id);
    }

    /// <inheritdoc />
    public async Task<TodoBillsDto> GetTodayTodosAsync()
    {
        var today = DateTime.Today;
        var threeDaysLater = today.AddDays(3);

        // 获取所有活跃租住记录的未收款账单
        // 注意：今日待办数据量通常不大（活跃租住记录数有限），
        // 因此先加载到内存再分类。如数据量增大，可改为多次数据库查询。
        var allBills = await _billRepository
            .AsQueryable(false)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Renter)
            .Include(b => b.RentalRecord)
                .ThenInclude(r => r.Room)
                    .ThenInclude(room => room.Community)
            .Where(b => b.RentalRecord.Status == RentalStatus.Active && b.Status != BillStatus.Paid)
            .ToListAsync();

        var result = new TodoBillsDto
        {
            // 逾期：超过应收日期且未收款（无宽限期或宽限期已过）
            Overdue = allBills
                .Where(b => (b.GraceUntil ?? b.DueDate) < today && b.Status != BillStatus.Grace)
                .Select(MapToDto)
                .OrderBy(b => b.DueDate)
                .ToList(),

            // 宽限到期：宽限截止日期为今日
            GraceExpiring = allBills
                .Where(b => b.GraceUntil.HasValue && b.GraceUntil.Value.Date == today)
                .Select(MapToDto)
                .OrderBy(b => b.GraceUntil)
                .ToList(),

            // 今日到期：应收日期为今日且无宽限期
            DueToday = allBills
                .Where(b => b.DueDate.Date == today && !b.GraceUntil.HasValue)
                .Select(MapToDto)
                .ToList(),

            // 即将到期：3天内到期（不含今日）
            Upcoming = allBills
                .Where(b => b.DueDate.Date > today && b.DueDate.Date <= threeDaysLater)
                .Select(MapToDto)
                .OrderBy(b => b.DueDate)
                .ToList()
        };

        return result;
    }

    /// <inheritdoc />
    public async Task DeleteAsync(int id)
    {
        var bill = await _billRepository.FindAsync(id);
        if (bill == null)
        {
            throw Oops.Oh($"账单 {id} 不存在");
        }

        if (bill.Status == BillStatus.Paid)
        {
            throw Oops.Oh("已收款的账单不能删除");
        }

        await _billRepository.DeleteAsync(bill);
        await _billRepository.SaveNowAsync();
    }

    /// <summary>
    /// 生成下一期账单
    /// </summary>
    private async Task GenerateNextBillAsync(Bill currentBill)
    {
        var rentalRecord = currentBill.RentalRecord;

        // 计算下一期账单周期
        var nextPeriodStart = currentBill.PeriodEnd.AddDays(1);
        var nextPeriodEnd = nextPeriodStart.AddMonths(1).AddDays(-1);

        // 检查是否超过合同结束日期
        if (nextPeriodStart > rentalRecord.ContractEndDate)
        {
            return; // 合同已到期，不再生成下一期账单
        }

        // 确保账单周期不超过合同结束日期
        if (nextPeriodEnd > rentalRecord.ContractEndDate)
        {
            nextPeriodEnd = rentalRecord.ContractEndDate;
        }

        // 检查是否已存在相同周期的账单
        var existingBill = await _billRepository
            .AsQueryable()
            .AnyAsync(b => b.RentalRecordId == currentBill.RentalRecordId
                && b.PeriodStart == nextPeriodStart);

        if (existingBill)
        {
            return; // 已存在，跳过
        }

        // 创建下一期账单
        var nextBill = new Bill
        {
            RentalRecordId = currentBill.RentalRecordId,
            PeriodStart = nextPeriodStart,
            PeriodEnd = nextPeriodEnd,
            DueDate = nextPeriodStart,
            RentAmount = rentalRecord.MonthlyRent,
            WaterFee = null,
            ElectricFee = null,
            TotalAmount = rentalRecord.MonthlyRent,
            Status = BillStatus.Pending
        };

        await _billRepository.InsertAsync(nextBill);
    }

    /// <summary>
    /// 验证催收输入
    /// </summary>
    private static void ValidateCollectInput(CollectInput input)
    {
        switch (input.Result)
        {
            case CollectResult.Success:
                if (!input.PaidAmount.HasValue || input.PaidAmount.Value <= 0)
                {
                    throw Oops.Oh("催收成功时，必须填写实收金额");
                }
                break;

            case CollectResult.Grace:
                if (!input.GraceUntil.HasValue)
                {
                    throw Oops.Oh("宽限处理时，必须填写宽限截止日期");
                }
                if (input.GraceUntil.Value <= DateTime.Today)
                {
                    throw Oops.Oh("宽限截止日期必须晚于今天");
                }
                break;
        }
    }

    /// <summary>
    /// 映射到 DTO
    /// </summary>
    private static BillDto MapToDto(Bill bill)
    {
        var dto = bill.Adapt<BillDto>();

        // 填充租客姓名和房间信息（导航属性应在查询时 Include）
        var rentalRecord = bill.RentalRecord;
        var renter = rentalRecord?.Renter;
        var room = rentalRecord?.Room;
        var community = room?.Community;

        dto.TenantName = renter?.Name ?? "未知租客";
        dto.RoomInfo = room != null
            ? $"{community?.Name ?? "未知小区"} {room.Building}栋 {room.RoomNumber}"
            : "未知房间";

        // 计算总金额（包含水电费）
        dto.TotalAmount = bill.RentAmount
            + (bill.WaterFee ?? 0)
            + (bill.ElectricFee ?? 0);

        // 映射催收记录
        if (bill.CollectionRecords != null && bill.CollectionRecords.Count > 0)
        {
            dto.CollectionRecords = bill.CollectionRecords
                .OrderByDescending(c => c.CollectDate)
                .Select(c => c.Adapt<CollectionRecordDto>())
                .ToList();
        }

        return dto;
    }
}

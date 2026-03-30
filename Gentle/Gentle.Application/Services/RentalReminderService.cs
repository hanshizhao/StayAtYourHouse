using Gentle.Application.Dtos.Rental;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 催收提醒服务实现
/// </summary>
/// <remarks>
/// 提供催收提醒的宽限、续租和宽限记录查询功能。
/// </remarks>
public class RentalReminderService : IRentalReminderService
{
    private readonly IRepository<RentalReminder> _reminderRepository;
    private readonly IRepository<RentalDeferral> _deferralRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;

    /// <summary>
    /// 初始化催收提醒服务
    /// </summary>
    /// <param name="reminderRepository">提醒仓储</param>
    /// <param name="deferralRepository">宽限记录仓储</param>
    /// <param name="rentalRecordRepository">租赁记录仓储</param>
    public RentalReminderService(
        IRepository<RentalReminder> reminderRepository,
        IRepository<RentalDeferral> deferralRepository,
        IRepository<RentalRecord> rentalRecordRepository)
    {
        _reminderRepository = reminderRepository;
        _deferralRepository = deferralRepository;
        _rentalRecordRepository = rentalRecordRepository;
    }

    /// <inheritdoc />
    public async Task DeferAsync(int reminderId, DeferReminderInput input)
    {
        // 查找提醒记录
        var reminder = await _reminderRepository
            .AsQueryable()
            .Include(r => r.Deferrals)
            .FirstOrDefaultAsync(r => r.Id == reminderId);

        if (reminder == null)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 不存在");
        }

        if (reminder.Status != RentalReminderStatus.Pending)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 已处理，当前状态：{reminder.Status}");
        }

        // 验证宽限日期必须晚于当前提醒日期
        if (input.DeferredToDate <= reminder.ReminderDate)
        {
            throw Oops.Oh("宽限日期必须晚于当前提醒日期");
        }

        // 创建宽限记录
        var deferral = new RentalDeferral
        {
            RentalReminderId = reminderId,
            OriginalReminderDate = reminder.ReminderDate,
            DeferredToDate = input.DeferredToDate,
            Remark = input.Remark
        };

        await _deferralRepository.InsertAsync(deferral);

        // 更新当前提醒状态为已宽限
        reminder.Status = RentalReminderStatus.Deferred;
        await _reminderRepository.UpdateAsync(reminder);

        // 创建新的催收提醒
        var newReminder = new RentalReminder
        {
            RentalRecordId = reminder.RentalRecordId,
            ReminderDate = input.DeferredToDate,
            Status = RentalReminderStatus.Pending,
            Remark = $"由提醒 {reminderId} 宽限创建"
        };

        await _reminderRepository.InsertAsync(newReminder);
    }

    /// <inheritdoc />
    public async Task<int> RenewAsync(int reminderId, RenewRentalInput input)
    {
        // 查找提醒记录
        var reminder = await _reminderRepository
            .AsQueryable()
            .Include(r => r.RentalRecord)
            .FirstOrDefaultAsync(r => r.Id == reminderId);

        if (reminder == null)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 不存在");
        }

        if (reminder.Status != RentalReminderStatus.Pending)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 已处理，当前状态：{reminder.Status}");
        }

        var originalRecord = reminder.RentalRecord;
        if (originalRecord == null)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 关联的租赁记录不存在");
        }

        // 验证新合同结束日期必须晚于原合同结束日期
        if (input.ContractEndDate <= originalRecord.ContractEndDate)
        {
            throw Oops.Oh("新合同结束日期必须晚于原合同结束日期");
        }

        // 创建新的租赁记录（继承押金）
        var newRecord = new RentalRecord
        {
            RenterId = originalRecord.RenterId,
            RoomId = originalRecord.RoomId,
            CheckInDate = originalRecord.ContractEndDate,
            LeaseMonths = input.LeaseMonths,
            ContractEndDate = input.ContractEndDate,
            MonthlyRent = input.MonthlyRent,
            Deposit = originalRecord.Deposit,
            DepositStatus = originalRecord.DepositStatus,
            Status = RentalStatus.Active,
            Remark = input.Remark ?? $"由租赁记录 {originalRecord.Id} 续租创建"
        };

        await _rentalRecordRepository.InsertAsync(newRecord);

        // 更新原租赁记录状态为已终止
        originalRecord.Status = RentalStatus.Terminated;
        originalRecord.CheckOutDate = originalRecord.ContractEndDate;
        originalRecord.CheckOutRemark = "续租，押金已转移至新租赁记录";
        await _rentalRecordRepository.UpdateAsync(originalRecord);

        // 更新提醒状态为已完成
        reminder.Status = RentalReminderStatus.Completed;
        await _reminderRepository.UpdateAsync(reminder);

        return newRecord.Id;
    }

    /// <inheritdoc />
    public async Task<DeferralListResult> GetDeferralsAsync(int reminderId)
    {
        // 验证提醒是否存在
        var reminder = await _reminderRepository.FindAsync(reminderId);
        if (reminder == null)
        {
            throw Oops.Oh($"催收提醒 {reminderId} 不存在");
        }

        // 获取该提醒的所有宽限记录
        var deferrals = await _deferralRepository
            .AsQueryable(false)
            .Where(d => d.RentalReminderId == reminderId)
            .OrderByDescending(d => d.CreatedTime)
            .ToListAsync();

        var items = deferrals.Select(d => new DeferralRecordDto
        {
            Id = d.Id,
            OriginalReminderDate = d.OriginalReminderDate,
            DeferredToDate = d.DeferredToDate,
            Remark = d.Remark,
            CreatedTime = d.CreatedTime
        }).ToList();

        return new DeferralListResult
        {
            Items = items,
            Total = items.Count
        };
    }
}

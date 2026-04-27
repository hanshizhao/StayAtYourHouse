using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gentle.Application.BackgroundServices;

/// <summary>
/// 催收提醒后台服务
/// </summary>
/// <remarks>
/// 每日凌晨扫描即将到期的租赁记录，提前 3 天创建催收提醒。
/// </remarks>
public class RentalReminderBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RentalReminderBackgroundService> _logger;

    /// <summary>
    /// 提前提醒天数
    /// </summary>
    private const int ReminderDaysBeforeExpiry = 3;

    /// <summary>
    /// 回溯扫描天数
    /// </summary>
    /// <remarks>
    /// 当服务器宕机或补录入住导致错过提醒窗口时，回溯扫描已过期的合同，
    /// 确保不会遗漏催收提醒。
    /// </remarks>
    private const int LookbackDays = 30;

    /// <summary>
    /// 每日执行时间（小时）
    /// </summary>
    private const int DailyExecutionHour = 0; // 凌晨 0 点

    /// <summary>
    /// 初始化催收提醒后台服务
    /// </summary>
    public RentalReminderBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<RentalReminderBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("催收提醒后台服务已启动");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 先执行扫描（启动时立即执行一次）
                await ScanAndCreateRemindersAsync(stoppingToken);

                // 然后计算下次执行时间
                var now = DateTime.Now;
                var nextRun = now.Date.AddDays(1).AddHours(DailyExecutionHour);
                var delay = nextRun - now;

                _logger.LogInformation("下次执行时间：{NextRun}，等待 {Delay}",
                    nextRun, delay);

                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("催收提醒后台服务已停止");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "催收提醒后台服务执行出错");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    /// <summary>
    /// 扫描并创建催收提醒
    /// </summary>
    private async Task ScanAndCreateRemindersAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("开始扫描即将到期的租赁记录...");

        using var scope = _scopeFactory.CreateScope();
        var rentalRecordRepository = scope.ServiceProvider.GetRequiredService<IRepository<RentalRecord>>();
        var rentalReminderRepository = scope.ServiceProvider.GetRequiredService<IRepository<RentalReminder>>();

        var today = DateTime.Today;
        var reminderDate = today.AddDays(ReminderDaysBeforeExpiry);
        var lookbackDate = today.AddDays(-LookbackDays);

        // 查找即将到期或已过期（回溯期内）的租赁记录
        // 且状态为在租中
        var upcomingExpirations = await rentalRecordRepository
            .AsQueryable()
            .Where(r => r.Status == RentalStatus.Active
                && r.ContractEndDate >= lookbackDate
                && r.ContractEndDate <= reminderDate)
            .ToListAsync(stoppingToken);

        _logger.LogInformation("找到 {Count} 条即将到期的租赁记录", upcomingExpirations.Count);

        var createdCount = 0;
        var skippedCount = 0;

        foreach (var record in upcomingExpirations)
        {
            // 检查是否已存在提醒（避免重复创建）
            var existingReminder = await rentalReminderRepository
                .AsQueryable()
                .AnyAsync(r => r.RentalRecordId == record.Id
                    && r.Status == RentalReminderStatus.Pending, stoppingToken);

            if (existingReminder)
            {
                skippedCount++;
                _logger.LogDebug("租赁记录 {RecordId} 已存在待处理的提醒，跳过", record.Id);
                continue;
            }

            // 创建新的催收提醒
            var reminder = new RentalReminder
            {
                RentalRecordId = record.Id,
                ReminderDate = today,
                Status = RentalReminderStatus.Pending,
                Remark = $"系统自动创建：合同将于 {record.ContractEndDate:yyyy-MM-dd} 到期"
            };

            await rentalReminderRepository.InsertAsync(reminder);
            await rentalReminderRepository.SaveNowAsync();
            createdCount++;

            _logger.LogInformation("已为租赁记录 {RecordId} 创建催收提醒，合同到期日：{ContractEndDate}",
                record.Id, record.ContractEndDate);
        }

        _logger.LogInformation("扫描完成：创建 {CreatedCount} 条提醒，跳过 {SkippedCount} 条已存在的提醒",
            createdCount, skippedCount);
    }
}

using Gentle.Application.Dtos.Maintenance;
using Gentle.Application.Dtos.Meter;
using Gentle.Application.Dtos.Rental;
using Gentle.Application.Dtos.Todo;
using Gentle.Core.Entities;
using Gentle.Core.Enums;
using Mapster;
using Microsoft.EntityFrameworkCore;

namespace Gentle.Application.Services;

/// <summary>
/// 待办事项服务实现
/// </summary>
/// <remarks>
/// 聚合水电费、催收房租和维修待办事项的服务实现。
/// </remarks>
public class TodoService : ITodoService
{
    private readonly IRepository<UtilityBill> _utilityBillRepository;
    private readonly IRepository<RentalReminder> _rentalReminderRepository;
    private readonly IRepository<RentalRecord> _rentalRecordRepository;
    private readonly IRepository<MaintenanceRecord> _maintenanceRepository;

    /// <summary>
    /// 初始化待办事项服务
    /// </summary>
    public TodoService(
        IRepository<UtilityBill> utilityBillRepository,
        IRepository<RentalReminder> rentalReminderRepository,
        IRepository<RentalRecord> rentalRecordRepository,
        IRepository<MaintenanceRecord> maintenanceRepository)
    {
        _utilityBillRepository = utilityBillRepository;
        _rentalReminderRepository = rentalReminderRepository;
        _rentalRecordRepository = rentalRecordRepository;
        _maintenanceRepository = maintenanceRepository;
    }

    /// <inheritdoc />
    public async Task<TodoListResult> GetTodoListAsync(string? type, int page, int pageSize)
    {
        // 验证 type 参数
        if (!string.IsNullOrEmpty(type) &&
            !type.Equals("utility", StringComparison.OrdinalIgnoreCase) &&
            !type.Equals("rental", StringComparison.OrdinalIgnoreCase) &&
            !type.Equals("maintenance", StringComparison.OrdinalIgnoreCase))
        {
            throw Oops.Oh($"无效的待办类型：{type}，有效值为：utility、rental、maintenance");
        }

        // 分页参数边界保护
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var items = new List<TodoItemDto>();
        var utilityCount = 0;
        var rentalCount = 0;
        var maintenanceCount = 0;

        // 根据类型筛选获取待办
        var includeUtility = string.IsNullOrEmpty(type) || type.Equals("utility", StringComparison.OrdinalIgnoreCase);
        var includeRental = string.IsNullOrEmpty(type) || type.Equals("rental", StringComparison.OrdinalIgnoreCase);
        var includeMaintenance = string.IsNullOrEmpty(type) || type.Equals("maintenance", StringComparison.OrdinalIgnoreCase);

        // 获取水电费待办（待收取状态）
        if (includeUtility)
        {
            var utilityBills = await GetUtilityBillTodosAsync();
            utilityCount = utilityBills.Count;
            items.AddRange(utilityBills.Select(MapFromUtilityBill));
        }

        // 获取催收房租待办（待处理状态）
        if (includeRental)
        {
            var rentalReminders = await GetRentalReminderTodosAsync();
            rentalCount = rentalReminders.Count;
            items.AddRange(rentalReminders.Select(MapFromRentalReminder));
        }

        // 获取维修待办（非已完成状态）
        if (includeMaintenance)
        {
            var maintenanceRecords = await GetMaintenanceTodosAsync();
            maintenanceCount = maintenanceRecords.Count;
            items.AddRange(maintenanceRecords.Select(MapFromMaintenanceRecord));
        }

        // 按创建时间倒序排列（使用 TodoItemDto.CreatedTime 统一属性）
        var sortedItems = items
            .OrderByDescending(i => i.CreatedTime)
            .ToList();

        var total = sortedItems.Count;

        // 分页
        var pagedItems = sortedItems
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return new TodoListResult
        {
            Items = pagedItems,
            Total = total,
            UtilityCount = utilityCount,
            RentalCount = rentalCount,
            MaintenanceCount = maintenanceCount
        };
    }

    /// <summary>
    /// 获取水电费待办列表
    /// </summary>
    private async Task<List<UtilityBill>> GetUtilityBillTodosAsync()
    {
        return await _utilityBillRepository
            .AsQueryable(false)
            .Include(b => b.Room)
                .ThenInclude(r => r.Community)
            .Include(b => b.BillTenant)
            .Where(b => b.Status == UtilityBillStatus.Pending)
            .OrderByDescending(b => b.CreatedTime)
            .ToListAsync();
    }

    /// <summary>
    /// 获取催收房租待办列表
    /// </summary>
    private async Task<List<RentalReminder>> GetRentalReminderTodosAsync()
    {
        return await _rentalReminderRepository
            .AsQueryable(false)
            .Include(r => r.RentalRecord)
                .ThenInclude(rr => rr.Renter)
            .Include(r => r.RentalRecord)
                .ThenInclude(rr => rr.Room)
                    .ThenInclude(room => room.Community)
            .Include(r => r.Deferrals)
            .Where(r => r.Status == RentalReminderStatus.Pending
                && r.ReminderDate <= DateTime.Today
                && r.RentalRecord.Status == RentalStatus.Active)
            .OrderByDescending(r => r.CreatedTime)
            .ToListAsync();
    }

    /// <summary>
    /// 将水电账单映射为待办项 DTO
    /// </summary>
    private static TodoItemDto MapFromUtilityBill(UtilityBill bill)
    {
        var roomInfo = bill.Room != null
            ? $"{bill.Room.Community?.Name ?? ""} {bill.Room.Building}栋 {bill.Room.RoomNumber}号"
            : "";

        return new TodoItemDto
        {
            Type = TodoType.Utility,
            Id = bill.Id,
            RoomInfo = roomInfo,
            Amount = bill.TotalAmount,
            Period = $"{bill.PeriodStart:yyyy-MM-dd} ~ {bill.PeriodEnd:yyyy-MM-dd}",
            UtilityBill = new UtilityBillDto
            {
                Id = bill.Id,
                RoomId = bill.RoomId,
                RoomInfo = roomInfo,
                TenantId = bill.BillTenantId,
                TenantName = bill.BillTenant?.Name,
                MeterRecordId = bill.MeterRecordId,
                PeriodStart = bill.PeriodStart,
                PeriodEnd = bill.PeriodEnd,
                WaterUsage = bill.WaterUsage,
                ElectricUsage = bill.ElectricUsage,
                WaterFee = bill.WaterFee,
                ElectricFee = bill.ElectricFee,
                TotalAmount = bill.TotalAmount,
                Status = bill.Status,
                RentalRecordId = bill.RentalRecordId,
                PaidAmount = bill.PaidAmount,
                PaidDate = bill.PaidDate,
                Remark = bill.Remark,
                CreatedTime = bill.CreatedTime
            }
        };
    }

    /// <summary>
    /// 将催收提醒映射为待办项 DTO
    /// </summary>
    private static TodoItemDto MapFromRentalReminder(RentalReminder reminder)
    {
        var rentalRecord = reminder.RentalRecord;
        var room = rentalRecord?.Room;
        var roomInfo = room != null
            ? $"{room.Community?.Name ?? ""} {room.Building}栋 {room.RoomNumber}号"
            : "";

        return new TodoItemDto
        {
            Type = TodoType.Rental,
            Id = reminder.Id,
            RoomInfo = roomInfo,
            TenantName = rentalRecord?.Renter?.Name,
            MonthlyRent = rentalRecord?.MonthlyRent ?? 0,
            DeferralCount = reminder.Deferrals?.Count ?? 0,
            RentalReminder = new RentalReminderDto
            {
                Id = reminder.Id,
                RentalRecordId = reminder.RentalRecordId,
                RoomInfo = roomInfo,
                TenantName = rentalRecord?.Renter?.Name ?? "",
                MonthlyRent = rentalRecord?.MonthlyRent ?? 0,
                ContractEndDate = rentalRecord?.ContractEndDate ?? DateTime.MinValue,
                ReminderDate = reminder.ReminderDate,
                Status = reminder.Status,
                DeferralCount = reminder.Deferrals?.Count ?? 0,
                Remark = reminder.Remark,
                CreatedTime = reminder.CreatedTime
            }
        };
    }

    /// <summary>
    /// 获取维修待办列表（非已完成状态）
    /// </summary>
    private async Task<List<MaintenanceRecord>> GetMaintenanceTodosAsync()
    {
        return await _maintenanceRepository
            .AsQueryable(false)
            .Include(m => m.Room)
                .ThenInclude(r => r.Community)
            .Where(m => m.Status != MaintenanceStatus.Completed)
            .OrderByDescending(m => m.CreatedTime)
            .ToListAsync();
    }

    /// <summary>
    /// 将维修记录映射为待办项 DTO
    /// </summary>
    private static TodoItemDto MapFromMaintenanceRecord(MaintenanceRecord record)
    {
        var roomInfo = record.Room != null
            ? $"{record.Room.Community?.Name ?? ""} {record.Room.Building}栋 {record.Room.RoomNumber}号"
            : "";

        return new TodoItemDto
        {
            Type = TodoType.Maintenance,
            Id = record.Id,
            RoomInfo = roomInfo,
            Description = record.Description,
            Priority = record.Priority,
            PriorityText = record.Priority switch
            {
                MaintenancePriority.Urgent => "紧急",
                MaintenancePriority.Normal => "普通",
                MaintenancePriority.Low => "低优先级",
                _ => "未知"
            },
            MaintenanceCost = record.Cost,
            MaintenanceStatus = record.Status,
            MaintenanceStatusText = record.Status switch
            {
                MaintenanceStatus.Pending => "待处理",
                MaintenanceStatus.InProgress => "进行中",
                MaintenanceStatus.Completed => "已完成",
                _ => "未知"
            },
            MaintenanceDetail = new MaintenanceDetailDto
            {
                Id = record.Id,
                RoomId = record.RoomId,
                RoomInfo = roomInfo,
                Description = record.Description,
                Priority = record.Priority,
                Status = record.Status,
                ReportDate = record.ReportDate,
                CompletedDate = record.CompletedDate,
                Cost = record.Cost,
                RepairPerson = record.RepairPerson,
                RepairPhone = record.RepairPhone,
                Images = record.Images,
                Remark = record.Remark,
                CreatedTime = record.CreatedTime
            }
        };
    }
}

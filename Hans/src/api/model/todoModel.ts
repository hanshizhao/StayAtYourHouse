// 从 rentalModel 复用 LeaseType 枚举（避免重复定义）
import type { LeaseType } from './rentalModel';

// 从 meterModel 复用 UtilityBillItem 接口（避免重复定义）
export type { UtilityBillItem } from './meterModel';

/**
 * 待办类型枚举（与后端 Gentle.Core.Enums.TodoType 保持一致)
 */
export enum TodoType {
  /** 水电费待办 */
  Utility = 0,
  /** 催收房租待办 */
  Rental = 1,
}

/**
 * 待办类型文本映射
 */
export const TodoTypeText: Record<TodoType, string> = {
  [TodoType.Utility]: '水电费',
  [TodoType.Rental]: '催收房租',
};

/**
 * 催收提醒状态枚举(与后端 Gentle.Core.Enums.RentalReminderStatus 保持一致)
 */
export enum RentalReminderStatus {
  /** 待处理 */
  Pending = 0,
  /** 已宽限 */
  Deferred = 1,
  /** 已完成 */
  Completed = 2,
}

/**
 * 催收提醒状态文本映射
 */
export const RentalReminderStatusText: Record<RentalReminderStatus, string> = {
  [RentalReminderStatus.Pending]: '待处理',
  [RentalReminderStatus.Deferred]: '已宽限',
  [RentalReminderStatus.Completed]: '已完成',
};

export { LeaseType, LeaseTypeText } from './rentalModel';

/**
 * 水电账单简略 DTO（用于 TodoItem）
 * @deprecated 请使用 UtilityBillItem 替代
 */
export type UtilityBillSimple = import('./meterModel').UtilityBillItem;

/**
 * 催收提醒 DTO(与后端 RentalReminderDto 保持一致)
 */
export interface RentalReminderItem {
  id: number;
  rentalRecordId: number;
  roomInfo: string;
  tenantName: string;
  monthlyRent: number;
  contractEndDate: string;
  reminderDate: string;
  status: RentalReminderStatus;
  statusText: string;
  deferralCount: number;
  remark?: string;
  createdTime: string;
}

/**
 * 待办事项 DTO(与后端 TodoItemDto 保持一致)
 */
export interface TodoItem {
  /** 待办类型 */
  type: TodoType;
  /** 待办ID（水电费为账单ID，催收房租为提醒ID） */
  id: number;
  /** 房间信息 */
  roomInfo: string;
  /** 创建时间 */
  createdTime: string;

  // ===== 水电费待办专用字段 =====
  /** 账单金额 */
  amount?: number;
  /** 账单周期 */
  period?: string;
  /** 水电账单详情 */
  utilityBill?: UtilityBillSimple;

  // ===== 催收房租待办专用字段 =====
  /** 租客姓名 */
  tenantName?: string;
  /** 月租金 */
  monthlyRent?: number;
  /** 宽限次数 */
  deferralCount: number;
  /** 催收提醒详情 */
  rentalReminder?: RentalReminderItem;
}

/**
 * 待办事项列表结果(与后端 TodoListResult 保持一致)
 */
export interface TodoListResult {
  /** 待办事项列表 */
  items: TodoItem[];
  /** 待办总数 */
  total: number;
  /** 水电费待办数量 */
  utilityCount: number;
  /** 催收房租待办数量 */
  rentalCount: number;
}

/**
 * 宽限提醒输入(与后端 DeferReminderInput 保持一致)
 */
export interface DeferReminderInput {
  /** 宽限至日期 */
  deferredToDate: string;
  /** 备注 */
  remark?: string;
}

/**
 * 续租输入(与后端 RenewRentalInput 保持一致)
 */
export interface RenewRentalInput {
  /** 租期类型 */
  leaseType: LeaseType;
  /** 月租金 */
  monthlyRent: number;
  /** 合同到期日 */
  contractEndDate: string;
  /** 合同图片 */
  contractImage?: string;
  /** 备注 */
  remark?: string;
}

/**
 * 续租结果
 * @note 后端当前返回 int（新租赁记录ID），此类型保留以备将来扩展
 */
export interface RenewResult {
  /** 新租赁记录ID */
  rentalRecordId: number;
}

/**
 * 宽限记录 DTO(与后端 DeferralRecordDto 保持一致)
 */
export interface DeferralRecordItem {
  id: number;
  originalReminderDate: string;
  deferredToDate: string;
  deferralDays: number;
  remark?: string;
  createdTime: string;
}

/**
 * 宽限记录列表结果(与后端 DeferralListResult 保持一致)
 */
export interface DeferralListResult {
  items: DeferralRecordItem[];
  total: number;
}

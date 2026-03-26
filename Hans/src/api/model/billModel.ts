/**
 * 账单状态枚举
 */
export enum BillStatus {
  /** 待收款 */
  Pending = 0,
  /** 宽限中 */
  Grace = 1,
  /** 已收款 */
  Paid = 2,
  /** 已逾期 */
  Overdue = 3,
}

/**
 * 催收结果枚举（与后端 Gentle.Core.Enums.CollectResult 保持一致）
 */
export enum CollectResult {
  /** 催收成功 */
  Success = 0,
  /** 宽限处理 */
  Grace = 1,
  /** 拒绝支付 */
  Refuse = 2,
}

/**
 * 催收记录 DTO（与后端 CollectionRecordDto 保持一致）
 */
export interface CollectionRecordDto {
  id: number;
  billId: number;
  collectDate: string;
  result: CollectResult;
  resultText: string;
  graceUntil?: string;
  remark?: string;
  createdTime: string;
}

/**
 * 账单列表项（与后端 BillDto 保持一致）
 */
export interface BillItem {
  id: number;
  rentalRecordId: number;
  tenantName: string;
  roomInfo: string;
  periodStart: string;
  periodEnd: string;
  periodText: string;
  dueDate: string;
  rentAmount: number;
  waterFee?: number;
  electricFee?: number;
  totalAmount: number;
  status: BillStatus;
  statusText: string;
  paidAmount?: number;
  paidDate?: string;
  graceUntil?: string;
  daysRemaining?: number | null;
  collectionRecords?: CollectionRecordDto[];
  remark?: string;
  createdTime: string;
}

/**
 * 账单列表查询参数
 */
export interface BillListParams {
  /** 状态筛选（pending/grace/paid/overdue） */
  status?: string;
  /** 小区ID筛选 */
  communityId?: number;
  /** 月份筛选（格式：yyyy-MM） */
  month?: string;
  /** 页码（从1开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 账单列表结果
 */
export interface BillListResult {
  items: BillItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 催收请求参数（与后端 CollectInput 保持一致）
 */
export interface CollectInput {
  billId: number;
  result: CollectResult;
  paidAmount?: number;
  graceUntil?: string;
  remark?: string;
}

/**
 * 待办汇总（与后端 TodoSummary 保持一致）
 */
export interface TodoSummary {
  /** 逾期数量 */
  overdueCount: number;
  /** 宽限到期数量 */
  graceExpiringCount: number;
  /** 今日到期数量 */
  dueTodayCount: number;
  /** 即将到期数量 */
  upcomingCount: number;
  /** 总待办数量 */
  totalCount: number;
}

/**
 * 待办账单 DTO（与后端 TodoBillsDto 保持一致）
 */
export interface TodoBillsDto {
  /** 逾期账单（已超过应收日期且未收款） */
  overdue: BillItem[];
  /** 宽限到期账单（今日宽限截止） */
  graceExpiring: BillItem[];
  /** 今日到期账单（应收日期为今日） */
  dueToday: BillItem[];
  /** 即将到期账单（3天内到期） */
  upcoming: BillItem[];
  /** 各类待办数量汇总 */
  summary: TodoSummary;
}

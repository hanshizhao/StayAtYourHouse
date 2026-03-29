/**
 * 水电账单状态枚举（与后端 Gentle.Core.Enums.UtilityBillStatus 保持一致）
 */
export enum UtilityBillStatus {
  /** 待收款 */
  Pending = 0,
  /** 已收款 */
  Paid = 1,
}

/**
 * 水电账单状态文本映射
 */
export const UtilityBillStatusText: Record<UtilityBillStatus, string> = {
  [UtilityBillStatus.Pending]: '待收款',
  [UtilityBillStatus.Paid]: '已收款',
};

/**
 * 抄表记录 DTO（与后端 MeterRecordDto 保持一致）
 */
export interface MeterRecordItem {
  id: number;
  roomId: number;
  roomInfo: string;
  meterDate: string;
  meterDateText: string;
  waterReading: number;
  electricReading: number;
  prevWaterReading: number;
  prevElectricReading: number;
  waterUsage: number;
  electricUsage: number;
  waterPrice?: number;
  electricPrice?: number;
  waterFee: number;
  electricFee: number;
  totalFee: number;
  remark?: string;
  hasBill: boolean;
  createdTime: string;
}

/**
 * 抄表记录列表结果
 */
export interface MeterListResult {
  items: MeterRecordItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 水电账单 DTO（与后端 UtilityBillDto 保持一致）
 */
export interface UtilityBillItem {
  id: number;
  roomId: number;
  roomInfo: string;
  billTenantId?: number;
  tenantName?: string;
  meterRecordId: number;
  rentalRecordId?: number;
  periodStart: string;
  periodEnd: string;
  waterUsage: number;
  electricUsage: number;
  waterFee: number;
  electricFee: number;
  totalAmount: number;
  status: UtilityBillStatus;
  statusText: string;
  paidAmount?: number;
  paidDate?: string;
  remark?: string;
  createdTime: string;
}

/**
 * 水电账单列表结果
 */
export interface UtilityBillListResult {
  items: UtilityBillItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 上次抄表读数结果
 */
export interface LastReadingsResult {
  waterReading: number;
  electricReading: number;
}

/**
 * 抄表录入输入（与后端 RecordMeterInput 保持一致）
 */
export interface RecordMeterInput {
  roomId: number;
  meterDate: string;
  waterReading: number;
  electricReading: number;
  remark?: string;
}

/**
 * 水电费收款输入（与后端 PayUtilityBillInput 保持一致）
 */
export interface PayUtilityBillInput {
  billId: number;
  paidAmount: number;
  remark?: string;
}

/**
 * 抄表记录查询参数
 */
export interface MeterListParams {
  communityId?: number;
  roomId?: number;
  page?: number;
  pageSize?: number;
}

/**
 * 水电账单查询参数
 */
export interface UtilityBillListParams {
  status?: string;
  communityId?: number;
  month?: string;
  page?: number;
  pageSize?: number;
}

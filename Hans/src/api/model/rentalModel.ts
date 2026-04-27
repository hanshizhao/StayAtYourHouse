import type { UtilityBillItem } from '@/api/model/meterModel';

/**
 * 租住状态枚举
 */
export enum RentalStatus {
  /** 活跃 */
  Active = 0,
  /** 已终止 */
  Terminated = 1,
}

/**
 * 押金状态枚举
 */
export enum DepositStatus {
  /** 已收 */
  Received = 0,
  /** 已退 */
  Refunded = 1,
  /** 已抵扣 */
  Deducted = 2,
}

/**
 * 入住请求参数
 */
export interface CheckInInput {
  /** 租客ID */
  tenantId: number;
  /** 房间ID */
  roomId: number;
  /** 入住日期 */
  checkInDate: string;
  /** 租期月数 */
  leaseMonths: number;
  /** 月租金 */
  monthlyRent: number;
  /** 押金 */
  deposit: number;
  /** 备注 */
  remark?: string;
  /** 合同图片路径 */
  contractImage?: string;
}

/**
 * 退租请求参数
 */
export interface CheckOutInput {
  /** 租住记录ID */
  rentalRecordId: number;
  /** 退租日期 */
  checkOutDate: string;
  /** 押金状态 */
  depositStatus: DepositStatus;
  /** 押金抵扣金额（押金状态为已抵扣时必填） */
  depositDeduction?: number;
  /** 退租备注 */
  checkOutRemark?: string;
}

/**
 * 修改租约请求参数
 */
export interface UpdateRentalInput {
  /** 入住日期 */
  checkInDate: string;
  /** 租期月数 */
  leaseMonths: number;
  /** 合同结束日期 */
  contractEndDate: string;
  /** 月租金 */
  monthlyRent: number;
  /** 押金 */
  deposit: number;
  /** 备注 */
  remark?: string;
}

/**
 * 租住记录DTO
 */
export interface RentalRecordDto {
  id: number;
  tenantId: number;
  tenantName: string;
  roomId: number;
  roomInfo: string;
  checkInDate: string;
  leaseMonths: number;
  leaseMonthsText: string;
  contractEndDate: string;
  checkOutDate?: string;
  monthlyRent: number;
  deposit: number;
  depositDeduction?: number;
  depositStatus: DepositStatus;
  depositStatusText: string;
  status: RentalStatus;
  statusText: string;
  remark?: string;
  checkOutRemark?: string;
  createdTime: string;
  /** 是否已提交安居码 */
  isAnJuCodeSubmitted: boolean;
  /** 关联水电账单列表 */
  utilityBills?: UtilityBillItem[];
}

/**
 * 租住记录分页查询参数
 */
export interface RentalPageParams {
  /** 状态筛选（active/terminated） */
  status?: string;
  /** 房间ID筛选 */
  roomId?: number;
  /** 租客ID筛选 */
  tenantId?: number;
  /** 页码（从1开始） */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 租住记录分页结果
 */
export interface RentalPageResult {
  items: RentalRecordDto[];
  total: number;
  page: number;
  pageSize: number;
}

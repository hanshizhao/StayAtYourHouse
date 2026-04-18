import type { LandlordLeaseDetail } from './landlordLeaseModel';

/**
 * 租约状态枚举
 */
export enum LeaseStatus {
  /** 正常 */
  Normal = 0,
  /** 即将到期（7天内） */
  ExpiringSoon = 1,
  /** 已过期 */
  Expired = 2,
  /** 无租约 */
  None = 3,
}

/**
 * 房间状态枚举
 */
export enum RoomStatus {
  /** 空置 */
  Vacant = 0,
  /** 已出租 */
  Rented = 1,
  /** 装修中 */
  Renovating = 2,
  /** 已收回 */
  Reclaimed = 3,
}

/**
 * 房间状态文本映射
 */
export const RoomStatusText: Record<RoomStatus, string> = {
  [RoomStatus.Vacant]: '空置',
  [RoomStatus.Rented]: '已出租',
  [RoomStatus.Renovating]: '装修中',
  [RoomStatus.Reclaimed]: '已收回',
};

/**
 * 房间信息
 */
export interface RoomItem {
  id: number;
  communityId: number;
  communityName: string;
  building: string;
  roomNumber: string;
  rentPrice: number;
  profit: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  status: RoomStatus;
  anjuCodeSubmitted?: boolean | null;
  tenantName?: string | null;
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  contractImage?: string;
  remark?: string;
  createdTime: string;
  landlordLease?: LandlordLeaseDetail;
  landlordLeaseStatus: LeaseStatus;
  landlordLeaseExpiredDays?: number | null;
  tenantLeaseStatus: LeaseStatus;
  tenantLeaseExpiredDays?: number | null;
  tenantMonthlyRent?: number | null;
}

/**
 * 获取房间列表参数
 */
export interface GetRoomListParams {
  communityId?: number;
  status?: RoomStatus;
  hasLeaseAlert?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * 创建房间参数
 */
export interface CreateRoomParams {
  communityId: number;
  building: string;
  roomNumber: string;
  rentPrice: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  status?: RoomStatus;
  contractImage?: string;
  remark?: string;
}

/**
 * 更新房间参数
 */
export interface UpdateRoomParams {
  id: number;
  communityId: number;
  building: string;
  roomNumber: string;
  rentPrice: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  status: RoomStatus;
  contractImage?: string;
  remark?: string;
}

/**
 * 房间列表分页结果
 */
export interface RoomListResult {
  list: RoomItem[];
  total: number;
  page: number;
  pageSize: number;
}

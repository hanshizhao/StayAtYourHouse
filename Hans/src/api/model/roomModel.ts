import type { LandlordLeaseDetail } from './landlordLeaseModel';

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
}

/**
 * 获取房间列表参数
 */
export interface GetRoomListParams {
  communityId?: number;
  status?: RoomStatus;
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

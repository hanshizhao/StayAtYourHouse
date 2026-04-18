/**
 * 性别枚举
 */
export enum Gender {
  Male = 0,
  Female = 1,
}

/**
 * 租住状态枚举
 */
export enum RentalStatus {
  Active = 0,
  Terminated = 1,
}

/**
 * 当前房间信息
 */
export interface CurrentRoomInfo {
  roomId: number;
  communityName: string;
  building: string;
  roomNumber: string;
  fullInfo: string;
}

/**
 * 租客列表查询参数
 */
export interface TenantListParams {
  /** 搜索关键字（姓名/电话/身份证号） */
  keyword?: string;
  /** 页码（从1开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 分页租客列表结果
 */
export interface TenantListResult {
  list: TenantItem[];
  total: number;
}

/**
 * 租客列表项
 */
export interface TenantItem {
  id: number;
  name: string;
  phone?: string;
  idCard?: string;
  gender: Gender;
  genderText: string;
  remark?: string;
  createdTime: string;
  /** 当前房间信息(如果有活跃租住记录) */
  currentRoom?: CurrentRoomInfo;
  /** 当前活跃租住记录ID(用于退租) */
  rentalRecordId?: number;
  /** 租住状态(如果有活跃租住记录) */
  status?: RentalStatus;
  /** 租住状态文本 */
  statusText?: string;
  /** 合同入住日期 */
  checkInDate?: string;
  /** 合同结束日期 */
  contractEndDate?: string;
}

/**
 * 创建租客参数
 */
export interface CreateTenantParams {
  name: string;
  phone?: string;
  idCard?: string;
  gender: Gender;
  remark?: string;
}

/**
 * 更新租客参数
 */
export interface UpdateTenantParams {
  id: number;
  name: string;
  phone?: string;
  idCard?: string;
  gender: Gender;
  remark?: string;
}

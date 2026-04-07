/**
 * 维修优先级枚举（与后端 Gentle.Core.Enums.MaintenancePriority 保持一致）
 */
export enum MaintenancePriority {
  /** 紧急 */
  Urgent = 0,
  /** 普通 */
  Normal = 1,
  /** 低优先级 */
  Low = 2,
}

/**
 * 维修优先级文本映射
 */
export const MaintenancePriorityText: Record<MaintenancePriority, string> = {
  [MaintenancePriority.Urgent]: '紧急',
  [MaintenancePriority.Normal]: '普通',
  [MaintenancePriority.Low]: '低优先级',
};

/**
 * 维修状态枚举（与后端 Gentle.Core.Enums.MaintenanceStatus 保持一致）
 */
export enum MaintenanceStatus {
  /** 待处理 */
  Pending = 0,
  /** 进行中 */
  InProgress = 1,
  /** 已完成 */
  Completed = 2,
}

/**
 * 维修状态文本映射
 */
export const MaintenanceStatusText: Record<MaintenanceStatus, string> = {
  [MaintenanceStatus.Pending]: '待处理',
  [MaintenanceStatus.InProgress]: '进行中',
  [MaintenanceStatus.Completed]: '已完成',
};

/**
 * 维修记录详情 DTO（与后端 MaintenanceDetailDto 保持一致）
 */
export interface MaintenanceDetail {
  id: number;
  roomId: number;
  roomInfo: string;
  description: string;
  priority: MaintenancePriority;
  priorityText: string;
  status: MaintenanceStatus;
  statusText: string;
  reportDate: string;
  completedDate?: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
  createdTime: string;
}

/**
 * 维修记录列表结果（与后端 MaintenanceListResult 保持一致）
 */
export interface MaintenanceListResult {
  items: MaintenanceDetail[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 新增维修记录输入（与后端 MaintenanceAddInput 保持一致）
 */
export interface MaintenanceAddInput {
  roomId: number;
  description: string;
  priority: MaintenancePriority;
  reportDate: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
}

/**
 * 更新维修记录输入（与后端 MaintenanceUpdateInput 保持一致）
 */
export interface MaintenanceUpdateInput {
  id: number;
  description: string;
  priority: MaintenancePriority;
  reportDate: string;
  cost?: number;
  repairPerson?: string;
  repairPhone?: string;
  images?: string;
  remark?: string;
  status: MaintenanceStatus;
}

/**
 * 完成维修输入（与后端 CompleteMaintenanceInput 保持一致）
 */
export interface CompleteMaintenanceInput {
  actualCost?: number;
  remark?: string;
}

/**
 * 维修记录查询参数
 */
export interface MaintenanceListParams {
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  roomId?: number;
  communityId?: number;
  page?: number;
  pageSize?: number;
}

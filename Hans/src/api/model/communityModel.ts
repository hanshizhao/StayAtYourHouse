/**
 * 小区信息
 */
export interface CommunityItem {
  id: number;
  name: string;
  address?: string;
  propertyPhone?: string;
  remark?: string;
  createdTime: string;
}

/**
 * 创建小区参数
 */
export interface CreateCommunityParams {
  name: string;
  address?: string;
  propertyPhone?: string;
  remark?: string;
}

/**
 * 更新小区参数
 */
export interface UpdateCommunityParams {
  id: number;
  name: string;
  address?: string;
  propertyPhone?: string;
  remark?: string;
}

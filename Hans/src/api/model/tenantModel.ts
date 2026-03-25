/**
 * 性别枚举
 */
export enum Gender {
  Male = 0,
  Female = 1,
}

/**
 * 性别文本映射
 */
export const GenderTextMap: Record<Gender, string> = {
  [Gender.Male]: '男',
  [Gender.Female]: '女',
};

/**
 * 租客列表项
 */
export interface TenantItem {
  id: number;
  name: string;
  phone: string;
  idCard?: string;
  gender: Gender;
  genderText: string;
  emergencyContact?: string;
  remark?: string;
  createdTime: string;
}

/**
 * 创建租客参数
 */
export interface CreateTenantParams {
  name: string;
  phone: string;
  idCard?: string;
  gender: Gender;
  emergencyContact?: string;
  remark?: string;
}

/**
 * 更新租客参数
 */
export interface UpdateTenantParams {
  id: number;
  name: string;
  phone: string;
  idCard?: string;
  gender: Gender;
  emergencyContact?: string;
  remark?: string;
}

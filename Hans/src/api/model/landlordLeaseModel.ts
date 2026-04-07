/**
 * 付款方式枚举
 */
export enum PaymentMethod {
  /** 月付 */
  Monthly = 0,
  /** 季付 */
  Quarterly = 1,
  /** 半年付 */
  SemiAnnual = 2,
  /** 年付 */
  Annual = 3,
  /** 自定义 */
  Custom = 4,
}

/**
 * 付款方式文本映射
 */
export const PaymentMethodText: Record<PaymentMethod, string> = {
  [PaymentMethod.Monthly]: '月付',
  [PaymentMethod.Quarterly]: '季付',
  [PaymentMethod.SemiAnnual]: '半年付',
  [PaymentMethod.Annual]: '年付',
  [PaymentMethod.Custom]: '自定义',
};

/**
 * 房东租约详情
 */
export interface LandlordLeaseDetail {
  id: number;
  roomId: number;
  landlordName: string;
  landlordPhone?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent: number;
  paymentMethod: PaymentMethod;
  paymentMethodText: string;
  depositMonths?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  remark?: string;
  createdTime: string;
  roomInfo?: string;
}

/**
 * 创建房东租约参数
 */
export interface CreateLandlordLeaseParams {
  roomId: number;
  landlordName: string;
  landlordPhone?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent: number;
  paymentMethod: PaymentMethod;
  depositMonths?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  remark?: string;
}

/**
 * 更新房东租约参数
 */
export interface UpdateLandlordLeaseParams {
  id: number;
  landlordName: string;
  landlordPhone?: string;
  startDate?: string;
  endDate?: string;
  monthlyRent: number;
  paymentMethod: PaymentMethod;
  depositMonths?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
  remark?: string;
}

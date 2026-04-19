/**
 * 欠款状态枚举
 */
export enum DebtStatus {
  Ongoing = 0,
  Settled = 1,
}

/**
 * 还款方式枚举
 */
export enum PaymentChannel {
  Cash = 0,
  WeChat = 1,
  Alipay = 2,
  BankTransfer = 3,
}

/**
 * 欠款状态映射
 */
export const DEBT_STATUS_MAP: Record<DebtStatus, string> = {
  [DebtStatus.Ongoing]: '进行中',
  [DebtStatus.Settled]: '已结清',
};

/**
 * 还款方式映射
 */
export const PAYMENT_CHANNEL_MAP: Record<PaymentChannel, string> = {
  [PaymentChannel.Cash]: '现金',
  [PaymentChannel.WeChat]: '微信',
  [PaymentChannel.Alipay]: '支付宝',
  [PaymentChannel.BankTransfer]: '银行转账',
};

/**
 * 欠款列表项
 */
export interface DebtListItem {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  statusText: string;
  description?: string;
  createdTime: string;
}

/**
 * 还款记录项
 */
export interface DebtRepaymentItem {
  id: number;
  debtId: number;
  amount: number;
  paymentDate: string;
  paymentChannel: PaymentChannel;
  paymentChannelText: string;
  remark?: string;
  createdTime: string;
}

/**
 * 欠款详情
 */
export interface DebtDetail {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  statusText: string;
  description?: string;
  remark?: string;
  createdTime: string;
  repayments: DebtRepaymentItem[];
}

/**
 * 欠款列表查询参数
 */
export interface GetDebtListParams {
  /** 搜索关键字（租客姓名/电话） */
  keyword?: string;
  /** 欠款状态筛选 */
  status?: DebtStatus;
  /** 页码（从1开始） */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 欠款列表分页结果
 */
export interface DebtListResult {
  list: DebtListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建欠款参数
 */
export interface CreateDebtParams {
  tenantId: number;
  totalAmount: number;
  description?: string;
  remark?: string;
}

/**
 * 更新欠款参数
 */
export interface UpdateDebtParams {
  id: number;
  totalAmount: number;
  description?: string;
  remark?: string;
}

/**
 * 添加还款参数
 */
export interface AddRepaymentParams {
  amount: number;
  paymentDate: string;
  paymentChannel: PaymentChannel;
  remark?: string;
}

/**
 * 统计报表相关类型定义
 */

/** 月度收入明细 */
export interface MonthlyIncome {
  /** 月份（1-12） */
  month: number;
  /** 月份文本（如：1月） */
  monthText: string;
  /** 租金收入 */
  rentIncome: number;
  /** 水电费收入 */
  utilityIncome: number;
  /** 总收入 */
  totalIncome: number;
  /** 支出（成本） */
  expense: number;
  /** 净利润 */
  netProfit: number;
}

/** 收支统计报表 */
export interface IncomeReport {
  /** 年份 */
  year: number;
  /** 年度租金总收入 */
  totalRentIncome: number;
  /** 年度水电费总收入 */
  totalUtilityIncome: number;
  /** 年度总收入 */
  totalIncome: number;
  /** 年度总支出（成本） */
  totalExpense: number;
  /** 年度净利润 */
  netProfit: number;
  /** 月度明细 */
  monthlyDetails: MonthlyIncome[];
}

/** 房源概览统计 */
export interface HousingOverview {
  /** 总房源数 */
  totalRooms: number;
  /** 已出租数 */
  rentedRooms: number;
  /** 空置数 */
  vacantRooms: number;
  /** 装修中数 */
  renovatingRooms: number;
  /** 出租率 */
  occupancyRate: number;
  /** 小区统计 */
  communityStats: CommunityStat[];
  /** 空置房源列表 */
  vacantRoomList: VacantRoomInfo[];
}

/** 小区统计 */
export interface CommunityStat {
  /** 小区ID */
  communityId: number;
  /** 小区名称 */
  communityName: string;
  /** 总房源数 */
  totalRooms: number;
  /** 已出租数 */
  rentedRooms: number;
  /** 空置数 */
  vacantRooms: number;
  /** 出租率 */
  occupancyRate: number;
}

/** 空置房源信息 */
export interface VacantRoomInfo {
  /** 房间ID */
  roomId: number;
  /** 房间信息（如：幸福小区 1栋 101） */
  roomInfo: string;
  /** 空置天数 */
  vacantDays: number;
  /** 月租金 */
  monthlyRent: number;
}

/** 房间利润排行 */
export interface RoomProfitRanking {
  /** 房间ID */
  roomId: number;
  /** 房间信息 */
  roomInfo: string;
  /** 小区名称 */
  communityName: string;
  /** 月租金 */
  monthlyRent: number;
  /** 月成本 */
  monthlyCost: number;
  /** 月利润 */
  monthlyProfit: number;
  /** 年利润 */
  yearlyProfit: number;
}

/** 催收统计报表 */
export interface CollectionReport {
  /** 年份 */
  year: number;
  /** 月份（null 表示全年） */
  month: number | null;
  /** 月份文本（如：2026年1月 或 2026年全年） */
  monthText: string;
  /** 应收账单数 */
  totalBills: number;
  /** 应收总金额 */
  totalAmount: number;
  /** 已收账单数 */
  paidBills: number;
  /** 已收金额 */
  paidAmount: number;
  /** 待收账单数 */
  pendingBills: number;
  /** 待收金额 */
  pendingAmount: number;
  /** 逾期账单数 */
  overdueBills: number;
  /** 逾期金额 */
  overdueAmount: number;
  /** 收款率 */
  collectionRate: number;
  /** 逾期名单 */
  overdueList: OverdueBillInfo[];
}

/** 逾期账单信息 */
export interface OverdueBillInfo {
  /** 账单ID */
  billId: number;
  /** 租客姓名 */
  tenantName: string;
  /** 房间信息 */
  roomInfo: string;
  /** 账单金额 */
  totalAmount: number;
  /** 逾期天数 */
  overdueDays: number;
}

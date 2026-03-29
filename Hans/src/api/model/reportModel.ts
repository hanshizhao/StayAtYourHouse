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
  /** 押金收入（不计入净利润） */
  depositIncome: number;
  /** 总收入（不含押金） */
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
  /** 年度押金收入（不计入净利润） */
  totalDepositIncome: number;
  /** 年度总收入（不含押金） */
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
  rentedCount: number;
  /** 空置数 */
  vacantCount: number;
  /** 装修中数 */
  renovatingCount: number;
  /** 出租率（百分比 0-100） */
  occupancyRate: number;
  /** 小区统计 */
  communityStats: CommunityStat[];
  /** 空置房源列表 */
  vacantRooms: VacantRoomInfo[];
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
  rentedCount: number;
  /** 空置数 */
  vacantCount: number;
  /** 出租率（百分比 0-100） */
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
  rentPrice: number;
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

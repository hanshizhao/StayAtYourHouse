// 类型导入说明：
// - IncomeReport: 当前使用（FEAT-026 收支统计页）
// - HousingOverview, RoomProfitRanking, CollectionReport: 预留类型（FEAT-027~029 使用）
import type { CollectionReport, HousingOverview, IncomeReport, RoomProfitRanking } from '@/api/model/reportModel';
import { request } from '@/utils/request';

const Api = {
  IncomeReport: '/report-app/income-report',
  HousingOverview: '/report-app/housing-overview',
  ProfitRanking: '/report-app/profit-ranking',
  CollectionReport: '/report-app/collection-report',
};

/**
 * 获取收支统计报表
 * @param year 年份，默认当前年份
 */
export function getIncomeReport(year?: number) {
  return request.get<IncomeReport>({
    url: Api.IncomeReport,
    params: year ? { year } : undefined,
  });
}

/**
 * 获取房源概览统计
 */
export function getHousingOverview() {
  return request.get<HousingOverview>({
    url: Api.HousingOverview,
  });
}

/**
 * 获取房间利润排行
 * @param sortBy 排序字段：monthly（月利润，默认）、yearly（年利润）
 * @param limit 返回数量限制，默认50
 */
export function getProfitRanking(sortBy?: string, limit?: number) {
  return request.get<RoomProfitRanking[]>({
    url: Api.ProfitRanking,
    params: {
      ...(sortBy && { sortBy }),
      ...(limit && { limit }),
    },
  });
}

/**
 * 获取催收统计报表
 * @param year 年份，默认当前年份
 * @param month 月份（可选，不传则统计全年）
 */
export function getCollectionReport(year?: number, month?: number) {
  return request.get<CollectionReport>({
    url: Api.CollectionReport,
    params: {
      ...(year && { year }),
      ...(month && { month }),
    },
  });
}

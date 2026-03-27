// 类型导入说明：
// - IncomeReport: 当前使用（FEAT-026 收支统计页）
// - HousingOverview, RoomProfitRanking, CollectionReport: 预留类型（FEAT-027~029 使用）
import type { CollectionReport, HousingOverview, IncomeReport, RoomProfitRanking } from '@/api/model/reportModel';
import { request } from '@/utils/request';

/**
 * 获取收支统计报表
 * @param year 年份，默认当前年份
 */
export function getIncomeReport(year?: number) {
  const yearValue = year ?? new Date().getFullYear();
  return request.get<IncomeReport>({
    url: `/report-app/income-report/${yearValue}`,
  });
}

/**
 * 获取房源概览统计
 */
export function getHousingOverview() {
  return request.get<HousingOverview>({
    url: '/report-app/housing-overview',
  });
}

/**
 * 获取房间利润排行
 * @param sortBy 排序字段：monthly（月利润，默认）、yearly（年利润）
 * @param limit 返回数量限制，默认50
 */
export function getProfitRanking(sortBy?: string, limit?: number) {
  const sortByValue = sortBy ?? 'monthly';
  const limitValue = limit ?? 50;
  return request.get<RoomProfitRanking[]>({
    url: `/report-app/profit-ranking/${sortByValue}/${limitValue}`,
  });
}

/**
 * 获取催收统计报表
 * @param year 年份，默认当前年份
 * @param month 月份（可选，不传则统计全年）
 */
export function getCollectionReport(year?: number, month?: number) {
  const yearValue = year ?? new Date().getFullYear();
  // 如果有月份，使用 /collection-report/{year}/{month} 格式
  // 否则使用 /collection-report/{year} 格式
  const url = month
    ? `/report-app/collection-report/${yearValue}/${month}`
    : `/report-app/collection-report/${yearValue}`;

  return request.get<CollectionReport>({
    url,
  });
}

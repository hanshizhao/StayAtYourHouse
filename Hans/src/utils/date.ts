// 获取常用时间
import dayjs from 'dayjs';

// 重新导出 LeaseType 供其他模块使用
export { LeaseType } from '@/api/model/rentalModel';

export const LAST_7_DAYS = [
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];

export const LAST_30_DAYS = [
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];

/**
 * 格式化日期时间为本地格式
 * @param dateStr 日期字符串
 * @returns 格式化后的日期时间字符串，如 "2024/03/25 14:30"
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD HH:mm');
}

/**
 * 格式化日期为本地格式
 * @param dateStr 日期字符串
 * @returns 格式化后的日期字符串，如 "2024/03/25"
 */
export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? dayjs(dateStr) : dayjs(dateStr);
    return date.format('YYYY/MM/DD');
  } catch {
    return '-';
  }
}

import { LeaseType } from '@/api/model/rentalModel';

/**
 * 计算合同到期日期
 * @param checkInDate 入住日期（YYYY-MM-DD 格式）
 * @param leaseType 租期类型
 * @returns 合同到期日期（YYYY-MM-DD 格式）或 null
 */
export function calculateContractEndDate(
  checkInDate: string | null | undefined,
  leaseType: LeaseType | null | undefined,
): string | null {
  if (!checkInDate || leaseType === null || leaseType === undefined) {
    return null;
  }

  const checkIn = dayjs(checkInDate);
  let endDate: dayjs.Dayjs;

  switch (leaseType) {
    case LeaseType.Monthly:
      endDate = checkIn.add(1, 'month');
      break;
    case LeaseType.HalfYear:
      endDate = checkIn.add(6, 'month');
      break;
    case LeaseType.Yearly:
      endDate = checkIn.add(1, 'year');
      break;
    default:
      endDate = checkIn.add(1, 'month');
  }

  // 减一天得到到期日（如 1月1日入住，月租，到期日为 1月31日）
  return endDate.subtract(1, 'day').format('YYYY-MM-DD');
}

/**
 * 获取本地日期字符串（避免时区问题）
 * @returns 本地日期字符串，如 "2024-03-25"
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化金额
 * @param amount 金额
 * @returns 格式化后的金额字符串，如 "1,234.56"
 */
export function formatMoney(amount?: number | null): string {
  if (amount === null || amount === undefined) return '0.00';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

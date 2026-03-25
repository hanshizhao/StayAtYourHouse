// 获取常用时间
import dayjs from 'dayjs';

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
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY/MM/DD');
}

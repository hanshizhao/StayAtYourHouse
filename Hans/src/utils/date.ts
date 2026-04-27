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
 * @returns 格式化后的日期时间字符串，如 "2024-03-25 14:30"
 */
export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm');
}

/**
 * 格式化日期为本地格式
 * @param dateStr 日期字符串
 * @returns 格式化后的日期字符串，如 "2024-03-25"
 */
export function formatDate(dateStr?: string | Date | null): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? dayjs(dateStr) : dayjs(dateStr);
    return date.format('YYYY-MM-DD');
  } catch {
    return '-';
  }
}

/**
 * 计算合同到期日期
 * @param checkInDate 入住日期（YYYY-MM-DD 格式）
 * @param leaseMonths 租期月数
 * @returns 合同到期日期（YYYY-MM-DD 格式）或 null
 */
export function calculateContractEndDate(
  checkInDate: string | null | undefined,
  leaseMonths: number | null | undefined,
): string | null {
  if (!checkInDate || !leaseMonths) {
    return null;
  }

  return dayjs(checkInDate).add(leaseMonths, 'month').subtract(1, 'day').format('YYYY-MM-DD');
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

// 注意：formatMoney 函数已移至 @/utils/format.ts

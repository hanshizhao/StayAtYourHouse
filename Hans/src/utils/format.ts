/**
 * 格式化工具函数
 * 包含金额、数字等格式化相关函数
 */

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

/**
 * 格式化百分比
 * @param value 数值（0-1 之间的小数）
 * @param decimals 小数位数，默认 1
 * @returns 格式化后的百分比字符串，如 "85.5%"
 */
export function formatPercent(value?: number | null, decimals = 1): string {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

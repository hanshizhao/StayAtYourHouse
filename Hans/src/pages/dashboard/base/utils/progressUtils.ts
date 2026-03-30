/**
 * 出租率进度条工具函数
 * 用于 Dashboard 子组件中的出租率状态判断
 */

export const PROGRESS_THRESHOLD = { SUCCESS: 80, WARNING: 50 } as const;

export function getProgressStatus(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= PROGRESS_THRESHOLD.SUCCESS) return 'success';
  if (rate >= PROGRESS_THRESHOLD.WARNING) return 'warning';
  return 'error';
}

/**
 * FEAT-095: Dashboard 页面重构 E2E 测试
 * ✅ 适用于：跨模块流程验证
 * ⚠️ 完整验证 Dashboard 重构后的所有功能
 */
import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('Dashboard 页面重构', () => {
  async function loginAndNavigate(page: any) {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/dashboard/base`);
    await page.waitForLoadState('networkidle');
  }

  test('应显示统计卡片', async ({ page }) => {
    await loginAndNavigate(page);
    const statsCards = page.getByTestId('housing-stats-cards');
    await expect(statsCards).toBeVisible({ timeout: 10000 });

    await expect(page.getByTestId('total-rooms')).toBeVisible();
    await expect(page.getByTestId('rented-rooms')).toBeVisible();
    await expect(page.getByTestId('vacant-rooms')).toBeVisible();
    await expect(page.getByTestId('renovating-rooms')).toBeVisible();
  });

  test('应显示收支摘要和出租率', async ({ page }) => {
    await loginAndNavigate(page);
    const financeSection = page.getByTestId('finance-section');
    await expect(financeSection).toBeVisible({ timeout: 10000 });

    const occupancyProgress = page.getByTestId('occupancy-progress');
    await expect(occupancyProgress).toBeVisible();
  });

  test('应显示待办事项面板', async ({ page }) => {
    await loginAndNavigate(page);
    const todoSection = page.getByTestId('todo-section');
    await expect(todoSection).toBeVisible({ timeout: 10000 });
  });

  test('应显示小区统计表格', async ({ page }) => {
    await loginAndNavigate(page);
    const communityStats = page.getByTestId('community-stats');
    await expect(communityStats).toBeVisible({ timeout: 10000 });
  });

  test('应显示空置房源列表', async ({ page }) => {
    await loginAndNavigate(page);
    const vacantRooms = page.getByTestId('vacant-rooms');
    await expect(vacantRooms).toBeVisible({ timeout: 10000 });
  });

  test('不应显示旧的 TDesign 示例内容', async ({ page }) => {
    await loginAndNavigate(page);
    await expect(page.getByText('总收入')).not.toBeVisible();
    await expect(page.getByText('总退款')).not.toBeVisible();
    await expect(page.getByText('出入库概览')).not.toBeVisible();
  });
});

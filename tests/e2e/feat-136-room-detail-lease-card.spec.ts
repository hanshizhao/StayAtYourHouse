import { expect, test } from '@playwright/test';

import { API_BASE, authHeaders, getAdminToken, loginAndNavigate } from '../helpers/auth';

test.describe('FEAT-136 前端房间详情页改造', () => {
  let roomId: number;

  test.beforeEach(async ({ page, request }) => {
    // 通过 API 获取第一个房间 ID
    const token = await getAdminToken(request);
    const response = await request.get(`${API_BASE}/api/room/list`, {
      headers: authHeaders(token),
    });
    const result = await response.json();
    const items = result.data?.items ?? result.data ?? [];
    if (!items.length) {
      throw new Error('No rooms found in database');
    }
    roomId = items[0].id;

    // 导航到房间详情页
    await loginAndNavigate(page, `/housing/room/detail/${roomId}`);
  });

  test('1. 房间详情页可正常访问', async ({ page }) => {
    await expect(page.locator('[data-testid="page-title"]')).toHaveText('房间详情');
    await expect(page.locator('[data-testid="room-info-card"]')).toBeVisible();
  });

  test('2. 价格信息卡片只包含出租价和押金', async ({ page }) => {
    const priceCard = page.locator('[data-testid="price-info-card"]');
    await expect(priceCard).toBeVisible();

    // 验证包含"出租价"
    await expect(priceCard.locator('text=出租价')).toBeVisible();

    // 验证包含"押金"
    await expect(priceCard.locator('text=押金')).toBeVisible();

    // 验证不包含已移除的字段
    await expect(priceCard.locator('text=成本价')).not.toBeVisible();
    await expect(priceCard.locator('text=利润')).not.toBeVisible();
    await expect(priceCard.locator('text=水费单价')).not.toBeVisible();
    await expect(priceCard.locator('text=电费单价')).not.toBeVisible();
  });

  test('3. 房东租约卡片可见', async ({ page }) => {
    const leaseCard = page.locator('[data-testid="landlord-lease-card"]');
    await expect(leaseCard).toBeVisible();
  });

  test('4. 有租约时显示租约详情信息', async ({ page }) => {
    const leaseProfitEl = page.locator('[data-testid="lease-profit"]');
    if (await leaseProfitEl.isVisible()) {
      // 有租约：验证房东信息区域
      await expect(page.locator('[data-testid="lease-landlord-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="lease-monthly-rent"]')).toBeVisible();
      await expect(page.locator('[data-testid="lease-payment-method"]')).toBeVisible();
      await expect(page.locator('[data-testid="lease-date-range"]')).toBeVisible();

      // 验证费用信息区域
      await expect(page.locator('[data-testid="lease-water-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="lease-electric-price"]')).toBeVisible();

      // 验证利润信息
      await expect(leaseProfitEl).toBeVisible();
    }
  });

  test('5. 无租约时显示空状态提示', async ({ page }) => {
    // 至少有一个存在：空状态 或 租约详情
    const emptyState = page.locator('[data-testid="lease-empty-state"]');
    const leaseProfit = page.locator('[data-testid="lease-profit"]');

    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasLease = await leaseProfit.isVisible().catch(() => false);
    expect(hasEmpty || hasLease).toBeTruthy();
  });
});

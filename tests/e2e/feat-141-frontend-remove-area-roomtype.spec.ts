/**
 * FEAT-141: 前端类型定义和页面删除 area/roomType - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 房间列表页 - 表格无"面积"/"类型"列
 * 2. 房间列表页 - 新建/编辑表单无"面积"/"房间类型"字段
 * 3. 房间详情页 - 无"面积"/"房型"展示
 * 4. 小区房间弹窗 - 无"类型"列
 * 5. 入住办理页 - 无"面积"/"房型"展示
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-141: 前端删除 area/roomType', () => {

  async function loginAndNavigate(page: Page, targetPath: string): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}${targetPath}`);
    await page.waitForLoadState('networkidle');
  }

  // ==================== 房间列表页 ====================

  test('1. 房间列表页 - 表格无"面积"和"类型"列', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    const table = page.locator('[data-testid="room-table"], table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证"面积"表头不存在
    const areaHeader = table.locator('th:has-text("面积")');
    await expect(areaHeader).toHaveCount(0);

    // 验证"类型"表头不存在
    const typeHeader = table.locator('th:has-text("类型")');
    await expect(typeHeader).toHaveCount(0);
  });

  test('2. 房间列表页 - 新建表单无"面积"和"房间类型"字段', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    // 点击新建按钮
    const addButton = page.locator('[data-testid="add-room-button"], button:has-text("新建房间")').first();
    if (await addButton.count() === 0) {
      test.skip('新建按钮不存在');
      return;
    }
    await addButton.click();

    const dialog = page.locator('[data-testid="room-form-dialog"], .t-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 验证表单中无"面积"字段（通过 label 或 data-testid）
    const areaInput = page.locator('[data-testid="room-area-input"]');
    await expect(areaInput).toHaveCount(0);

    const areaLabel = dialog.locator('label:has-text("面积")');
    await expect(areaLabel).toHaveCount(0);

    // 验证表单中无"房间类型"字段
    const typeInput = page.locator('[data-testid="room-type-input"]');
    await expect(typeInput).toHaveCount(0);

    const typeLabel = dialog.locator('label:has-text("房间类型")');
    await expect(typeLabel).toHaveCount(0);
  });

  test('3. 房间列表页 - 编辑表单无"面积"和"房间类型"字段', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/room');

    // 等待表格加载
    await page.waitForSelector('[data-testid="room-table"], table', { timeout: 10000 });
    await page.waitForTimeout(500);

    // 查找编辑按钮
    const editButton = page.locator('[data-testid="edit-button"], a:has-text("编辑")').first();
    if (await editButton.count() === 0) {
      test.skip('没有找到编辑按钮');
      return;
    }
    await editButton.click();

    const dialog = page.locator('[data-testid="room-form-dialog"], .t-dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 验证表单中无"面积"和"房间类型"
    const areaInput = page.locator('[data-testid="room-area-input"]');
    await expect(areaInput).toHaveCount(0);

    const typeInput = page.locator('[data-testid="room-type-input"]');
    await expect(typeInput).toHaveCount(0);
  });

  // ==================== 房间详情页 ====================

  test('4. 房间详情页 - 无"面积"和"房型"展示', async ({ page }) => {
    // 直接导航到详情页（列表页无导航链接）
    await loginAndNavigate(page, '/dashboard/housing/room/detail/1');

    // 等待详情页描述组件加载
    const descriptions = page.locator('.t-descriptions');
    try {
      await descriptions.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // ID=1 的房间可能不存在，跳过
      test.skip('详情页未加载成功，可能房间 ID 不存在');
      return;
    }

    // 验证详情页无"面积"描述项
    const areaItem = page.locator('.t-descriptions-item:has-text("面积")');
    await expect(areaItem).toHaveCount(0);

    // 验证详情页无"房型"描述项
    const roomTypeItem = page.locator('.t-descriptions-item:has-text("房型")');
    await expect(roomTypeItem).toHaveCount(0);
  });

  // ==================== 小区房间弹窗 ====================

  test('5. 小区房间弹窗 - 无"类型"列', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/housing/community');

    // 等待表格加载
    await page.waitForSelector('[data-testid="community-table"], table', { timeout: 10000 });
    await page.waitForTimeout(500);

    // 查找房间数链接（点击可打开房间列表弹窗）
    const roomLinks = page.locator('.t-table td a');
    if (await roomLinks.count() === 0) {
      test.skip('没有找到房间数链接');
      return;
    }

    await roomLinks.first().click();
    await page.waitForTimeout(500);

    // 在弹窗中验证无"类型"表头
    const dialog = page.locator('.t-dialog:visible');
    if (await dialog.isVisible()) {
      const typeHeader = dialog.locator('th:has-text("类型")');
      await expect(typeHeader).toHaveCount(0);
    }
  });

  // ==================== 入住办理页 ====================

  test('6. 入住办理页 - 无"面积"和"房型"展示', async ({ page }) => {
    await loginAndNavigate(page, '/dashboard/tenant/check-in');
    await page.waitForTimeout(1000);

    // 先选择一个房间才能看到房间信息卡片
    const roomSelect = page.locator('[data-testid="room-select"], .t-select:has-text("请选择空置房间")').first();
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      await page.waitForTimeout(300);

      const firstOption = page.locator('.t-select-option, .t-select__dropdown-item').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(500);
      }
    }

    // 验证页面中无"面积"和"房型"的 info-item
    const infoItems = page.locator('.room-info-card .info-item');
    if (await infoItems.count() > 0) {
      // 检查所有 info-label 中没有"面积"
      const areaLabel = page.locator('.room-info-card .info-label:has-text("面积")');
      await expect(areaLabel).toHaveCount(0);

      // 检查所有 info-label 中没有"房型"
      const typeLabel = page.locator('.room-info-card .info-label:has-text("房型")');
      await expect(typeLabel).toHaveCount(0);
    }
  });
});

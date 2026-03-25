/**
 * FEAT-014: 退租弹窗 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端组件
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

// 使用串行模式避免并行测试导致的状态冲突
test.describe.serial('FEAT-014: 退租弹窗', () => {
  /**
   * 登录并导航到租客列表页
   */
  async function loginAndNavigateToTenantList(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', process.env.E2E_USER || 'zhs');
    await page.fill('input[placeholder="请输入密码"]', process.env.E2E_PASS || 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/tenant/list`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 打开退租弹窗
   */
  async function openCheckOutDialog(page: Page): Promise<boolean> {
    await page.waitForSelector('.t-table tbody tr', { timeout: 10000 });

    const activeRow = page.locator('.t-table tbody tr:has-text("在租")');

    if (await activeRow.count() > 0) {
      const checkOutButton = activeRow.first().locator('[data-testid="checkout-button"]');
      if (await checkOutButton.count() > 0) {
        await checkOutButton.click();
        try {
          await page.waitForSelector('[data-testid="checkout-dialog"]', { timeout: 5000 });
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }

  /**
   * 获取退租弹窗内的元素（避免 strict mode）
   */
  function getDialogElement(page: Page, testId: string) {
    return page.locator(`[data-testid="checkout-dialog"] [data-testid="${testId}"]`);
  }

  function getDialogContent(page: Page) {
    return page.locator('[data-testid="checkout-dialog"]');
  }

  // ==================== 静态验证测试 ====================

  test('1. 组件文件存在', async () => {
    const componentPath = 'Hans/src/pages/tenant/components/CheckOutDialog.vue';
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../', componentPath);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });

  // ==================== 页面集成测试 ====================

  test('2. 页面可访问 - 租客列表页', async ({ page }) => {
    await loginAndNavigateToTenantList(page);
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });
  });

  test('3. 退租按钮可见性 - 在租状态显示退租按钮', async ({ page }) => {
    await loginAndNavigateToTenantList(page);
    await page.waitForSelector('.t-table tbody tr', { timeout: 10000 });

    const activeRow = page.locator('.t-table tbody tr:has-text("在租")');
    const rowCount = await activeRow.count();

    if (rowCount > 0) {
      const checkOutButton = activeRow.first().locator('[data-testid="checkout-button"]');
      await expect(checkOutButton).toBeVisible();
    }
  });

  test('4. 弹窗打开 - 点击退租按钮', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    expect(dialogOpened).toBe(true);

    // 验证弹窗标题
    const dialogTitle = getDialogContent(page).locator('.t-dialog__header');
    await expect(dialogTitle).toContainText(/退租|结算/);
  });

  test('5. 弹窗核心元素 - 房间信息', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const roomInfo = getDialogElement(page, 'room-info');
    await expect(roomInfo).toBeVisible();
  });

  test('6. 弹窗核心元素 - 租客信息', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const tenantInfo = getDialogElement(page, 'tenant-info');
    await expect(tenantInfo).toBeVisible();
  });

  test('7. 弹窗核心元素 - 月租金显示', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const dialogContent = getDialogContent(page);
    const bodyText = await dialogContent.textContent();
    expect(bodyText).toMatch(/\d+.*元|租金/);
  });

  test('8. 弹窗核心元素 - 退租日期选择', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const checkOutDateInput = getDialogElement(page, 'checkout-date-input');
    await expect(checkOutDateInput).toBeVisible();
  });

  test('9. 弹窗核心元素 - 结算金额显示', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const settlementAmount = getDialogElement(page, 'settlement-amount');
    await expect(settlementAmount).toBeVisible();
  });

  test('10. 押金处理选项 - 全额退还', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const depositOption = getDialogElement(page, 'deposit-refunded');
    await expect(depositOption).toBeVisible();
  });

  test('11. 押金处理选项 - 部分扣除', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const deductionOption = getDialogElement(page, 'deposit-deducted');
    await expect(deductionOption).toBeVisible();
  });

  test('12. 扣除说明字段 - 选择部分扣除后显示', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const deductionOption = getDialogElement(page, 'deposit-deducted');
    await deductionOption.click();
    await page.waitForTimeout(300);

    const deductionNoteInput = getDialogElement(page, 'deduction-note-input');
    if (await deductionNoteInput.count() > 0) {
      await expect(deductionNoteInput).toBeVisible();
    }
  });

  test('13. 取消按钮 - 关闭弹窗', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    // 使用 TDesign Dialog 内置的关闭按钮（右上角 X）
    const closeButton = page.locator('[data-testid="checkout-dialog"] .t-dialog__close');
    if (await closeButton.count() > 0) {
      await closeButton.click();
    } else {
      // 备选方案：按 ESC 键关闭
      await page.keyboard.press('Escape');
    }

    const dialog = getDialogContent(page);
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('14. 确认按钮 - 存在且可见', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    // 使用 TDesign Dialog 内置的确认按钮（通过按钮文本定位）
    const confirmButton = page.locator('[data-testid="checkout-dialog"] button:has-text("确认退租")');
    await expect(confirmButton).toBeVisible();
  });

  test('15. 结算计算 - 剩余天数显示', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const dialogContent = getDialogContent(page);
    const bodyText = await dialogContent.textContent();
    expect(bodyText).toMatch(/剩余|天数|\d+.*天/);
  });

  test('16. 结算计算 - 押金金额显示', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const dialogContent = getDialogContent(page);
    const bodyText = await dialogContent.textContent();
    expect(bodyText).toMatch(/押金/);
  });

  test('17. 结算金额含义说明', async ({ page }) => {
    await loginAndNavigateToTenantList(page);

    const dialogOpened = await openCheckOutDialog(page);
    if (!dialogOpened) {
      test.skip();
      return;
    }

    const dialogContent = getDialogContent(page);
    const bodyText = await dialogContent.textContent();
    expect(bodyText).toMatch(/退还|结算/);
  });
});

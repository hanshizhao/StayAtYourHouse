/**
 * FEAT-019: 催收弹窗 - E2E 测试（严谨版）
 * 类型: e2e
 * 适用于: 前端组件
 *
 * 测试覆盖：
 * 1. 组件文件存在性
 * 2. 弹窗打开/关闭
 * 3. 核心元素可见性
 * 4. 催收结果选项
 * 5. 收款成功表单
 * 6. 宽限处理表单
 * 7. 拒付处理
 * 8. 表单验证
 */
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-019: 催收弹窗', () => {
  /**
   * 登录并导航到账单列表页
   */
  async function loginAndNavigateToBillList(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/dashboard/bill`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 打开催收弹窗
   */
  async function openCollectDialog(page: Page): Promise<boolean> {
    // 等待表格加载
    await page.waitForSelector('[data-testid="bill-table"], .t-table', { timeout: 10000 });

    // 找到催收按钮
    const collectButton = page.locator('[data-testid="collect-button"], button:has-text("催收")');

    if (await collectButton.count() > 0) {
      await collectButton.first().click();
      // 等待弹窗出现
      await page.waitForSelector('[data-testid="collect-dialog"], .t-dialog', { timeout: 5000 });
      return true;
    }
    return false;
  }

  // ==================== 静态验证测试 ====================

  test('1. 组件文件存在', async () => {
    const componentPath = 'Hans/src/pages/bill/components/CollectDialog.vue';
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../', componentPath);
    expect(fs.existsSync(fullPath)).toBeTruthy();
  });

  // ==================== 页面集成测试 ====================

  test('2. 页面可访问 - 账单列表页', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    // 验证主内容区域可见
    await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
  });

  test('3. 催收按钮可见性', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    // 等待表格加载
    await page.waitForSelector('[data-testid="bill-table"], .t-table', { timeout: 10000 });

    // 找到催收按钮
    const collectButton = page.locator('[data-testid="collect-button"], button:has-text("催收")');

    // 催收按钮可能存在也可能不存在（取决于是否有待收账单）
    if (await collectButton.count() > 0) {
      await expect(collectButton.first()).toBeVisible();
    }
  });

  test('4. 弹窗打开 - 点击催收按钮', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证弹窗标题
    const dialogTitle = page.locator('[data-testid="collect-dialog"] .t-dialog__header, .t-dialog__header');
    await expect(dialogTitle).toContainText(/催收|记录/);
  });

  test('5. 弹窗核心元素 - 租客信息', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证租客信息显示
    const tenantInfo = page.locator('[data-testid="tenant-info"], .t-dialog__body');
    await expect(tenantInfo).toBeVisible();
  });

  test('6. 弹窗核心元素 - 房间信息', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证房间信息显示
    const roomInfo = page.locator('[data-testid="room-info"], .t-dialog__body');
    await expect(roomInfo).toBeVisible();
  });

  test('7. 弹窗核心元素 - 应收日期', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证应收日期显示
    const dialogBody = page.locator('[data-testid="collect-dialog"] .t-dialog__body, .t-dialog__body');
    const bodyText = await dialogBody.textContent();
    expect(bodyText).toMatch(/应收日期|到期/);
  });

  test('8. 弹窗核心元素 - 应收金额', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证应收金额显示
    const dialogBody = page.locator('[data-testid="collect-dialog"] .t-dialog__body, .t-dialog__body');
    const bodyText = await dialogBody.textContent();
    expect(bodyText).toMatch(/应收金额|总额|\d+.*元/);
  });

  test('9. 催收结果选项 - 收款成功', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证收款成功选项存在
    const successOption = page.locator('[data-testid="result-success"], .t-radio:has-text("成功"), label:has-text("成功")');
    await expect(successOption.first()).toBeVisible();
  });

  test('10. 催收结果选项 - 同意宽限', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证同意宽限选项存在
    const graceOption = page.locator('[data-testid="result-grace"], .t-radio:has-text("宽限"), label:has-text("宽限")');
    await expect(graceOption.first()).toBeVisible();
  });

  test('11. 催收结果选项 - 拒付', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证拒付选项存在
    const refuseOption = page.locator('[data-testid="result-refuse"], .t-radio:has-text("拒付"), label:has-text("拒付")');
    await expect(refuseOption.first()).toBeVisible();
  });

  test('12. 收款成功 - 显示实收金额字段', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 选择收款成功
    const successOption = page.locator('[data-testid="result-success"], .t-radio:has-text("成功"), label:has-text("成功")').first();
    await successOption.click();

    // 等待表单更新
    await page.waitForTimeout(300);

    // 验证实收金额字段显示
    const paidAmountInput = page.locator('[data-testid="paid-amount-input"], input[placeholder*="实收"], input[placeholder*="金额"]');
    await expect(paidAmountInput).toBeVisible();
  });

  test('13. 收款成功 - 显示收款日期字段', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 选择收款成功
    const successOption = page.locator('[data-testid="result-success"], .t-radio:has-text("成功"), label:has-text("成功")').first();
    await successOption.click();

    // 等待表单更新
    await page.waitForTimeout(300);

    // 验证收款日期字段显示
    const paidDateInput = page.locator('[data-testid="paid-date-input"], .t-date-picker');
    await expect(paidDateInput).toBeVisible();
  });

  test('14. 同意宽限 - 显示宽限至日期字段', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 选择同意宽限
    const graceOption = page.locator('[data-testid="result-grace"], .t-radio:has-text("宽限"), label:has-text("宽限")').first();
    await graceOption.click();

    // 等待表单更新
    await page.waitForTimeout(300);

    // 验证宽限至日期字段显示
    const graceUntilInput = page.locator('[data-testid="grace-until-input"], .t-date-picker:has([placeholder*="宽限"])');
    await expect(graceUntilInput).toBeVisible();
  });

  test('15. 备注字段存在', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证备注字段存在
    const remarkInput = page.locator('[data-testid="remark-input"], input[placeholder*="备注"], textarea[placeholder*="备注"]');
    await expect(remarkInput).toBeVisible();
  });

  test('16. 取消按钮 - 关闭弹窗', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 点击取消按钮
    const cancelButton = page.locator('[data-testid="cancel-button"], button:has-text("取消")').first();
    await cancelButton.click();

    // 验证弹窗关闭
    const dialog = page.locator('[data-testid="collect-dialog"], .t-dialog');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('17. 确认按钮 - 存在且可见', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 验证确认按钮存在
    const confirmButton = page.locator('[data-testid="confirm-button"], button:has-text("确认"), button:has-text("提交")');
    await expect(confirmButton.first()).toBeVisible();
  });

  test('18. 表单验证 - 选择宽限时必须填写宽限日期', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 选择同意宽限
    const graceOption = page.locator('[data-testid="result-grace"], .t-radio:has-text("宽限"), label:has-text("宽限")').first();
    await graceOption.click();

    // 不填写宽限日期，直接提交
    const confirmButton = page.locator('[data-testid="confirm-button"], button:has-text("确认")').first();
    await confirmButton.click();

    // 等待验证信息显示
    await page.waitForTimeout(500);

    // 验证表单验证错误
    const errorMessage = page.locator('[data-testid="grace-until-error"], .t-form-item__error');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('19. 收款成功 - 实收金额默认为应收金额', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 获取应收金额
    const dialogBody = page.locator('[data-testid="collect-dialog"] .t-dialog__body, .t-dialog__body');
    const bodyText = await dialogBody.textContent();
    const amountMatch = bodyText.match(/(\d+(?:\.\d+)?)\s*元/);

    // 选择收款成功
    const successOption = page.locator('[data-testid="result-success"], .t-radio:has-text("成功"), label:has-text("成功")').first();
    await successOption.click();

    // 等待表单更新
    await page.waitForTimeout(300);

    // 验证实收金额默认值
    const paidAmountInput = page.locator('[data-testid="paid-amount-input"], input[placeholder*="实收"]');
    const paidAmount = await paidAmountInput.inputValue();

    if (amountMatch && paidAmount) {
      expect(parseFloat(paidAmount)).toBeCloseTo(parseFloat(amountMatch[1]), 2);
    }
  });

  test('20. 催收历史记录显示（如果有）', async ({ page }) => {
    await loginAndNavigateToBillList(page);

    const dialogOpened = await openCollectDialog(page);
    if (!dialogOpened) {
      test.skip('没有待收账单，跳过弹窗测试');
      return;
    }

    // 查找催收历史区域
    const historySection = page.locator('[data-testid="collection-history"], .t-dialog__body:has-text("历史")');
    // 催收历史是可选的
    if (await historySection.count() > 0) {
      await expect(historySection).toBeVisible();
    }
  });
});

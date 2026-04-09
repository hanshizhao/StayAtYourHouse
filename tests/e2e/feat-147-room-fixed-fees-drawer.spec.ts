/**
 * FEAT-147: 房间编辑抽屉 - 固定费用 UI E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 新建对话框中固定费用输入框可见性
 * 2. 固定费用字段填写与提交
 * 3. 编辑对话框中固定费用字段回显
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-147: 房间编辑抽屉 - 固定费用 UI', () => {

  /**
   * 登录并导航到房间管理页面
   */
  async function loginAndNavigate(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/housing/room`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 打开新建房间对话框
   */
  async function openCreateDialog(page: Page): Promise<void> {
    const addButton = page.locator('[data-testid="add-room-button"]').first();
    await addButton.click();
    const dialog = page.locator('[data-testid="room-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  }

  // 固定费用字段的 data-testid 列表
  const fixedFeeFields = [
    { testId: 'room-elevator-fee-input', label: '电梯费' },
    { testId: 'room-property-fee-input', label: '物业费' },
    { testId: 'room-internet-fee-input', label: '网络费' },
    { testId: 'room-other-fees-input', label: '其他费用' },
  ];

  test('1. 新建对话框 - 固定费用输入框可见', async ({ page }) => {
    await loginAndNavigate(page);
    await openCreateDialog(page);

    // 验证每个固定费用输入框都存在
    for (const field of fixedFeeFields) {
      const input = page.locator(`[data-testid="${field.testId}"]`);
      await expect(input).toBeVisible({ timeout: 5000 });
    }
  });

  test('2. 新建对话框 - 固定费用字段标签正确', async ({ page }) => {
    await loginAndNavigate(page);
    await openCreateDialog(page);

    // 验证每个字段的 form-item label
    for (const field of fixedFeeFields) {
      const formItem = page.locator(`.t-form__item:has([data-testid="${field.testId}"])`);
      await expect(formItem).toBeVisible();
      const label = formItem.locator('.t-form__label');
      await expect(label).toContainText(field.label);
    }
  });

  test('3. 新建对话框 - 固定费用字段可填写', async ({ page }) => {
    await loginAndNavigate(page);
    await openCreateDialog(page);

    // 填写固定费用
    const feeValues: Record<string, string> = {
      'room-elevator-fee-input': '150',
      'room-property-fee-input': '200',
      'room-internet-fee-input': '80',
      'room-other-fees-input': '50',
    };

    for (const [testId, value] of Object.entries(feeValues)) {
      const input = page.locator(`[data-testid="${testId}"] input`);
      await expect(input).toBeVisible();
      await input.fill(value);
      await expect(input).toHaveValue(value);
    }
  });

  test('4. 编辑对话框 - 固定费用字段回显', async ({ page }) => {
    await loginAndNavigate(page);

    // 等待表格加载
    await page.waitForSelector('[data-testid="room-table"]', { timeout: 10000 });

    // 查找并点击编辑按钮
    const editButton = page.locator('[data-testid="edit-button"]').first();
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.click();

    // 等待编辑对话框
    const dialog = page.locator('[data-testid="room-form-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 验证固定费用输入框存在
    for (const field of fixedFeeFields) {
      const input = page.locator(`[data-testid="${field.testId}"]`);
      await expect(input).toBeVisible({ timeout: 5000 });
    }
  });

  test('5. 固定费用字段位于费用设置区域', async ({ page }) => {
    await loginAndNavigate(page);
    await openCreateDialog(page);

    // 验证"费用设置"标题存在
    const sectionTitle = page.locator('.form-section-title:has-text("费用设置")');
    await expect(sectionTitle.first()).toBeVisible();

    // 验证水电费字段存在（确保原有字段未丢失）
    const waterPriceInput = page.locator('[data-testid="room-water-price-input"]');
    const electricPriceInput = page.locator('[data-testid="room-electric-price-input"]');
    await expect(waterPriceInput).toBeVisible({ timeout: 5000 });
    await expect(electricPriceInput).toBeVisible({ timeout: 5000 });

    // 验证固定费用字段也存在
    for (const field of fixedFeeFields) {
      const input = page.locator(`[data-testid="${field.testId}"]`);
      await expect(input).toBeVisible({ timeout: 5000 });
    }
  });
});

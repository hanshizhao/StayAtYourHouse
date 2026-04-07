/**
 * FEAT-123: 前端报修表单页（新增/编辑复用） - E2E 测试
 * 类型: e2e
 * 适用于: 前端页面
 *
 * 测试覆盖：
 * 1. 新增模式页面可访问性
 * 2. 新增模式核心表单元素可见性
 * 3. 房间选择器
 * 4. 优先级选择器
 * 5. 报修日期选择器
 * 6. 维修描述输入
 * 7. 费用输入
 * 8. 维修人员输入
 * 9. 联系电话输入
 * 10. 备注输入
 * 11. 编辑模式页面（状态选择器）
 * 12. 返回按钮
 * 13. 提交按钮可见性
 */
import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe('FEAT-123: 前端报修表单页', () => {
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

  function setupConsoleErrorTracker(page: Page): string[] {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    return consoleErrors;
  }

  function getCriticalErrors(errors: string[]): string[] {
    return errors.filter(
      (e) => !e.includes('favicon') && !e.includes('Warning:') && !e.includes('[HMR]') && !e.includes('DevTools'),
    );
  }

  // ==================== 新增模式测试 ====================

  test('1. 新增模式 - 页面可访问无关键报错', async ({ page }) => {
    const consoleErrors = setupConsoleErrorTracker(page);

    await loginAndNavigate(page, '/maintenance/add');

    await expect(page.locator('main').first()).toBeVisible({ timeout: 5000 });

    const criticalErrors = getCriticalErrors(consoleErrors);
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 新增模式 - 页面标题和副标题', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const heading = page.locator('h2');
    await expect(heading).toContainText('新增报修');

    const subtitle = page.locator('.header-subtitle');
    await expect(subtitle).toContainText('填写维修记录信息');
  });

  test('3. 新增模式 - 房间选择器可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const roomSelect = page.locator('[data-testid="room-select"]');
    await expect(roomSelect).toBeVisible({ timeout: 5000 });
  });

  test('4. 新增模式 - 维修描述输入可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const descriptionInput = page.locator('[data-testid="description-input"]');
    await expect(descriptionInput).toBeVisible();
  });

  test('5. 新增模式 - 优先级选择器可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const prioritySelect = page.locator('[data-testid="priority-select"]');
    await expect(prioritySelect).toBeVisible();
  });

  test('6. 新增模式 - 报修日期选择器可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const datePicker = page.locator('[data-testid="report-date-picker"]');
    await expect(datePicker).toBeVisible();
  });

  test('7. 新增模式 - 预算费用输入可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const costInput = page.locator('[data-testid="cost-input"]');
    await expect(costInput).toBeVisible();
  });

  test('8. 新增模式 - 维修人员输入可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const repairPersonInput = page.locator('[data-testid="repair-person-input"]');
    await expect(repairPersonInput).toBeVisible();
  });

  test('9. 新增模式 - 联系电话输入可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const repairPhoneInput = page.locator('[data-testid="repair-phone-input"]');
    await expect(repairPhoneInput).toBeVisible();
  });

  test('10. 新增模式 - 备注输入可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const remarkInput = page.locator('[data-testid="remark-input"]');
    await expect(remarkInput).toBeVisible();
  });

  test('11. 新增模式 - 提交按钮可见且文本正确', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const submitButton = page.locator('[data-testid="submit-button"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toContainText('提交报修');
  });

  test('12. 新增模式 - 新增模式下不显示状态选择器', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const statusSelect = page.locator('[data-testid="status-select"]');
    await expect(statusSelect).not.toBeVisible();
  });

  test('13. 新增模式 - 返回按钮功能', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const backButton = page.locator('button:has-text("返回")').first();
    await expect(backButton).toBeVisible();
    await backButton.click();
    await page.waitForURL(/\/maintenance\/list/, { timeout: 5000 });

    expect(page.url()).toContain('/maintenance/list');
  });

  test('14. 新增模式 - 房间选择器可交互', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const roomSelect = page.locator('[data-testid="room-select"]');
    await roomSelect.click();

    // 验证下拉框已打开（出现选项面板或loading状态）
    const dropdownPanel = page.locator('.t-select__list, .t-select-option, .t-select__empty').first();
    await expect(dropdownPanel).toBeVisible({ timeout: 3000 });
  });

  test('15. 新增模式 - 优先级选择器选项正确', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const prioritySelect = page.locator('[data-testid="priority-select"]');
    await prioritySelect.click();

    // 等待选项面板出现
    await page.waitForSelector('.t-select-option, .t-select__dropdown-item', { timeout: 3000 });

    // 验证三个优先级选项
    const options = page.locator('.t-select-option, .t-select__dropdown-item');
    const optionTexts = await options.allTextContents();
    const hasAllPriorities = ['紧急', '普通', '低优先级'].every((text) =>
      optionTexts.some((opt) => opt.includes(text)),
    );
    expect(hasAllPriorities).toBeTruthy();
  });

  // ==================== 编辑模式测试 ====================

  test('16. 编辑模式 - 页面标题显示编辑', async ({ page }) => {
    // 先访问列表页获取一条记录
    await loginAndNavigate(page, '/maintenance/list');
    await page.waitForSelector('[data-testid="maintenance-table"], .t-table', { timeout: 5000 });

    const editButton = page.locator('[data-testid="edit-maintenance-button"]').first();
    if ((await editButton.count()) === 0) {
      test.skip('没有找到编辑按钮（列表为空）');
      return;
    }

    await editButton.click();
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h2');
    await expect(heading).toContainText('编辑报修');
  });

  test('17. 编辑模式 - 显示状态选择器', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await page.waitForSelector('[data-testid="maintenance-table"], .t-table', { timeout: 5000 });

    const editButton = page.locator('[data-testid="edit-maintenance-button"]').first();
    if ((await editButton.count()) === 0) {
      test.skip('没有找到编辑按钮（列表为空）');
      return;
    }

    await editButton.click();
    await page.waitForLoadState('networkidle');

    const statusSelect = page.locator('[data-testid="status-select"]');
    await expect(statusSelect).toBeVisible({ timeout: 5000 });
  });

  test('18. 编辑模式 - 提交按钮显示保存修改', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await page.waitForSelector('[data-testid="maintenance-table"], .t-table', { timeout: 5000 });

    const editButton = page.locator('[data-testid="edit-maintenance-button"]').first();
    if ((await editButton.count()) === 0) {
      test.skip('没有找到编辑按钮（列表为空）');
      return;
    }

    await editButton.click();
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('[data-testid="submit-button"]');
    await expect(submitButton).toContainText('保存修改');
  });

  test('19. 编辑模式 - 房间选择器禁用', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/list');
    await page.waitForSelector('[data-testid="maintenance-table"], .t-table', { timeout: 5000 });

    const editButton = page.locator('[data-testid="edit-maintenance-button"]').first();
    if ((await editButton.count()) === 0) {
      test.skip('没有找到编辑按钮（列表为空）');
      return;
    }

    await editButton.click();
    await page.waitForLoadState('networkidle');

    const roomSelect = page.locator('[data-testid="room-select"]');
    await expect(roomSelect).toBeDisabled({ timeout: 5000 });
  });

  // ==================== 预选房间测试 ====================

  test('20. 预选房间 - query 参数 roomId 预选', async ({ page }) => {
    // 带 roomId 参数访问新增页面
    await loginAndNavigate(page, '/maintenance/add?roomId=1');

    const roomSelect = page.locator('[data-testid="room-select"]');
    await expect(roomSelect).toBeVisible({ timeout: 5000 });

    // 验证房间选择器有选中值（不是 placeholder 状态）
    const selectedValue = await roomSelect.innerText();
    expect(selectedValue.length).toBeGreaterThan(0);
  });

  // ==================== 表单分区标题测试 ====================

  test('21. 表单分区标题可见', async ({ page }) => {
    await loginAndNavigate(page, '/maintenance/add');

    const sectionTitles = ['房间信息', '维修信息', '维修人员与费用', '备注信息'];
    for (const title of sectionTitles) {
      const section = page.locator(`.section-title:has-text("${title}")`);
      await expect(section.first()).toBeVisible({ timeout: 3000 });
    }
  });
});

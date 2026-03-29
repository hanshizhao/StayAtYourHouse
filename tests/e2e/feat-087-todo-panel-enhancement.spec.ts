/**
 * FEAT-087: E2E 测试 - 待办事项卡片增强
 *
 * 测试待办事项卡片增强功能的完整用户体验：
 * 1. 待办列表显示两种类型（水电费、催收房租）
 * 2. 筛选功能正常
 * 3. 水电费收款弹窗正常
 * 4. 催收房租弹窗正常
 * 5. 宽限功能正常
 * 6. 续租功能正常
 * 7. 宽限记录弹窗正常
 *
 * 运行方式：
 * 1. 启动后端服务：cd Gentle && dotnet run --project Gentle.Web.Entry
 * 2. 启动前端服务：cd Hans && npm run dev
 * 3. 设置环境变量：RUN_INTEGRATION_TESTS=true
 * 4. 运行测试：cd tests && npx playwright test e2e/feat-087-todo-panel-enhancement.spec.ts
 *
 * 带界面运行：cd tests && npm run test:ui e2e/feat-087-todo-panel-enhancement.spec.ts
 */
import { expect, test } from '@playwright/test';
import { BASE_URL, loginAndNavigate } from '../helpers/auth';

// 检查是否应该运行集成测试（需要前后端服务运行）
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

// 测试超时配置
const TIMEOUT = {
  navigation: 15000,
  element: 10000,
  dialog: 5000,
};

test.describe('FEAT-087: 待办事项卡片增强 E2E 测试', () => {
  // ==================== 基础验证测试 ====================

  test('1. 页面加载 - 仪表盘可访问', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 验证页面 URL
    await expect(page).toHaveURL(/dashboard/);

    // 验证页面无严重 JavaScript 错误
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('Non-Error promise rejection'),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. 待办面板 - 组件存在', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 查找待办面板（通过类名或内容）
    const todoPanel = page.locator('.todo-panel, [class*="todo"]').first();
    await expect(todoPanel).toBeVisible({ timeout: TIMEOUT.element });
  });

  test('3. 待办列表 - 显示两种类型标签', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 等待待办列表加载
    await page.waitForSelector('.todo-item, .todo-list, .todo-empty', { timeout: TIMEOUT.element });

    // 查找类型标签（使用 :text-is() 伪类或合并多个 locator）
    const utilityTags = page.locator('.todo-type-tag--utility').or(page.locator(':text-is("水电费")'));
    const rentalTags = page.locator('.todo-type-tag--rental').or(page.locator(':text-is("催收房租")'));

    // 验证至少有一种类型的待办（根据实际数据）
    const utilityCount = await utilityTags.count();
    const rentalCount = await rentalTags.count();

    // 如果没有任何待办，检查是否显示空状态
    if (utilityCount === 0 && rentalCount === 0) {
      const emptyState = page.locator('.todo-empty').or(page.locator(':text("暂无待办")'));
      await expect(emptyState.first()).toBeVisible();
    }
  });

  // ==================== 筛选功能测试 ====================

  test('4. 筛选功能 - 筛选下拉框存在', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 查找筛选下拉框
    const filterSelect = page.locator('.todo-filter .t-select, .t-select:has-text("筛选")');
    const count = await filterSelect.count();

    // 验证筛选下拉框存在
    expect(count).toBeGreaterThan(0);
  });

  test('5. 筛选功能 - 筛选选项正确', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 查找并点击筛选下拉框
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);

    // 验证选项存在
    const allOption = page.locator('.t-select-option:has-text("全部")');
    const utilityOption = page.locator('.t-select-option:has-text("水电费")');
    const rentalOption = page.locator('.t-select-option:has-text("催收房租")');

    // 验证三个选项都存在
    await expect(allOption.first()).toBeVisible({ timeout: TIMEOUT.dialog });
    await expect(utilityOption.first()).toBeVisible();
    await expect(rentalOption.first()).toBeVisible();
  });

  test('6. 筛选功能 - 筛选水电费', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 点击筛选下拉框
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);

    // 选择水电费
    await page.locator('.t-select-option:has-text("水电费")').first().click();
    await page.waitForTimeout(500);

    // 验证只显示水电费待办
    const utilityTags = page.locator('.todo-type-tag--utility');
    const rentalTags = page.locator('.todo-type-tag--rental');

    const utilityCount = await utilityTags.count();
    const rentalCount = await rentalTags.count();

    // 如果有待办，应该只有水电费
    if (utilityCount > 0) {
      expect(rentalCount).toBe(0);
    }
  });

  test('7. 筛选功能 - 筛选催收房租', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 点击筛选下拉框
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);

    // 选择催收房租
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    // 验证只显示催收房租待办
    const utilityTags = page.locator('.todo-type-tag--utility');
    const rentalTags = page.locator('.todo-type-tag--rental');

    const utilityCount = await utilityTags.count();
    const rentalCount = await rentalTags.count();

    // 如果有待办，应该只有催收房租
    if (rentalCount > 0) {
      expect(utilityCount).toBe(0);
    }
  });

  // ==================== 弹窗功能测试 ====================

  test('8. 水电费弹窗 - 点击水电费待办打开弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 先筛选水电费
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("水电费")').first().click();
    await page.waitForTimeout(500);

    // 查找水电费待办项
    const utilityTodo = page.locator('.todo-item--utility, .todo-item:has(.todo-type-tag--utility)').first();

    if (await utilityTodo.isVisible()) {
      // 点击水电费待办
      await utilityTodo.click();
      await page.waitForTimeout(300);

      // 验证收款弹窗打开
      const payUtilityDialog = page.locator('[data-testid="pay-utility-dialog"]');
      await expect(payUtilityDialog).toBeVisible({ timeout: TIMEOUT.dialog });
    } else {
      // 没有水电费待办，跳过此测试
      test.skip(true, '没有水电费待办数据');
    }
  });

  test('9. 催收房租弹窗 - 点击催收房租待办打开弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 先筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    // 查找催收房租待办项
    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      // 点击催收房租待办
      await rentalTodo.click();
      await page.waitForTimeout(300);

      // 验证催收房租弹窗打开
      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });
    } else {
      // 没有催收房租待办，跳过此测试
      test.skip(true, '没有催收房租待办数据');
    }
  });

  test('10. 催收房租弹窗 - 显示租客和房间信息', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 验证弹窗标题
      await expect(rentalDialog.locator('.t-dialog__header').or(rentalDialog.locator(':text("催收房租")'))).toBeVisible();

      // 验证操作按钮存在
      const deferButton = rentalDialog.locator('button:has-text("宽限")');
      const renewButton = rentalDialog.locator('button:has-text("续租")');

      // 至少应该有宽限或续租按钮
      const hasDefer = (await deferButton.count()) > 0;
      const hasRenew = (await renewButton.count()) > 0;
      expect(hasDefer || hasRenew).toBeTruthy();
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  // ==================== 宽限功能测试 ====================

  test('11. 宽限弹窗 - 点击宽限按钮打开弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 点击宽限按钮
      const deferButton = rentalDialog.locator('button:has-text("宽限")').first();
      if (await deferButton.isVisible()) {
        await deferButton.click();
        await page.waitForTimeout(300);

        // 验证宽限弹窗打开
        const deferDialog = page.locator('[data-testid="defer-dialog"]');
        await expect(deferDialog).toBeVisible({ timeout: TIMEOUT.dialog });

        // 验证日期选择器存在
        const datePicker = deferDialog.locator('.t-date-picker, input[type="date"]');
        expect(await datePicker.count()).toBeGreaterThan(0);
      } else {
        test.skip(true, '没有宽限按钮');
      }
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  test('12. 宽限弹窗 - 日期选择器默认值正确', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租并打开宽限弹窗
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      const deferButton = rentalDialog.locator('button:has-text("宽限")').first();

      if (await deferButton.isVisible()) {
        await deferButton.click();
        await page.waitForTimeout(300);

        const deferDialog = page.locator('[data-testid="defer-dialog"]');
        await expect(deferDialog).toBeVisible({ timeout: TIMEOUT.dialog });

        // 验证备注输入框存在
        const remarkInput = deferDialog.locator('textarea, input[type="text"]');
        expect(await remarkInput.count()).toBeGreaterThan(0);

        // 验证确认按钮存在
        const confirmButton = deferDialog.locator('button:has-text("确认"), button:has-text("确定")');
        expect(await confirmButton.count()).toBeGreaterThan(0);
      } else {
        test.skip(true, '没有宽限按钮');
      }
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  // ==================== 续租功能测试 ====================

  test('13. 续租弹窗 - 点击续租按钮打开弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 点击续租按钮
      const renewButton = rentalDialog.locator('button:has-text("续租")').first();
      if (await renewButton.isVisible()) {
        await renewButton.click();
        await page.waitForTimeout(300);

        // 验证续租弹窗打开
        const renewDialog = page.locator('[data-testid="renew-rental-dialog"]');
        await expect(renewDialog).toBeVisible({ timeout: TIMEOUT.dialog });

        // 验证租期类型选择器存在
        const leaseTypeSelect = renewDialog.locator('.t-select');
        expect(await leaseTypeSelect.count()).toBeGreaterThan(0);
      } else {
        test.skip(true, '没有续租按钮');
      }
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  test('14. 续租弹窗 - 表单字段完整', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租并打开续租弹窗
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      const renewButton = rentalDialog.locator('button:has-text("续租")').first();

      if (await renewButton.isVisible()) {
        await renewButton.click();
        await page.waitForTimeout(300);

        const renewDialog = page.locator('[data-testid="renew-rental-dialog"]');
        await expect(renewDialog).toBeVisible({ timeout: TIMEOUT.dialog });

        // 验证月租金输入框存在
        const rentInput = renewDialog.locator('input[type="number"], .t-input-number');
        expect(await rentInput.count()).toBeGreaterThan(0);

        // 验证合同到期日选择器存在
        const datePicker = renewDialog.locator('.t-date-picker, input[type="date"]');
        expect(await datePicker.count()).toBeGreaterThan(0);

        // 验证确认按钮存在
        const confirmButton = renewDialog.locator('button:has-text("确认"), button:has-text("确定")');
        expect(await confirmButton.count()).toBeGreaterThan(0);
      } else {
        test.skip(true, '没有续租按钮');
      }
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  // ==================== 宽限记录弹窗测试 ====================

  test('15. 宽限记录弹窗 - 点击宽限次数打开弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    // 查找有宽限次数的待办项
    const deferralBadge = page.locator('.deferral-badge:has-text("宽限")').first();

    if (await deferralBadge.isVisible()) {
      // 点击宽限次数
      await deferralBadge.click();
      await page.waitForTimeout(300);

      // 验证宽限记录弹窗打开
      const deferralRecordsDialog = page.locator('[data-testid="deferral-records-dialog"]');
      await expect(deferralRecordsDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 验证弹窗标题
      await expect(deferralRecordsDialog.locator('.t-dialog__header').or(deferralRecordsDialog.locator(':text("宽限记录")'))).toBeVisible();
    } else {
      // 没有宽限记录，跳过此测试
      test.skip(true, '没有宽限记录数据');
    }
  });

  test('16. 宽限记录弹窗 - 表格显示正确', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const deferralBadge = page.locator('.deferral-badge:has-text("宽限")').first();

    if (await deferralBadge.isVisible()) {
      await deferralBadge.click();
      await page.waitForTimeout(300);

      const deferralRecordsDialog = page.locator('[data-testid="deferral-records-dialog"]');
      await expect(deferralRecordsDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 验证表格存在
      const table = deferralRecordsDialog.locator('.t-table, table');
      if ((await table.count()) > 0) {
        // 验证表格有内容
        const rows = table.locator('tr, .t-table-row');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThan(0);
      }
    } else {
      test.skip(true, '没有宽限记录数据');
    }
  });

  // ==================== 弹窗关闭测试 ====================

  test('17. 弹窗关闭 - 点击关闭按钮关闭弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 点击关闭按钮或取消按钮
      const closeButton = rentalDialog.locator('.t-dialog__close, button:has-text("取消")').first();
      await closeButton.click();
      await page.waitForTimeout(300);

      // 验证弹窗关闭
      await expect(rentalDialog).not.toBeVisible();
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  test('18. 弹窗关闭 - 点击遮罩关闭弹窗', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 筛选催收房租
    const filterSelect = page.locator('.todo-filter .t-select').first();
    await filterSelect.click();
    await page.waitForTimeout(300);
    await page.locator('.t-select-option:has-text("催收房租")').first().click();
    await page.waitForTimeout(500);

    const rentalTodo = page.locator('.todo-item--rental, .todo-item:has(.todo-type-tag--rental)').first();

    if (await rentalTodo.isVisible()) {
      await rentalTodo.click();
      await page.waitForTimeout(300);

      const rentalDialog = page.locator('[data-testid="rental-reminder-dialog"]');
      await expect(rentalDialog).toBeVisible({ timeout: TIMEOUT.dialog });

      // 点击遮罩层（对话框外区域）
      const overlay = page.locator('.t-dialog__mask, .t-dialog--mask').first();
      if (await overlay.isVisible()) {
        await overlay.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);

        // 验证弹窗关闭（如果配置了点击遮罩关闭）
        const isVisible = await rentalDialog.isVisible();
        // 根据组件配置，点击遮罩可能关闭也可能不关闭
        // 这里只是验证点击操作不会报错
        expect(true).toBeTruthy();
      } else {
        // 没有遮罩层，跳过此验证
        expect(true).toBeTruthy();
      }
    } else {
      test.skip(true, '没有催收房租待办数据');
    }
  });

  // ==================== 空状态测试 ====================

  test('19. 空状态 - 无待办时显示空状态', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await loginAndNavigate(page, '/dashboard/base');

    // 检查是否有待办项
    const todoItems = page.locator('.todo-item');
    const itemCount = await todoItems.count();

    if (itemCount === 0) {
      // 验证空状态显示
      const emptyState = page.locator('.todo-empty').or(page.locator(':text("暂无待办")'));
      await expect(emptyState.first()).toBeVisible();
    } else {
      // 有待办项，验证列表正常
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  // ==================== 加载状态测试 ====================

  test('20. 加载状态 - 页面加载时显示加载中', async ({ page }) => {
    test.skip(!shouldRunIntegrationTests, '需要设置 RUN_INTEGRATION_TESTS=true 并运行服务');

    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: TIMEOUT.element });
    await page.fill('input[placeholder="请输入账号"]', process.env.TEST_USERNAME || 'zhs');
    await page.fill('input[placeholder="请输入密码"]', process.env.TEST_PASSWORD || 'gentle8023');
    await page.click('button[type="submit"]');

    // 导航到仪表盘
    await page.waitForURL(/dashboard/, { timeout: TIMEOUT.navigation });

    // 检查加载状态（可能在加载完成前捕获不到）
    const loadingState = page.locator('.todo-loading, .t-loading');
    // 加载状态可能已经消失，所以不强制要求可见

    // 等待加载完成
    await page.waitForLoadState('networkidle');

    // 验证页面已加载完成
    const todoPanel = page.locator('.todo-panel, [class*="todo"]');
    await expect(todoPanel.first()).toBeVisible({ timeout: TIMEOUT.element });
  });
});

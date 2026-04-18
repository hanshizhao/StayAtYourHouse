import { expect, test } from '@playwright/test';

test.describe('FEAT-165 房间卡片布局', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('**/dashboard**');
    await page.goto('/housing/room');
    await page.waitForLoadState('networkidle');
  });

  test('卡片网格正确渲染（3列布局）', async ({ page }) => {
    const grid = page.getByTestId('room-card-grid');
    await expect(grid).toBeVisible();

    const cards = page.getByTestId('room-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // 验证卡片有网格布局
    const gridDisplay = await grid.evaluate(
      (el) => getComputedStyle(el).display,
    );
    expect(gridDisplay).toBe('grid');
  });

  test('页面标题和新增按钮可见', async ({ page }) => {
    await expect(page.getByText('房间管理').first()).toBeVisible();
    await expect(page.getByTestId('add-room-button')).toBeVisible();
  });

  test('筛选栏：小区、状态、异常租约三个筛选器', async ({ page }) => {
    await expect(page.getByTestId('community-filter')).toBeVisible();
    await expect(page.getByTestId('status-filter')).toBeVisible();
    await expect(page.getByTestId('lease-alert-filter')).toBeVisible();
  });

  test('统计摘要显示房间总数', async ({ page }) => {
    const summary = page.getByTestId('room-summary');
    await expect(summary).toBeVisible();
    const text = await summary.textContent();
    expect(text).toContain('共');
    expect(text).toContain('间');
  });

  test('卡片头部显示房间名和状态标签', async ({ page }) => {
    const firstCard = page.getByTestId('room-card').first();
    await expect(firstCard).toBeVisible();

    // 卡片内应有标题（小区+楼栋+房间号）
    const title = firstCard.locator('.room-card-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toContain('栋');

    // 卡片内应有状态标签
    const tag = firstCard.locator('.t-tag');
    await expect(tag).toBeVisible();
  });

  test('卡片中部显示房东和租客信息', async ({ page }) => {
    const firstCard = page.getByTestId('room-card').first();

    // 验证房东侧（使用精确 class 选择器避免匹配"无房东租约"）
    const landlordLabel = firstCard.locator('.lease-label').first();
    await expect(landlordLabel).toBeVisible();

    // 验证租客侧
    const tenantLabel = firstCard.locator('.lease-label').nth(1);
    await expect(tenantLabel).toBeVisible();
  });

  test('卡片底部显示利润和操作按钮', async ({ page }) => {
    const firstCard = page.getByTestId('room-card').first();

    // 利润标签
    const profitLabel = firstCard.locator('.profit-label');
    await expect(profitLabel).toBeVisible();

    // 利润值
    const profitValue = firstCard.locator('.profit-value');
    await expect(profitValue).toBeVisible();

    // 操作按钮
    await expect(firstCard.getByTestId('edit-button')).toBeVisible();
    await expect(firstCard.getByTestId('lease-button')).toBeVisible();
    await expect(firstCard.getByTestId('maintenance-button')).toBeVisible();
    await expect(firstCard.getByTestId('delete-button')).toBeVisible();
  });

  test('分页组件可见', async ({ page }) => {
    const pagination = page.getByTestId('room-pagination');
    await expect(pagination).toBeVisible();
  });

  test('新增房间弹窗正常打开', async ({ page }) => {
    await page.getByTestId('add-room-button').click();
    const dialog = page.getByTestId('room-form-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('新建房间')).toBeVisible();
  });

  test('编辑房间弹窗正常打开', async ({ page }) => {
    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('edit-button').click();
    const dialog = page.getByTestId('room-form-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('编辑房间')).toBeVisible();
  });

  test('房东租约抽屉正常打开', async ({ page }) => {
    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('lease-button').click();
    const drawer = page.getByTestId('lease-drawer');
    await expect(drawer).toBeVisible();
  });
});

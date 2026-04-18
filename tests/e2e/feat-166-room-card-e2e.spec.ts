import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_USERNAME = process.env.TEST_USERNAME || 'zhs';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'gentle8023';

test.describe.serial('FEAT-166: 端到端验证 — 卡片布局全流程', () => {
  async function loginAndNavigate(page: Page) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', TEST_USERNAME);
    await page.fill('input[placeholder="请输入密码"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/housing/room`);
    await page.waitForLoadState('networkidle');
  }

  async function waitForCards(page: Page) {
    const grid = page.getByTestId('room-card-grid');
    await grid.waitFor({ state: 'visible', timeout: 10000 });
    return grid;
  }

  // ==================== 卡片渲染 ====================

  test('卡片网格渲染 — CSS Grid 3列布局', async ({ page }) => {
    await loginAndNavigate(page);
    const grid = await waitForCards(page);

    const gridStyle = await grid.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { display: cs.display, columns: cs.gridTemplateColumns };
    });
    expect(gridStyle.display).toBe('grid');

    const columns = gridStyle.columns.split(' ').length;
    expect(columns).toBeGreaterThanOrEqual(1);
    expect(columns).toBeLessThanOrEqual(3);

    const cards = page.getByTestId('room-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('卡片头部 — 房间名包含栋号，状态标签可见', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();

    const title = firstCard.locator('.room-card-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toContain('栋');

    const tag = firstCard.locator('.t-tag');
    await expect(tag).toBeVisible();
    const tagText = await tag.textContent();
    const validStatuses = ['空置', '已出租', '装修中', '已收回'];
    expect(validStatuses).toContain(tagText);
  });

  // ==================== 房东租约信息 ====================

  test('房东租约信息 — 显示姓名、租金、到期、状态', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    const landlordSide = firstCard.locator('.landlord-side');

    const label = landlordSide.locator('.lease-label');
    await expect(label).toBeVisible();
    expect(await label.textContent()).toContain('房东租约');

    const hasLease = await landlordSide.locator('.lease-name').count();
    if (hasLease > 0) {
      await expect(landlordSide.locator('.lease-name')).toBeVisible();
      await expect(landlordSide.locator('.lease-rent-value')).toBeVisible();
      await expect(landlordSide.locator('.lease-expiry')).toBeVisible();
      await expect(landlordSide.locator('.lease-status-tag')).toBeVisible();
    } else {
      await expect(landlordSide.locator('.lease-empty')).toBeVisible();
    }
  });

  // ==================== 租客租约信息 ====================

  test('租客租约信息 — 已出租房间显示租客详情，空置显示暂无租客', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    const tenantSide = firstCard.locator('.tenant-side');

    const label = tenantSide.locator('.lease-label');
    await expect(label).toBeVisible();
    expect(await label.textContent()).toContain('租客租约');

    const hasTenant = await tenantSide.locator('.lease-name').count();
    if (hasTenant > 0) {
      await expect(tenantSide.locator('.lease-name')).toBeVisible();
      await expect(tenantSide.locator('.lease-rent-value')).toBeVisible();
      await expect(tenantSide.locator('.lease-expiry')).toBeVisible();
      await expect(tenantSide.locator('.lease-status-tag')).toBeVisible();
    } else {
      await expect(tenantSide.locator('.lease-empty')).toBeVisible();
      const emptyText = await tenantSide.locator('.lease-empty').textContent();
      expect(emptyText).toContain('暂无租客');
    }
  });

  // ==================== 利润显示 ====================

  test('利润显示 — 实际/预期标签和正负颜色', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();

    const profitLabel = firstCard.locator('.profit-label');
    await expect(profitLabel).toBeVisible();
    const labelText = await profitLabel.textContent();
    expect(['实际利润', '预期利润']).toContain(labelText);

    const profitValue = firstCard.locator('.profit-value');
    await expect(profitValue).toBeVisible();
    const profitText = await profitValue.textContent();
    expect(profitText).toContain('¥');

    const classList = await profitValue.evaluate((el) => [...el.classList]);
    const hasColor = classList.includes('positive') || classList.includes('negative');
    expect(hasColor).toBeTruthy();
  });

  // ==================== 租约状态标签颜色 ====================

  test('租约状态标签 — CSS 类名匹配四种状态', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const allTags = page.locator('.lease-status-tag');
    const tagCount = await allTags.count();
    expect(tagCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(tagCount, 10); i++) {
      const tag = allTags.nth(i);
      const classList = await tag.evaluate((el) => [...el.classList]);
      const hasStatusClass = ['lease-status-normal', 'lease-status-expiring', 'lease-status-expired', 'lease-status-none']
        .some(cls => classList.includes(cls));
      expect(hasStatusClass).toBeTruthy();
    }
  });

  // ==================== 筛选功能 ====================

  test('筛选功能 — 小区筛选器可选择', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    await expect(page.getByTestId('community-filter')).toBeVisible();
    await expect(page.getByTestId('status-filter')).toBeVisible();
    await expect(page.getByTestId('lease-alert-filter')).toBeVisible();
  });

  test('筛选功能 — 状态筛选后刷新列表', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const statusFilter = page.getByTestId('status-filter');
    await statusFilter.click();

    const option = page.locator('.t-select-option').getByText('已出租');
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
      await page.waitForLoadState('networkidle');

      const cards = page.getByTestId('room-card');
      const count = await cards.count();
      if (count > 0) {
        const tags = cards.locator('.t-tag');
        const firstTagText = await tags.first().textContent();
        expect(firstTagText).toBe('已出租');
      }
    }
  });

  // ==================== 分页功能 ====================

  test('分页功能 — 分页组件可见且显示总数', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const pagination = page.getByTestId('room-pagination');
    await expect(pagination).toBeVisible();

    const summary = page.getByTestId('room-summary');
    const summaryText = await summary.textContent();
    expect(summaryText).toMatch(/共 \d+ 间/);
  });

  test('分页功能 — 切换页面大小后重新加载', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const pagination = page.getByTestId('room-pagination');
    await expect(pagination).toBeVisible();

    const totalText = await page.getByTestId('room-summary').textContent();
    const total = Number.parseInt(totalText!.match(/(\d+)/)![1], 10);

    if (total > 9) {
      const pageSizer = pagination.locator('.t-pagination__select');
      if (await pageSizer.isVisible().catch(() => false)) {
        await pageSizer.click();
        const option18 = page.locator('.t-select-option').getByText('18 条/页');
        if (await option18.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option18.click();
          await page.waitForLoadState('networkidle');

          const cards = page.getByTestId('room-card');
          const count = await cards.count();
          expect(count).toBeLessThanOrEqual(18);
        }
      }
    }
  });

  // ==================== CRUD 操作 ====================

  test('CRUD — 新增房间弹窗打开并包含表单字段', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    await page.getByTestId('add-room-button').click();
    const dialog = page.getByTestId('room-form-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('新建房间')).toBeVisible();

    await expect(page.getByTestId('room-community-select')).toBeVisible();
    await expect(page.getByTestId('room-building-input')).toBeVisible();
    await expect(page.getByTestId('room-number-input')).toBeVisible();
    await expect(page.getByTestId('room-rent-price-input')).toBeVisible();
  });

  test('CRUD — 编辑房间弹窗打开并预填数据', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('edit-button').click();

    const dialog = page.getByTestId('room-form-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByText('编辑房间')).toBeVisible();

    const buildingInput = page.getByTestId('room-building-input').locator('input');
    const buildingValue = await buildingInput.inputValue();
    expect(buildingValue.length).toBeGreaterThan(0);
  });

  test('CRUD — 删除房间弹出确认对话框', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('delete-button').click();

    const confirmDialog = page.getByTestId('confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    const message = page.getByTestId('confirm-dialog-message');
    await expect(message).toBeVisible();
    const msgText = await message.textContent();
    expect(msgText).toContain('确定要删除');
  });

  // ==================== 房东租约抽屉 ====================

  test('租约抽屉 — 打开后显示租约信息或空状态', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('lease-button').click();

    const drawer = page.getByTestId('lease-drawer');
    await expect(drawer).toBeVisible();

    // Wait for content to appear (either detail or empty state)
    await Promise.race([
      drawer.getByText('租约详情').waitFor({ state: 'visible', timeout: 10000 }),
      drawer.getByText('暂无租约信息').waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    const hasDetail = await drawer.getByText('租约详情').isVisible().catch(() => false);
    const hasEmpty = await drawer.getByText('暂无租约信息').isVisible().catch(() => false);
    expect(hasDetail || hasEmpty).toBeTruthy();
  });

  test('租约抽屉 — 空状态下可添加租约', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForCards(page);

    const firstCard = page.getByTestId('room-card').first();
    await firstCard.getByTestId('lease-button').click();

    const drawer = page.getByTestId('lease-drawer');
    await expect(drawer).toBeVisible();

    if (await page.getByTestId('lease-empty-state').isVisible().catch(() => false)) {
      const addButton = page.getByTestId('lease-add-button');
      await expect(addButton).toBeVisible();
    }
  });

  // ==================== 响应式布局 ====================

  test('响应式布局 — 1200px 以下变为 2 列', async ({ page }) => {
    await loginAndNavigate(page);
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForLoadState('networkidle');

    const grid = await waitForCards(page);
    const columns = await grid.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBeLessThanOrEqual(2);
  });

  test('响应式布局 — 768px 以下变为 1 列', async ({ page }) => {
    await loginAndNavigate(page);
    await page.setViewportSize({ width: 700, height: 800 });
    await page.waitForLoadState('networkidle');

    const grid = await waitForCards(page);
    const columns = await grid.evaluate((el) => {
      const cs = getComputedStyle(el);
      return cs.gridTemplateColumns.split(' ').length;
    });
    expect(columns).toBe(1);
  });
});

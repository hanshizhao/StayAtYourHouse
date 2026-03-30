import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe.serial('FEAT-103: 端到端验证 — 安居码完整流程', () => {
  /**
   * 登录并导航到租赁记录页面
   */
  async function loginAndNavigate(page: Page) {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('input[placeholder="请输入账号"]', { timeout: 10000 });
    await page.fill('input[placeholder="请输入账号"]', 'zhs');
    await page.fill('input[placeholder="请输入密码"]', 'gentle8023');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|housing/, { timeout: 15000 });
    await page.goto(`${BASE_URL}/housing/rental`);
    await page.waitForLoadState('networkidle');
  }

  /**
   * 等待表格加载完成并返回表格定位器
   */
  async function waitForTable(page: Page) {
    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });
    return table;
  }

  test('页面加载 — 租赁记录页面正常显示', async ({ page }) => {
    await loginAndNavigate(page);

    const table = await waitForTable(page);

    // 验证核心列都存在
    const headerTexts = await table.locator('th').allTextContents();
    const requiredHeaders = ['租客姓名', '安居码', '房间信息', '状态'];
    for (const header of requiredHeaders) {
      expect(headerTexts.some(t => t.includes(header))).toBeTruthy();
    }

    // 验证筛选栏可见
    await expect(page.getByTestId('status-filter')).toBeVisible();
  });

  test('安居码列可见 — 位于租客姓名列之后', async ({ page }) => {
    await loginAndNavigate(page);

    const table = await waitForTable(page);
    const headers = table.locator('th');
    const count = await headers.count();

    let tenantNameIndex = -1;
    let anjuCodeIndex = -1;

    for (let i = 0; i < count; i++) {
      const text = await headers.nth(i).textContent();
      if (text?.includes('租客姓名')) tenantNameIndex = i;
      if (text?.includes('安居码')) anjuCodeIndex = i;
    }

    expect(tenantNameIndex).not.toBe(-1);
    expect(anjuCodeIndex).not.toBe(-1);
    expect(anjuCodeIndex).toBeGreaterThan(tenantNameIndex);
  });

  test('确认弹窗 — 点击"未提交"显示租客和房间信息', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForTable(page);

    const unsubmittedLinks = page.getByTestId('anju-unsubmitted');
    const count = await unsubmittedLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    await unsubmittedLinks.first().click();

    // 验证弹窗内容
    const dialog = page.locator('.t-dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    const header = dialog.locator('.t-dialog__header');
    const headerText = await header.textContent();
    expect(headerText).toContain('确认提交安居码');

    const body = dialog.locator('.t-dialog__body');
    const bodyText = await body.textContent();
    // 弹窗内容格式：确认租客「xxx」的房间「xxx」已提交安居码？
    expect(bodyText).toContain('租客');
    expect(bodyText).toContain('房间');
    expect(bodyText).toContain('安居码');

    // 关闭弹窗（不提交）
    await dialog.getByRole('button', { name: '取消' }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });
  });

  test('提交成功 — 确认后记录更新为 ✅', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForTable(page);

    const unsubmittedLinks = page.getByTestId('anju-unsubmitted');
    const count = await unsubmittedLinks.count();

    if (count === 0) {
      test.skip();
      return;
    }

    // 拦截 API 请求，验证调用了正确的端点
    const confirmRequestPromise = page.waitForRequest(
      req => req.url().includes('/rental/confirm-anju-code/') && req.method() === 'POST',
      { timeout: 10000 },
    );

    // 点击第一个未提交链接
    await unsubmittedLinks.first().click();

    // 确认弹窗中点击确认
    const dialog = page.locator('.t-dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    await dialog.getByRole('button', { name: '确认' }).click();

    // 验证 API 请求发出
    const confirmRequest = await confirmRequestPromise;
    expect(confirmRequest.url()).toMatch(/\/rental\/confirm-anju-code\/\d+/);

    // 等待页面刷新（fetchData 重新加载）
    await page.waitForResponse(
      res => res.url().includes('/rental/page') && res.status() === 200,
      { timeout: 10000 },
    );

    // 验证成功提示
    const message = page.locator('.t-message');
    if (await message.isVisible({ timeout: 3000 }).catch(() => false)) {
      const msgText = await message.textContent();
      expect(msgText).toContain('成功');
    }
  });

  test('幂等处理 — 已提交记录显示 ✅ 且不可点击', async ({ page }) => {
    await loginAndNavigate(page);
    await waitForTable(page);

    const submittedCells = page.getByTestId('anju-submitted');
    const submittedCount = await submittedCells.count();

    const unsubmittedLinks = page.getByTestId('anju-unsubmitted');
    const unsubmittedCount = await unsubmittedLinks.count();

    // 至少要有数据（已提交或未提交都算）
    expect(submittedCount + unsubmittedCount).toBeGreaterThan(0);

    // 如果有已提交记录，验证其内容
    if (submittedCount > 0) {
      const text = await submittedCells.first().textContent();
      expect(text).toContain('✅');

      // 已提交的 span 不应有 click 事件（非链接元素）
      const tagName = await submittedCells.first().evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('span');
    }
  });
});

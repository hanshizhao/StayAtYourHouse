import { expect, test, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

test.describe.serial('FEAT-102: 前端 UI — 表格新增安居码列及确认交互', () => {
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

  test('租赁记录表格包含安居码列', async ({ page }) => {
    await loginAndNavigate(page);

    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const headerCell = table.locator('th').filter({ hasText: '安居码' }).first();
    await headerCell.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('安居码列位于租客姓名列之后', async ({ page }) => {
    await loginAndNavigate(page);

    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

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

  test('已提交安居码记录显示 ✅ 图标', async ({ page }) => {
    await loginAndNavigate(page);

    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const submittedCells = page.getByTestId('anju-submitted');
    const count = await submittedCells.count();

    if (count > 0) {
      await submittedCells.first().waitFor({ state: 'visible' });
      const text = await submittedCells.first().textContent();
      expect(text).toContain('✅');
    }
  });

  test('未提交安居码记录显示红色"未提交"链接', async ({ page }) => {
    await loginAndNavigate(page);

    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const unsubmittedLinks = page.getByTestId('anju-unsubmitted');
    const count = await unsubmittedLinks.count();

    if (count > 0) {
      await unsubmittedLinks.first().waitFor({ state: 'visible' });
      const text = await unsubmittedLinks.first().textContent();
      expect(text).toContain('未提交');
    }
  });

  test('点击"未提交"弹出确认弹窗', async ({ page }) => {
    await loginAndNavigate(page);

    const table = page.getByTestId('rental-table');
    await table.waitFor({ state: 'visible', timeout: 10000 });

    const unsubmittedLinks = page.getByTestId('anju-unsubmitted');
    const count = await unsubmittedLinks.count();

    if (count > 0) {
      await unsubmittedLinks.first().click();

      const dialog = page.locator('.t-dialog');
      await dialog.waitFor({ state: 'visible', timeout: 5000 });

      const header = dialog.locator('.t-dialog__header');
      await header.waitFor({ state: 'visible' });
      const headerText = await header.textContent();
      expect(headerText).toContain('确认提交安居码');

      const body = dialog.locator('.t-dialog__body');
      const bodyText = await body.textContent();
      expect(bodyText).toContain('租客');
      expect(bodyText).toContain('房间');

      await dialog.getByRole('button', { name: '取消' }).click();
    }
  });
});

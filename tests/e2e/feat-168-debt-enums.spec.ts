/**
 * FEAT-168: 后端枚举 - DebtStatus 和 PaymentChannel
 * 类型: static
 *
 * 测试覆盖：
 * 1. DebtStatus.cs 文件存在及枚举值正确
 * 2. PaymentChannel.cs 文件存在及枚举值正确
 * 3. 枚举代码模式与项目约定一致
 * 4. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-168: 后端枚举 - DebtStatus 和 PaymentChannel', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const debtStatusPath = path.join(serverPath, 'Gentle.Core/Enums/DebtStatus.cs');
  const paymentChannelPath = path.join(serverPath, 'Gentle.Core/Enums/PaymentChannel.cs');

  test('1. DebtStatus.cs 文件存在', async () => {
    expect(fs.existsSync(debtStatusPath)).toBeTruthy();
  });

  test('2. DebtStatus 枚举值正确（Ongoing=0, Settled=1）', async () => {
    if (!fs.existsSync(debtStatusPath)) {
      test.skip('DebtStatus.cs 不存在');
      return;
    }

    const content = fs.readFileSync(debtStatusPath, 'utf-8');

    expect(content).toMatch(/enum\s+DebtStatus/);
    expect(content).toMatch(/Ongoing\s*=\s*0/);
    expect(content).toMatch(/Settled\s*=\s*1/);
  });

  test('3. PaymentChannel.cs 文件存在', async () => {
    expect(fs.existsSync(paymentChannelPath)).toBeTruthy();
  });

  test('4. PaymentChannel 枚举值正确（Cash=0, WeChat=1, Alipay=2, BankTransfer=3）', async () => {
    if (!fs.existsSync(paymentChannelPath)) {
      test.skip('PaymentChannel.cs 不存在');
      return;
    }

    const content = fs.readFileSync(paymentChannelPath, 'utf-8');

    expect(content).toMatch(/enum\s+PaymentChannel/);
    expect(content).toMatch(/Cash\s*=\s*0/);
    expect(content).toMatch(/WeChat\s*=\s*1/);
    expect(content).toMatch(/Alipay\s*=\s*2/);
    expect(content).toMatch(/BankTransfer\s*=\s*3/);
  });

  test('5. 枚举使用 file-scoped namespace（项目约定）', async () => {
    const debtContent = fs.readFileSync(debtStatusPath, 'utf-8');
    const paymentContent = fs.readFileSync(paymentChannelPath, 'utf-8');

    expect(debtContent).toMatch(/^namespace\s+Gentle\.Core\.Enums;/m);
    expect(paymentContent).toMatch(/^namespace\s+Gentle\.Core\.Enums;/m);
  });

  test('6. dotnet build 构建成功', async () => {
    const result = execSync('dotnet build', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });
});

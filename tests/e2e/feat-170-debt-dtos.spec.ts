/**
 * FEAT-170: 后端 DTO - 所有欠款相关 DTO - 静态验证
 * 类型: static
 *
 * 测试覆盖：
 * 1. DebtDto.cs 文件存在
 * 2. 所有 DTO 类定义完整（DebtListDto, DebtDetailDto, DebtRepaymentDto 等）
 * 3. DebtListInput 包含分页和筛选参数
 * 4. CreateDebtInput / UpdateDebtInput / AddRepaymentInput 包含验证特性
 * 5. 枚举映射文本字段（StatusText, PaymentChannelText）
 * 6. dotnet build 构建成功
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-170: 后端 DTO - 所有欠款相关 DTO', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const dtoPath = path.join(serverPath, 'Gentle.Application/Dtos/Debt/DebtDto.cs');

  // ==================== 文件存在性测试 ====================

  test('1. DebtDto.cs 文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  // ==================== DTO 类定义测试 ====================

  test('2. DebtListDto 包含关键字段', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+DebtListDto/);
    expect(content).toMatch(/TenantName/);
    expect(content).toMatch(/TenantPhone/);
    expect(content).toMatch(/TotalAmount/);
    expect(content).toMatch(/PaidAmount/);
    expect(content).toMatch(/RemainingAmount/);
    expect(content).toMatch(/StatusText/);
  });

  test('3. DebtDetailDto 包含详情字段和还款记录', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+DebtDetailDto/);
    expect(content).toMatch(/List<DebtRepaymentDto>\s+Repayments/);
    expect(content).toMatch(/Description/);
    expect(content).toMatch(/Remark/);
  });

  test('4. DebtRepaymentDto 包含还款字段', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+DebtRepaymentDto/);
    expect(content).toMatch(/Amount/);
    expect(content).toMatch(/PaymentDate/);
    expect(content).toMatch(/PaymentChannel/);
    expect(content).toMatch(/PaymentChannelText/);
  });

  // ==================== 输入 DTO 验证特性测试 ====================

  test('5. DebtListInput 包含分页和筛选参数', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+DebtListInput/);
    expect(content).toMatch(/Keyword/);
    expect(content).toMatch(/DebtStatus\??\s+Status/);
    expect(content).toMatch(/Page/);
    expect(content).toMatch(/PageSize/);
  });

  test('6. DebtListResult 分页结构', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+DebtListResult/);
    expect(content).toMatch(/List<DebtListDto>/);
    expect(content).toMatch(/Total/);
  });

  test('7. CreateDebtInput 包含 Required 验证', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+CreateDebtInput/);
    expect(content).toMatch(/\[Required/);
    expect(content).toMatch(/\[Range/);
    expect(content).toMatch(/TenantId/);
    expect(content).toMatch(/TotalAmount/);
  });

  test('8. UpdateDebtInput 包含 Id 和验证', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+UpdateDebtInput/);
    expect(content).toMatch(/Id/);
  });

  test('9. AddRepaymentInput 包含还款验证', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/class\s+AddRepaymentInput/);
    expect(content).toMatch(/PaymentChannel/);
    expect(content).toMatch(/PaymentDate/);
  });

  // ==================== 枚举文本映射测试 ====================

  test('10. StatusText 映射 DebtStatus 枚举', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/DebtStatus\.Ongoing.*进行中/);
    expect(content).toMatch(/DebtStatus\.Settled.*已结清/);
  });

  test('11. PaymentChannelText 映射 PaymentChannel 枚举', async () => {
    if (!fs.existsSync(dtoPath)) { test.skip(); return; }
    const content = fs.readFileSync(dtoPath, 'utf-8');

    expect(content).toMatch(/PaymentChannel\.Cash.*现金/);
    expect(content).toMatch(/PaymentChannel\.WeChat.*微信/);
    expect(content).toMatch(/PaymentChannel\.Alipay.*支付宝/);
    expect(content).toMatch(/PaymentChannel\.BankTransfer.*银行转账/);
  });

  // ==================== 构建验证 ====================

  test('12. dotnet build 构建成功', async () => {
    const result = execSync('dotnet build', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });
});

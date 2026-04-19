/**
 * FEAT-174: 前端 API 层 + 路由 - debtModel 类型定义、API 调用、路由模块
 * 类型: static
 *
 * 测试覆盖：
 * 1. debtModel.ts 文件存在 + 枚举定义 + 所有接口类型
 * 2. debt.ts API 文件存在 + 7 个 API 函数 + 路由常量
 * 3. debt.ts 路由模块文件存在 + 路由配置
 * 4. TypeScript 编译通过（无 debt 相关错误）
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-174: 前端 API 层 + 路由', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');
  const modelPath = path.join(hansPath, 'src/api/model/debtModel.ts');
  const apiPath = path.join(hansPath, 'src/api/debt.ts');
  const routePath = path.join(hansPath, 'src/router/modules/debt.ts');

  let modelContent: string;
  let apiContent: string;
  let routeContent: string;

  test.beforeAll(() => {
    modelContent = fs.readFileSync(modelPath, 'utf-8');
    apiContent = fs.readFileSync(apiPath, 'utf-8');
    routeContent = fs.readFileSync(routePath, 'utf-8');
  });

  // ==================== debtModel.ts 测试 ====================

  test('1. debtModel.ts 文件存在', async () => {
    expect(fs.existsSync(modelPath)).toBeTruthy();
  });

  test('2. 枚举定义正确', async () => {
    // DebtStatus 枚举
    expect(modelContent).toMatch(/enum\s+DebtStatus\s*\{/);
    expect(modelContent).toMatch(/Ongoing\s*=\s*0/);
    expect(modelContent).toMatch(/Settled\s*=\s*1/);

    // PaymentChannel 枚举
    expect(modelContent).toMatch(/enum\s+PaymentChannel\s*\{/);
    expect(modelContent).toMatch(/Cash\s*=\s*0/);
    expect(modelContent).toMatch(/WeChat\s*=\s*1/);
    expect(modelContent).toMatch(/Alipay\s*=\s*2/);
    expect(modelContent).toMatch(/BankTransfer\s*=\s*3/);
  });

  test('3. 映射常量定义', async () => {
    expect(modelContent).toMatch(/DEBT_STATUS_MAP/);
    expect(modelContent).toMatch(/PAYMENT_CHANNEL_MAP/);
  });

  test('4. 接口类型定义完整', async () => {
    // 列表项
    expect(modelContent).toMatch(/interface\s+DebtListItem/);
    expect(modelContent).toMatch(/tenantId:\s*number/);
    expect(modelContent).toMatch(/totalAmount:\s*number/);
    expect(modelContent).toMatch(/paidAmount:\s*number/);
    expect(modelContent).toMatch(/remainingAmount:\s*number/);
    expect(modelContent).toMatch(/status:\s*DebtStatus/);
    expect(modelContent).toMatch(/statusText:\s*string/);

    // 还款记录项
    expect(modelContent).toMatch(/interface\s+DebtRepaymentItem/);
    expect(modelContent).toMatch(/paymentChannel:\s*PaymentChannel/);
    expect(modelContent).toMatch(/paymentChannelText:\s*string/);

    // 详情
    expect(modelContent).toMatch(/interface\s+DebtDetail/);
    expect(modelContent).toMatch(/repayments:\s*DebtRepaymentItem\[\]/);

    // 查询参数
    expect(modelContent).toMatch(/interface\s+GetDebtListParams/);
    expect(modelContent).toMatch(/keyword\??:\s*string/);
    expect(modelContent).toMatch(/status\??:\s*DebtStatus/);

    // 分页结果
    expect(modelContent).toMatch(/interface\s+DebtListResult/);
    expect(modelContent).toMatch(/list:\s*DebtListItem\[\]/);
    expect(modelContent).toMatch(/total:\s*number/);

    // 创建参数
    expect(modelContent).toMatch(/interface\s+CreateDebtParams/);

    // 更新参数
    expect(modelContent).toMatch(/interface\s+UpdateDebtParams/);
    expect(modelContent).toMatch(/id:\s*number/);

    // 还款参数
    expect(modelContent).toMatch(/interface\s+AddRepaymentParams/);
  });

  // ==================== debt.ts API 测试 ====================

  test('5. debt.ts API 文件存在', async () => {
    expect(fs.existsSync(apiPath)).toBeTruthy();
  });

  test('6. API 路由常量正确', async () => {
    // 路由常量映射后端 DebtAppService 的端点
    expect(apiContent).toMatch(/List:\s*'\/debt\/list'/);
    expect(apiContent).toMatch(/Detail:\s*'\/debt'/);
    expect(apiContent).toMatch(/Create:\s*'\/debt\/add'/);
    expect(apiContent).toMatch(/Update:\s*'\/debt\/edit'/);
    expect(apiContent).toMatch(/Delete:\s*'\/debt\/remove'/);
    expect(apiContent).toMatch(/AddRepayment:\s*'\/debt'/);
    expect(apiContent).toMatch(/DeleteRepayment:\s*'\/debt\/repay\/remove'/);
  });

  test('7. 7 个 API 函数导出', async () => {
    expect(apiContent).toMatch(/export\s+function\s+getDebtList/);
    expect(apiContent).toMatch(/export\s+function\s+getDebtDetail/);
    expect(apiContent).toMatch(/export\s+function\s+createDebt/);
    expect(apiContent).toMatch(/export\s+function\s+updateDebt/);
    expect(apiContent).toMatch(/export\s+function\s+deleteDebt/);
    expect(apiContent).toMatch(/export\s+function\s+addRepayment/);
    expect(apiContent).toMatch(/export\s+function\s+deleteRepayment/);
  });

  test('8. API 函数使用正确的 HTTP 方法', async () => {
    // GET 列表
    expect(apiContent).toMatch(/getDebtList[\s\S]*?request\.get<DebtListResult>/);

    // GET 详情
    expect(apiContent).toMatch(/getDebtDetail[\s\S]*?request\.get<DebtDetail>/);

    // POST 创建
    expect(apiContent).toMatch(/createDebt[\s\S]*?request\.post<DebtDetail>/);

    // PUT 更新
    expect(apiContent).toMatch(/updateDebt[\s\S]*?request\.put<DebtDetail>/);

    // DELETE 删除
    expect(apiContent).toMatch(/deleteDebt[\s\S]*?request\.delete/);

    // POST 还款
    expect(apiContent).toMatch(/addRepayment[\s\S]*?request\.post<DebtRepaymentItem>/);

    // DELETE 还款记录
    expect(apiContent).toMatch(/deleteRepayment[\s\S]*?request\.delete/);
  });

  test('9. 类型导入正确', async () => {
    // 从 debtModel 导入类型
    expect(apiContent).toMatch(/from\s+'@\/api\/model\/debtModel'/);
    expect(apiContent).toMatch(/GetDebtListParams/);
    expect(apiContent).toMatch(/CreateDebtParams/);
    expect(apiContent).toMatch(/UpdateDebtParams/);
    expect(apiContent).toMatch(/AddRepaymentParams/);

    // 从 utils/request 导入
    expect(apiContent).toMatch(/from\s+'@\/utils\/request'/);
  });

  // ==================== debt.ts 路由测试 ====================

  test('10. debt.ts 路由模块文件存在', async () => {
    expect(fs.existsSync(routePath)).toBeTruthy();
  });

  test('11. 路由配置正确', async () => {
    // Layout 包装
    expect(routeContent).toMatch(/import\s+Layout\s+from\s+'@\/layouts\/index\.vue'/);

    // 默认导出数组
    expect(routeContent).toMatch(/export\s+default\s*\[/);

    // 路径和重定向
    expect(routeContent).toMatch(/path:\s*'\/debt'/);
    expect(routeContent).toMatch(/redirect:\s*'\/debt\/list'/);

    // meta 信息
    expect(routeContent).toMatch(/老赖管理/);
    expect(routeContent).toMatch(/icon:\s*'money-circle'/);
    expect(routeContent).toMatch(/orderNo:\s*3/);

    // 子路由
    expect(routeContent).toMatch(/path:\s*'list'/);
    expect(routeContent).toMatch(/欠款列表/);
    expect(routeContent).toMatch(/import\('@\/pages\/debt\/index\.vue'\)/);
  });

  // ==================== TypeScript 编译测试 ====================

  test('12. TypeScript 编译无 debt 相关错误', async () => {
    let output = '';
    try {
      output = execSync('npx vue-tsc --noEmit 2>&1', {
        cwd: hansPath,
        encoding: 'utf-8',
        timeout: 120000,
      });
    } catch (e: any) {
      output = e.stdout ?? '';
    }

    // 检查无 debt 相关错误
    expect(output).not.toMatch(/debt/i);
  });
});

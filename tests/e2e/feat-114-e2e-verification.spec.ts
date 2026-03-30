/**
 * FEAT-114: 端到端验证（LeaseType → LeaseMonths 全链路集成测试）
 *
 * 验证整个 LeaseType → LeaseMonths 重构在集成层面无错误：
 * - 后端 .NET 编译成功
 * - 前端 Vite 生产构建成功
 * - 后端单元测试全部通过
 * - 前端 ESLint 检查无错误
 * - E2E 入住 API 测试通过
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GENTLE_ROOT = path.join(PROJECT_ROOT, 'Gentle');
const HANS_ROOT = path.join(PROJECT_ROOT, 'Hans');
const TESTS_ROOT = path.join(PROJECT_ROOT, 'tests');

describe.serial('FEAT-114: 端到端验证（LeaseType → LeaseMonths 全链路）', () => {
  test('后端 dotnet build 成功', () => {
    const result = execSync('dotnet build', {
      cwd: GENTLE_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true,
      timeout: 120_000,
    });
    // 兼容中英文环境：Build succeeded / 已成功生成
    expect(
      result.includes('Build succeeded') || result.includes('已成功生成'),
    ).toBeTruthy();
  });

  test('前端 npm run build 成功', () => {
    const result = execSync('npm run build', {
      cwd: HANS_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true,
      timeout: 180_000,
    });
    // Vite 构建成功会输出 "built in" 字样
    expect(result).toContain('built in');
  });

  test('后端 dotnet test 通过', () => {
    const result = execSync('dotnet test', {
      cwd: GENTLE_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true,
      timeout: 120_000,
    });
    // 兼容中英文环境：Passed! / 通过!
    expect(
      result.includes('Passed') || result.includes('通过'),
    ).toBeTruthy();
    expect(result).not.toMatch(/\d+ failed/i);
  });

  test('前端 npm run lint 无错误', () => {
    // npm run lint 成功时退出码为 0，execSync 不会抛出异常
    // 失败时退出码非零，execSync 会抛出 Error
    execSync('npm run lint', {
      cwd: HANS_ROOT,
      encoding: 'utf-8',
      stdio: 'pipe',
      shell: true,
      timeout: 60_000,
    });
  });

  test('E2E 入住 API 测试通过', () => {
    const result = execSync(
      'npx playwright test e2e/feat-011-checkin-checkout-api.spec.ts',
      {
        cwd: TESTS_ROOT,
        encoding: 'utf-8',
        stdio: 'pipe',
        shell: true,
        timeout: 120_000,
      },
    );
    expect(result).toMatch(/\d+ passed/);
    expect(result).not.toMatch(/\d+ failed/);
  });
});

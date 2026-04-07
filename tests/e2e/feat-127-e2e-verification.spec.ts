/**
 * FEAT-127: 端到端验证（房间维修管理全模块集成测试）
 *
 * 验证整个房间维修管理模块（FEAT-115~126）在集成层面无错误：
 * - 后端 .NET 编译成功（含枚举/实体/DTO/服务/控制器/迁移）
 * - 前端 Vite 生产构建成功（含 API 层/路由/列表页/表单页/Dashboard 集成）
 * - 前端 ESLint 检查无错误
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, test } from '@playwright/test';

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const GENTLE_ROOT = path.join(PROJECT_ROOT, 'Gentle');
const HANS_ROOT = path.join(PROJECT_ROOT, 'Hans');

describe.serial('FEAT-127: 端到端验证（房间维修管理全模块）', () => {
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
});

/**
 * FEAT-096: 最终验证 - 静态验证
 * ⚠️ 仅适用于：构建检查、代码检查
 */
import { execSync } from 'node:child_process';
import * as path from 'node:path';

import { expect, test } from '@playwright/test';

test.describe('FEAT-096: 最终验证', () => {
  const projectRoot = path.join(__dirname, '../../');
  const hansPath = path.join(projectRoot, 'Hans');

  test('1. TypeScript 类型检查通过', () => {
    const result = execSync('npx vue-tsc --noEmit --pretty', {
      cwd: hansPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    expect(result).toBeDefined();
  });

  test('2. ESLint 检查通过', () => {
    const dashboardPath = path.join(hansPath, 'src/pages/dashboard/base');
    const result = execSync(`npx eslint "${dashboardPath}" --ext .vue,.ts`, {
      cwd: hansPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    expect(result).toBeDefined();
  });

  test('3. 构建通过', () => {
    const result = execSync('npm run build', {
      cwd: hansPath,
      stdio: 'pipe',
      encoding: 'utf-8',
    });
    expect(result).toBeDefined();
  });
});

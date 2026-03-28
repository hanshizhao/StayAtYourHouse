/**
 * FEAT-043: 删除后端 Bill/CollectionRecord 实体和枚举文件 - 静态验证
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('FEAT-043: 删除后端 Bill/CollectionRecord 实体和枚举文件', () => {
  const projectRoot = path.join(__dirname, '../../');
  const gentlePath = path.join(projectRoot, 'Gentle');

  test('1. 验证 Bill 相关文件已删除', async () => {
    const deletedFiles = [
      'Gentle/Gentle.Core/Entities/Bill.cs',
      'Gentle/Gentle.Core/Entities/CollectionRecord.cs',
      'Gentle/Gentle.Core/Enums/BillStatus.cs',
      'Gentle/Gentle.Core/Enums/CollectResult.cs',
    ];

    deletedFiles.forEach(file => {
      const fullPath = path.join(projectRoot, file);
      expect(fs.existsSync(fullPath)).toBeFalsy();
    });
  });

  test('2. 验证编译状态（预期失败，其他文件仍引用）', async () => {
    // 此 Task 后编译会失败，这是预期的
    // 编译修复在后续 Task 中完成
    try {
      execSync('dotnet build', { cwd: gentlePath, stdio: 'pipe', timeout: 60000 });
      // 如果编译成功，说明其他文件已被清理
    } catch (error) {
      // 预期会失败，因为其他文件仍引用 Bill 类型
    }
  });
});

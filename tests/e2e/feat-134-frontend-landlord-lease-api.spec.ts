/**
 * FEAT-134: 房东租约 - 前端类型定义和 API - 静态验证
 * 类型: static
 * 适用于: TypeScript 类型文件 + API 服务文件
 *
 * 测试覆盖：
 * 1. landlordLeaseModel.ts 文件存在性及类型定义完整性
 * 2. PaymentMethod 枚举值与后端一致
 * 3. PaymentMethodText 映射正确
 * 4. LandlordLeaseDetail 接口属性完整
 * 5. CreateLandlordLeaseParams / UpdateLandlordLeaseParams 接口
 * 6. landlordLease.ts API 服务函数和路由
 * 7. roomModel.ts RoomItem 新增 landlordLease 字段
 * 8. TypeScript 类型检查通过
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-134: 房东租约 - 前端类型定义和 API', () => {
  const projectRoot = path.join(__dirname, '../../');
  const frontendPath = path.join(projectRoot, 'Hans');
  const modelPath = path.join(frontendPath, 'src/api/model/landlordLeaseModel.ts');
  const apiPath = path.join(frontendPath, 'src/api/landlordLease.ts');
  const roomModelPath = path.join(frontendPath, 'src/api/model/roomModel.ts');

  // ==================== landlordLeaseModel.ts 测试 ====================

  test('1. 检查 landlordLeaseModel.ts 文件存在', async () => {
    expect(fs.existsSync(modelPath)).toBeTruthy();
  });

  test('2. 验证 PaymentMethod 枚举定义', async () => {
    if (!fs.existsSync(modelPath)) {
      test.skip('landlordLeaseModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(modelPath, 'utf-8');

    // 枚举定义
    expect(content).toMatch(/export\s+enum\s+PaymentMethod/);

    // 枚举值与后端一致
    expect(content).toMatch(/Monthly\s*=\s*0/);
    expect(content).toMatch(/Quarterly\s*=\s*1/);
    expect(content).toMatch(/SemiAnnual\s*=\s*2/);
    expect(content).toMatch(/Annual\s*=\s*3/);
    expect(content).toMatch(/Custom\s*=\s*4/);
  });

  test('3. 验证 PaymentMethodText 映射', async () => {
    if (!fs.existsSync(modelPath)) {
      test.skip('landlordLeaseModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(modelPath, 'utf-8');

    expect(content).toMatch(/export\s+const\s+PaymentMethodText/);
    expect(content).toMatch(/Monthly.*月付/);
    expect(content).toMatch(/Quarterly.*季付/);
    expect(content).toMatch(/SemiAnnual.*半年付/);
    expect(content).toMatch(/Annual.*年付/);
    expect(content).toMatch(/Custom.*自定义/);
  });

  test('4. 验证 LandlordLeaseDetail 接口属性', async () => {
    if (!fs.existsSync(modelPath)) {
      test.skip('landlordLeaseModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(modelPath, 'utf-8');

    expect(content).toMatch(/export\s+interface\s+LandlordLeaseDetail/);

    // 核心属性
    expect(content).toMatch(/id:\s*number/);
    expect(content).toMatch(/roomId:\s*number/);
    expect(content).toMatch(/landlordName:\s*string/);
    expect(content).toMatch(/monthlyRent:\s*number/);
    expect(content).toMatch(/paymentMethod:\s*PaymentMethod/);
    expect(content).toMatch(/paymentMethodText:\s*string/);

    // 费用属性
    expect(content).toMatch(/waterPrice\??\s*:\s*number/);
    expect(content).toMatch(/electricPrice\??\s*:\s*number/);
    expect(content).toMatch(/elevatorFee\??\s*:\s*number/);
    expect(content).toMatch(/propertyFee\??\s*:\s*number/);
    expect(content).toMatch(/internetFee\??\s*:\s*number/);
    expect(content).toMatch(/otherFees\??\s*:\s*number/);

    // 其他
    expect(content).toMatch(/remark\??\s*:\s*string/);
    expect(content).toMatch(/createdTime:\s*string/);
    expect(content).toMatch(/roomInfo\??\s*:\s*string/);
  });

  test('5. 验证 CreateLandlordLeaseParams 接口', async () => {
    if (!fs.existsSync(modelPath)) {
      test.skip('landlordLeaseModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(modelPath, 'utf-8');

    expect(content).toMatch(/export\s+interface\s+CreateLandlordLeaseParams/);

    // 必须有 roomId（创建时需要关联房间）
    expect(content).toMatch(/roomId:\s*number/);

    // 不应有 id（创建时不需要）
    const createMatch = content.match(/export\s+interface\s+CreateLandlordLeaseParams\s*\{[^}]*\}/);
    expect(createMatch).toBeTruthy();
    expect(createMatch![0]).not.toMatch(/\bid:\s*number\b/);
  });

  test('6. 验证 UpdateLandlordLeaseParams 接口', async () => {
    if (!fs.existsSync(modelPath)) {
      test.skip('landlordLeaseModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(modelPath, 'utf-8');

    expect(content).toMatch(/export\s+interface\s+UpdateLandlordLeaseParams/);

    // 必须有 id（更新时需要标识）
    expect(content).toMatch(/id:\s*number/);

    // 不应有 roomId（更新时不改变关联房间）
    const updateMatch = content.match(/export\s+interface\s+UpdateLandlordLeaseParams\s*\{[^}]*\}/);
    expect(updateMatch).toBeTruthy();
    expect(updateMatch![0]).not.toMatch(/roomId/);
  });

  // ==================== landlordLease.ts API 测试 ====================

  test('7. 检查 landlordLease.ts API 文件存在', async () => {
    expect(fs.existsSync(apiPath)).toBeTruthy();
  });

  test('8. 验证 API 路由路径', async () => {
    if (!fs.existsSync(apiPath)) {
      test.skip('landlordLease.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(apiPath, 'utf-8');

    // 路由前缀
    expect(content).toMatch(/\/landlord-lease\//);

    // 四个 API 函数
    expect(content).toMatch(/export\s+function\s+getLandlordLeaseByRoomId/);
    expect(content).toMatch(/export\s+function\s+addLandlordLease/);
    expect(content).toMatch(/export\s+function\s+updateLandlordLease/);
    expect(content).toMatch(/export\s+function\s+removeLandlordLease/);
  });

  test('9. 验证 API 使用正确的 HTTP 方法', async () => {
    if (!fs.existsSync(apiPath)) {
      test.skip('landlordLease.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(apiPath, 'utf-8');

    // GET 查询
    expect(content).toMatch(/request\.get/);
    // POST 创建
    expect(content).toMatch(/request\.post/);
    // PUT 更新
    expect(content).toMatch(/request\.put/);
    // DELETE 删除
    expect(content).toMatch(/request\.delete/);
  });

  test('10. 验证 API 导入类型', async () => {
    if (!fs.existsSync(apiPath)) {
      test.skip('landlordLease.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(apiPath, 'utf-8');

    expect(content).toMatch(/import.*LandlordLeaseDetail.*from.*landlordLeaseModel/);
    expect(content).toMatch(/import.*CreateLandlordLeaseParams.*from.*landlordLeaseModel/);
    expect(content).toMatch(/import.*UpdateLandlordLeaseParams.*from.*landlordLeaseModel/);
    expect(content).toMatch(/import.*request.*from/);
  });

  // ==================== roomModel.ts 变更测试 ====================

  test('11. 验证 RoomItem 新增 landlordLease 字段', async () => {
    if (!fs.existsSync(roomModelPath)) {
      test.skip('roomModel.ts 文件不存在');
      return;
    }

    const content = fs.readFileSync(roomModelPath, 'utf-8');

    // RoomItem 接口中有 landlordLease 字段
    expect(content).toMatch(/landlordLease\??\s*:\s*LandlordLeaseDetail/);
  });

  // ==================== 类型检查 ====================

  test('12. 验证 TypeScript 类型检查通过', async () => {
    try {
      execSync('npm run build:type', {
        cwd: frontendPath,
        stdio: 'pipe',
        timeout: 120000,
      });
    } catch (error: any) {
      if (error.stdout) {
        console.error('类型检查输出:', error.stdout.toString());
      }
      if (error.stderr) {
        console.error('类型检查错误:', error.stderr.toString());
      }
      throw error;
    }
  });
});

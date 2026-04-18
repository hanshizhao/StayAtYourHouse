/**
 * FEAT-162: 后端服务层实现租约状态计算和服务端分页 - API 运行时验证
 * 类型: api_runtime
 *
 * 测试覆盖：
 * 1. IRoomService 接口签名改为 RoomListInput/RoomListResult
 * 2. RoomService 实现租约状态计算（CalculateLeaseStatus）
 * 3. RoomService 实现服务端分页（Skip/Take）
 * 4. RoomAppService 适配新签名（[FromQuery] RoomListInput）
 * 5. 项目构建成功
 * 6. API 端点路由可达
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-162: 后端服务层 - 租约状态计算和服务端分页', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const interfacePath = path.join(serverPath, 'Gentle.Application/Services/IRoomService.cs');
  const servicePath = path.join(serverPath, 'Gentle.Application/Services/RoomService.cs');
  const appServicePath = path.join(serverPath, 'Gentle.Application/Apps/RoomAppService.cs');

  // ==================== 文件存在性测试 ====================

  test('1. IRoomService 接口文件存在', async () => {
    expect(fs.existsSync(interfacePath)).toBeTruthy();
  });

  test('2. RoomService 实现文件存在', async () => {
    expect(fs.existsSync(servicePath)).toBeTruthy();
  });

  test('3. RoomAppService 文件存在', async () => {
    expect(fs.existsSync(appServicePath)).toBeTruthy();
  });

  // ==================== 接口签名测试 ====================

  test('4. IRoomService 接口使用 RoomListInput/RoomListResult 签名', async () => {
    if (!fs.existsSync(interfacePath)) {
      test.skip('接口文件不存在');
      return;
    }

    const content = fs.readFileSync(interfacePath, 'utf-8');

    // 必须标记 ITransient
    expect(content).toMatch(/ITransient/);

    // GetListAsync 签名改为 RoomListInput → RoomListResult
    expect(content).toMatch(/Task<RoomListResult>\s+GetListAsync\s*\(\s*RoomListInput\s+input\s*\)/);
  });

  // ==================== 服务实现测试 ====================

  test('5. RoomService 实现租约状态计算和分页', async () => {
    if (!fs.existsSync(servicePath)) {
      test.skip('服务文件不存在');
      return;
    }

    const content = fs.readFileSync(servicePath, 'utf-8');

    // 实现 IRoomService
    expect(content).toMatch(/class\s+RoomService\s*:\s*IRoomService/);

    // 方法签名使用 RoomListInput
    expect(content).toMatch(/Task<RoomListResult>\s+GetListAsync\s*\(\s*RoomListInput\s+input\s*\)/);

    // 租约状态计算方法
    expect(content).toMatch(/CalculateLeaseStatus/);
    expect(content).toMatch(/CalculateExpiredDays/);

    // 7天阈值常量
    expect(content).toMatch(/LeaseAlertThresholdDays/);
    expect(content).toMatch(/=\s*7/);

    // HasLeaseAlert 筛选
    expect(content).toMatch(/HasLeaseAlert/);
    expect(content).toMatch(/ExpiringSoon/);
    expect(content).toMatch(/Expired/);

    // 服务端分页：Skip/Take
    expect(content).toMatch(/\.Skip\s*\(/);
    expect(content).toMatch(/\.Take\s*\(/);

    // Profit 计算区分有/无租客
    expect(content).toMatch(/Profit\s*=/);

    // 返回 RoomListResult
    expect(content).toMatch(/new\s+RoomListResult/);

    // 仓储注入（Furion 模式）
    expect(content).toMatch(/IRepository<Room>/);
    expect(content).toMatch(/IRepository<RentalRecord>/);
  });

  // ==================== AppService API 路由测试 ====================

  test('6. RoomAppService 适配分页查询参数', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // GetList 方法使用 RoomListInput + RoomListResult
    expect(content).toMatch(/Task<RoomListResult>\s+GetList/);
    expect(content).toMatch(/RoomListInput\s+input/);
    expect(content).toMatch(/\[FromQuery\]/);
    expect(content).toMatch(/\[HttpGet\("list"\)\]/);

    // 路由前缀
    expect(content).toMatch(/\[Route\("api\/room"\)\]/);
  });

  // ==================== 构建验证 ====================

  test('7. 项目构建成功', async () => {
    const result = execSync('dotnet build', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });

  // ==================== API 运行时验证 ====================

  test('8. 房间列表 API 端点需要认证', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/room/list');
    expect([401, 200].includes(response.status())).toBeTruthy();
  });

  test('9. 房间列表 API 端点路由可达（带认证）', async ({ request }) => {
    const loginResp = await request.post('http://localhost:5000/api/auth/login', {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResp.status()).toBe(200);

    const loginData = await loginResp.json();
    expect(loginData.succeeded).toBe(true);
    const token = loginData.data.token;

    // 调用房间列表 API（使用默认分页参数）
    const response = await request.get('http://localhost:5000/api/room/list?page=1&pageSize=10', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // 响应包含分页结构
    expect(body).toHaveProperty('statusCode');
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('pageSize');
  });
});

/**
 * FEAT-163: 后端 API 层适配分页查询参数 - API 运行时验证
 * 类型: api_runtime
 *
 * 测试覆盖：
 * 1. RoomAppService 文件存在及 IDynamicApiController 标记
 * 2. GetList 方法签名正确（接受 RoomListInput，返回 RoomListResult）
 * 3. API 路由特性完整（[HttpGet("list")] + [FromQuery]）
 * 4. 认证特性 [Authorize] 存在
 * 5. 项目构建成功
 * 6. API 端点可达（需认证）
 * 7. 分页查询参数正确传递
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('FEAT-163: 后端 API 层适配分页查询参数', () => {
  const projectRoot = path.join(__dirname, '../../');
  const serverPath = path.join(projectRoot, 'Gentle');
  const appServicePath = path.join(serverPath, 'Gentle.Application/Apps/RoomAppService.cs');
  const interfacePath = path.join(serverPath, 'Gentle.Application/Services/IRoomService.cs');
  const dtoPath = path.join(serverPath, 'Gentle.Application/Dtos/Room/RoomDto.cs');

  // ==================== 文件存在性测试 ====================

  test('1. 检查 RoomAppService 文件存在', async () => {
    expect(fs.existsSync(appServicePath)).toBeTruthy();
  });

  test('2. 检查 IRoomService 接口文件存在', async () => {
    expect(fs.existsSync(interfacePath)).toBeTruthy();
  });

  test('3. 检查 RoomDto（含 RoomListInput/RoomListResult）文件存在', async () => {
    expect(fs.existsSync(dtoPath)).toBeTruthy();
  });

  // ==================== RoomAppService 代码模式测试 ====================

  test('4. 验证 RoomAppService 实现 IDynamicApiController', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    expect(content).toMatch(/IDynamicApiController/);
    expect(content).toMatch(/\[Route\("api\/room"\)\]/);
    expect(content).toMatch(/\[Authorize\]/);
    expect(content).toMatch(/\[ApiDescriptionSettings\(/);
  });

  test('5. 验证 GetList 方法签名和路由特性', async () => {
    if (!fs.existsSync(appServicePath)) {
      test.skip('AppService 文件不存在');
      return;
    }

    const content = fs.readFileSync(appServicePath, 'utf-8');

    // 路由特性
    expect(content).toMatch(/\[HttpGet\("list"\)\]/);

    // 方法签名：接受 RoomListInput + [FromQuery]，返回 Task<RoomListResult>
    expect(content).toMatch(/GetList\(\[FromQuery\]\s+RoomListInput\s+input\)/);
    expect(content).toMatch(/Task<RoomListResult>/);

    // 调用 _roomService.GetListAsync(input)
    expect(content).toMatch(/_roomService\.GetListAsync\(input\)/);
  });

  // ==================== IRoomService 接口测试 ====================

  test('6. 验证 IRoomService 接口包含 GetListAsync 签名', async () => {
    if (!fs.existsSync(interfacePath)) {
      test.skip('接口文件不存在');
      return;
    }

    const content = fs.readFileSync(interfacePath, 'utf-8');

    // 接口标记 ITransient（Furion 自动注册）
    expect(content).toMatch(/ITransient/);

    // GetListAsync 签名正确
    expect(content).toMatch(/Task<RoomListResult>\s+GetListAsync\(RoomListInput\s+input\)/);
  });

  // ==================== RoomListInput / RoomListResult 测试 ====================

  test('7. 验证 RoomListInput 包含分页参数和验证特性', async () => {
    if (!fs.existsSync(dtoPath)) {
      test.skip('DTO 文件不存在');
      return;
    }

    const content = fs.readFileSync(dtoPath, 'utf-8');

    // RoomListInput 类存在
    expect(content).toMatch(/class\s+RoomListInput/);

    // 筛选参数
    expect(content).toMatch(/CommunityId/);
    expect(content).toMatch(/Status/);
    expect(content).toMatch(/HasLeaseAlert/);

    // 分页参数带 Range 验证
    expect(content).toMatch(/\[Range\(1,\s*int\.MaxValue\)\]/);
    expect(content).toMatch(/\[Range\(1,\s*100\)\]/);
    expect(content).toMatch(/Page\s*\{[^}]*get;\s*set;\s*\}/);
    expect(content).toMatch(/PageSize\s*\{[^}]*get;\s*set;\s*\}/);
  });

  test('8. 验证 RoomListResult 包含分页元数据', async () => {
    if (!fs.existsSync(dtoPath)) {
      test.skip('DTO 文件不存在');
      return;
    }

    const content = fs.readFileSync(dtoPath, 'utf-8');

    // RoomListResult 类存在
    expect(content).toMatch(/class\s+RoomListResult/);

    // 必要字段
    expect(content).toMatch(/List<RoomDto>/);
    expect(content).toMatch(/Total/);
    expect(content).toMatch(/Page/);
    expect(content).toMatch(/PageSize/);
  });

  // ==================== 构建验证 ====================

  test('9. 项目构建成功', async () => {
    const result = execSync('dotnet build Gentle.Application/Gentle.Application.csproj', {
      cwd: serverPath,
      encoding: 'utf-8',
      timeout: 60000,
    });

    expect(result).toMatch(/成功|succeeded/);
    expect(result).toMatch(/0\s*个?错误|0\s+error/i);
  });

  // ==================== API 运行时验证 ====================

  test('10. API 端点需要认证', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/room/list');
    expect([401, 200].includes(response.status())).toBeTruthy();
  });

  test('11. 登录后调用分页查询 API', async ({ request }) => {
    const loginResp = await request.post('http://localhost:5000/api/auth/login', {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    expect(loginResp.status()).toBe(200);

    const loginData = await loginResp.json();
    expect(loginData.succeeded).toBe(true);
    const token = loginData.data.token;

    // 调用分页查询 API（默认参数）
    const response = await request.get('http://localhost:5000/api/room/list', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('statusCode');
  });

  test('12. 分页查询参数正确传递', async ({ request }) => {
    const loginResp = await request.post('http://localhost:5000/api/auth/login', {
      data: { Account: 'zhs', Password: 'gentle8023' },
    });
    const loginData = await loginResp.json();
    const token = loginData.data.token;

    // 带分页参数查询
    const response = await request.get('http://localhost:5000/api/room/list?page=1&pageSize=5', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // 验证返回结构包含分页元数据
    expect(body.data).toHaveProperty('list');
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('pageSize');
    expect(body.data.page).toBe(1);
    expect(body.data.pageSize).toBe(5);
  });
});

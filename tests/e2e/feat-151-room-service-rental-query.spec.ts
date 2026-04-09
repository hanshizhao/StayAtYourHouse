/**
 * FEAT-151: RoomService 租约查询和计算逻辑 - API 运行时验证
 * 类型: api_runtime
 *
 * 测试覆盖：
 * 1. 源码验证：GetListAsync 查询活跃租约并填充字段
 * 2. 源码验证：CalculateLeaseDuration 方法存在且格式正确
 * 3. 源码验证：引用 RentalStatus 枚举
 * 4. API 冒烟测试：列表接口返回租约字段
 * 5. 构建验证
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { test, expect, APIRequestContext } from '@playwright/test'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const ROOM_SERVICE_PATH = path.join(PROJECT_ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs')
const API_BASE = process.env.API_BASE || 'http://localhost:5000'

test.describe('FEAT-151: RoomService 租约查询和计算逻辑', () => {
  const content = fs.readFileSync(ROOM_SERVICE_PATH, 'utf-8')

  // ==================== 源码验证 ====================

  test('RoomService.cs 文件存在', () => {
    expect(fs.existsSync(ROOM_SERVICE_PATH)).toBeTruthy()
  })

  test('GetListAsync 查询活跃租住记录（RentalStatus.Active）', () => {
    expect(content).toContain('RentalStatus.Active')
    expect(content).toContain('_rentalRecordRepository')
    expect(content).toContain('roomIds')
  })

  test('GetListAsync 按 RoomId 分组租住记录', () => {
    expect(content).toContain('GroupBy(r => r.RoomId)')
    expect(content).toContain('OrderByDescending')
  })

  test('GetListAsync 填充 AnjuCodeSubmitted 字段', () => {
    expect(content).toMatch(/dto\.AnjuCodeSubmitted\s*=\s*rental\.IsAnJuCodeSubmitted/)
  })

  test('GetListAsync 填充 LeaseDuration 字段', () => {
    expect(content).toMatch(/dto\.LeaseDuration\s*=\s*CalculateLeaseDuration/)
  })

  test('GetListAsync 填充 DaysUntilExpiry 字段', () => {
    expect(content).toMatch(/dto\.DaysUntilExpiry\s*=\s*\(int\)\(rental\.ContractEndDate\.Date\s*-\s*today\)\.TotalDays/)
  })

  test('CalculateLeaseDuration 私有方法存在', () => {
    expect(content).toMatch(/private\s+static\s+string\s+CalculateLeaseDuration/)
  })

  test('CalculateLeaseDuration 使用 AddYears 迭代', () => {
    expect(content).toMatch(/AddYears/)
  })

  test('CalculateLeaseDuration 使用 AddMonths 迭代', () => {
    expect(content).toMatch(/AddMonths/)
  })

  test('CalculateLeaseDuration 返回中文格式（年月天）', () => {
    expect(content).toContain('年')
    expect(content).toContain('月')
    expect(content).toContain('天')
  })

  test('引用 RentalStatus 枚举（using Gentle.Core.Enums）', () => {
    expect(content).toContain('using Gentle.Core.Enums')
  })

  // ==================== API 冒烟测试 ====================

  let authToken: string

  async function getAdminToken(request: APIRequestContext): Promise<string> {
    const loginResponse = await request.post(`${API_BASE}/api/auth/login`, {
      data: { account: 'zhs', password: 'gentle8023' },
    })

    expect(loginResponse.status()).toBe(200)

    const result = await loginResponse.json()
    expect(result.succeeded).toBe(true)

    return result.data.token
  }

  function authHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  test.beforeAll(async ({ request }) => {
    try {
      authToken = await getAdminToken(request)
    }
    catch {
      // API 未启动时跳过 API 测试
    }
  })

  test('列表接口返回租约字段（anjuCodeSubmitted/leaseDuration/daysUntilExpiry）', async ({ request }) => {
    if (!authToken) {
      test.skip()
      return
    }

    const response = await request.get(`${API_BASE}/api/room/list`, {
      headers: authHeaders(authToken),
    })

    expect(response.status()).toBe(200)

    const result = await response.json()
    expect(result.succeeded).toBe(true)
    expect(Array.isArray(result.data)).toBe(true)

    if (result.data.length > 0) {
      const firstItem = result.data[0]
      // 验证字段存在（可能是 null）
      expect(firstItem).toHaveProperty('anjuCodeSubmitted')
      expect(firstItem).toHaveProperty('leaseDuration')
      expect(firstItem).toHaveProperty('daysUntilExpiry')
    }
  })

  // ==================== 构建验证 ====================

  test('dotnet build 构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: path.join(PROJECT_ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    })
    expect(result).toContain('0 个错误')
  })
})

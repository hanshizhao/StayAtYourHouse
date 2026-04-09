/**
 * FEAT-154: 房间列表租约信息 - E2E 集成验证
 * 类型: e2e（集成）
 *
 * 验收标准：
 * 1. RoomDto 包含 3 个租约字段
 * 2. RoomService 包含租约查询和计算逻辑
 * 3. roomModel.ts 包含 3 个租约字段
 * 4. room/index.vue 包含 3 列和 slot
 * 5. 后端 dotnet build 成功
 * 6. 前端 npm run build:type 无类型错误
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const ROOM_DTO_PATH = path.join(PROJECT_ROOT, 'Gentle/Gentle.Application/Dtos/Room/RoomDto.cs')
const ROOM_SERVICE_PATH = path.join(PROJECT_ROOT, 'Gentle/Gentle.Application/Services/RoomService.cs')
const ROOM_MODEL_PATH = path.join(PROJECT_ROOT, 'Hans/src/api/model/roomModel.ts')
const ROOM_INDEX_PATH = path.join(PROJECT_ROOT, 'Hans/src/pages/housing/room/index.vue')

test.describe('FEAT-154: 房间列表租约信息集成验证', () => {
  // 缓存文件读取，避免重复 I/O
  const roomDtoContent = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
  const roomServiceContent = fs.readFileSync(ROOM_SERVICE_PATH, 'utf-8')
  const roomModelContent = fs.readFileSync(ROOM_MODEL_PATH, 'utf-8')
  const roomIndexContent = fs.readFileSync(ROOM_INDEX_PATH, 'utf-8')

  // ==================== 1. 后端 RoomDto 字段验证 ====================

  test('RoomDto 包含 AnjuCodeSubmitted (bool?) 属性', () => {
    expect(roomDtoContent).toMatch(/bool\?\s+AnjuCodeSubmitted\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 LeaseDuration (string?) 属性', () => {
    expect(roomDtoContent).toMatch(/string\?\s+LeaseDuration\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 DaysUntilExpiry (int?) 属性', () => {
    expect(roomDtoContent).toMatch(/int\?\s+DaysUntilExpiry\s*\{[^}]*\}/)
  })

  // ==================== 2. 后端 RoomService 逻辑验证 ====================

  test('RoomService 查询活跃租约（RentalStatus.Active）', () => {
    expect(roomServiceContent).toContain('RentalStatus.Active')
  })

  test('RoomService 按 RoomId 分组并填充字段', () => {
    expect(roomServiceContent).toContain('GroupBy(r => r.RoomId)')
    expect(roomServiceContent).toMatch(/dto\.AnjuCodeSubmitted\s*=\s*rental\.IsAnJuCodeSubmitted/)
    expect(roomServiceContent).toMatch(/dto\.LeaseDuration\s*=\s*CalculateLeaseDuration/)
    expect(roomServiceContent).toMatch(/dto\.DaysUntilExpiry/)
  })

  test('RoomService 包含 CalculateLeaseDuration 方法', () => {
    expect(roomServiceContent).toMatch(/private\s+static\s+string\s+CalculateLeaseDuration/)
    expect(roomServiceContent).toContain('年')
    expect(roomServiceContent).toContain('月')
    expect(roomServiceContent).toContain('天')
  })

  // ==================== 3. 前端 TypeScript 类型验证 ====================

  test('RoomItem 接口包含 anjuCodeSubmitted 字段', () => {
    expect(roomModelContent).toMatch(/anjuCodeSubmitted\??\s*:\s*(boolean\s*\|\s*null|boolean)/)
  })

  test('RoomItem 接口包含 leaseDuration 字段', () => {
    expect(roomModelContent).toMatch(/leaseDuration\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 daysUntilExpiry 字段', () => {
    expect(roomModelContent).toMatch(/daysUntilExpiry\??\s*:\s*(number\s*\|\s*null|number)/)
  })

  // ==================== 4. 前端列表页列和 slot 验证 ====================

  test('columns 数组包含安居码列（anjuCodeSubmitted）', () => {
    expect(roomIndexContent).toMatch(/colKey:\s*['"]anjuCodeSubmitted['"]/)
    expect(roomIndexContent).toMatch(/title:\s*['"]安居码['"]/)
  })

  test('columns 数组包含已租时长列（leaseDuration）', () => {
    expect(roomIndexContent).toMatch(/colKey:\s*['"]leaseDuration['"]/)
    expect(roomIndexContent).toMatch(/title:\s*['"]已租时长['"]/)
  })

  test('columns 数组包含到期天数列（daysUntilExpiry）', () => {
    expect(roomIndexContent).toMatch(/colKey:\s*['"]daysUntilExpiry['"]/)
    expect(roomIndexContent).toMatch(/title:\s*['"]到期天数['"]/)
  })

  test('template 包含 anjuCodeSubmitted slot（t-tag 渲染）', () => {
    expect(roomIndexContent).toMatch(/#anjuCodeSubmitted/)
    expect(roomIndexContent).toMatch(/row\.anjuCodeSubmitted/)
    expect(roomIndexContent).toMatch(/theme="success"/)
    expect(roomIndexContent).toMatch(/theme="danger"/)
  })

  test('template 包含 leaseDuration slot', () => {
    expect(roomIndexContent).toMatch(/#leaseDuration/)
    expect(roomIndexContent).toMatch(/row\.leaseDuration/)
  })

  test('template 包含 daysUntilExpiry slot（含样式类）', () => {
    expect(roomIndexContent).toMatch(/#daysUntilExpiry/)
    expect(roomIndexContent).toMatch(/row\.daysUntilExpiry/)
    expect(roomIndexContent).toMatch(/getExpiryClass/)
  })

  // ==================== 5. 构建验证 ====================

  test('后端 dotnet build 成功', () => {
    const result = execSync('dotnet build', {
      cwd: path.join(PROJECT_ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    })
    expect(result).toContain('0 个错误')
  })

  test('前端 npm run build:type 无类型错误', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(PROJECT_ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 120_000,
    })
    // build:type 成功即表示无类型错误
    expect(result).toBeDefined()
  })
})

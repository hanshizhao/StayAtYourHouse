/**
 * FEAT-154: 房间列表租约信息 - E2E 集成验证（已更新匹配 FEAT-155~158 重设计）
 *
 * 验收标准：
 * 1. 后端 RoomDto 包含新租约字段（TenantName/RentalStartDate/RentalEndDate），不含旧字段
 * 2. 后端 RoomService 包含 Renter Include 和新字段映射，不含 CalculateLeaseDuration
 * 3. 前端 roomModel.ts 包含新字段，不含旧字段
 * 4. 前端 room/index.vue 使用展开行展示租客信息，不含旧列和旧函数
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

test.describe('FEAT-154: 房间列表租约信息集成验证（重设计后）', () => {
  const roomDtoContent = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
  const roomServiceContent = fs.readFileSync(ROOM_SERVICE_PATH, 'utf-8')
  const roomModelContent = fs.readFileSync(ROOM_MODEL_PATH, 'utf-8')
  const roomIndexContent = fs.readFileSync(ROOM_INDEX_PATH, 'utf-8')

  // ==================== 1. 后端 RoomDto 字段验证 ====================

  test('RoomDto 包含 AnjuCodeSubmitted (bool?) 属性', () => {
    expect(roomDtoContent).toMatch(/bool\?\s+AnjuCodeSubmitted\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 TenantName (string?) 属性', () => {
    expect(roomDtoContent).toMatch(/string\?\s+TenantName\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 RentalStartDate (DateTime?) 属性', () => {
    expect(roomDtoContent).toMatch(/DateTime\?\s+RentalStartDate\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 RentalEndDate (DateTime?) 属性', () => {
    expect(roomDtoContent).toMatch(/DateTime\?\s+RentalEndDate\s*\{[^}]*\}/)
  })

  test('RoomDto 不包含旧字段 LeaseDuration', () => {
    expect(roomDtoContent).not.toMatch(/LeaseDuration/)
  })

  test('RoomDto 不包含旧字段 DaysUntilExpiry', () => {
    expect(roomDtoContent).not.toMatch(/DaysUntilExpiry/)
  })

  // ==================== 2. 后端 RoomService 逻辑验证 ====================

  test('RoomService 查询活跃租约并 Include Renter', () => {
    expect(roomServiceContent).toContain('RentalStatus.Active')
    expect(roomServiceContent).toMatch(/\.Include\(r\s*=>\s*r\.Renter\)/)
  })

  test('RoomService 按 RoomId 分组并填充新字段', () => {
    expect(roomServiceContent).toContain('GroupBy(r => r.RoomId)')
    expect(roomServiceContent).toMatch(/dto\.AnjuCodeSubmitted\s*=\s*rental\.IsAnJuCodeSubmitted/)
    expect(roomServiceContent).toMatch(/dto\.TenantName\s*=\s*rental\.Renter\?\.Name/)
    expect(roomServiceContent).toMatch(/dto\.RentalStartDate\s*=\s*rental\.CheckInDate/)
    expect(roomServiceContent).toMatch(/dto\.RentalEndDate\s*=\s*rental\.ContractEndDate/)
  })

  test('RoomService 不包含旧映射字段 LeaseDuration/DaysUntilExpiry', () => {
    expect(roomServiceContent).not.toMatch(/dto\.LeaseDuration/)
    expect(roomServiceContent).not.toMatch(/dto\.DaysUntilExpiry/)
  })

  test('RoomService 不包含 CalculateLeaseDuration 方法', () => {
    expect(roomServiceContent).not.toMatch(/CalculateLeaseDuration/)
  })

  // ==================== 3. 前端 TypeScript 类型验证 ====================

  test('RoomItem 接口包含 anjuCodeSubmitted 字段', () => {
    expect(roomModelContent).toMatch(/anjuCodeSubmitted\??\s*:\s*(boolean\s*\|\s*null|boolean)/)
  })

  test('RoomItem 接口包含 tenantName 字段', () => {
    expect(roomModelContent).toMatch(/tenantName\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 rentalStartDate 字段', () => {
    expect(roomModelContent).toMatch(/rentalStartDate\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 rentalEndDate 字段', () => {
    expect(roomModelContent).toMatch(/rentalEndDate\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口不包含旧字段 leaseDuration', () => {
    expect(roomModelContent).not.toMatch(/leaseDuration/)
  })

  test('RoomItem 接口不包含旧字段 daysUntilExpiry', () => {
    expect(roomModelContent).not.toMatch(/daysUntilExpiry/)
  })

  // ==================== 4. 前端列表页展开行验证 ====================

  test('columns 数组不含旧列（anjuCodeSubmitted/leaseDuration/daysUntilExpiry）', () => {
    expect(roomIndexContent).not.toMatch(/colKey:\s*['"]anjuCodeSubmitted['"]/)
    expect(roomIndexContent).not.toMatch(/colKey:\s*['"]leaseDuration['"]/)
    expect(roomIndexContent).not.toMatch(/colKey:\s*['"]daysUntilExpiry['"]/)
  })

  test('t-table 包含展开行属性和事件', () => {
    expect(roomIndexContent).toMatch(/:expanded-row-keys="expandedRowKeys"/)
    expect(roomIndexContent).toMatch(/@expand-change="handleExpandChange"/)
  })

  test('template 包含 #expandedRow 模板展示租客信息', () => {
    expect(roomIndexContent).toMatch(/#expandedRow/)
    expect(roomIndexContent).toMatch(/row\.tenantName/)
    expect(roomIndexContent).toMatch(/row\.rentalStartDate/)
    expect(roomIndexContent).toMatch(/row\.rentalEndDate/)
    expect(roomIndexContent).toMatch(/row\.anjuCodeSubmitted/)
  })

  test('展开行模板包含空状态提示', () => {
    expect(roomIndexContent).toMatch(/暂无租客信息/)
  })

  test('getExpiryClass 函数已移除', () => {
    expect(roomIndexContent).not.toMatch(/getExpiryClass/)
  })

  test('过期 CSS 类已移除', () => {
    expect(roomIndexContent).not.toMatch(/expiry-positive/)
    expect(roomIndexContent).not.toMatch(/expiry-zero/)
    expect(roomIndexContent).not.toMatch(/expiry-negative/)
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
    expect(result).toBeDefined()
  })
})

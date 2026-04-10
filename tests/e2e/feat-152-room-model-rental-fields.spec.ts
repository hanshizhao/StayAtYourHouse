/**
 * FEAT-152: 前端 TypeScript 类型租约字段（已更新匹配 FEAT-155/157 重设计）
 *
 * 验证 RoomItem 接口包含展开行所需的租约字段：
 * - anjuCodeSubmitted (boolean | null)
 * - tenantName (string | null)
 * - rentalStartDate (string | null)
 * - rentalEndDate (string | null)
 */
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const ROOT = path.resolve(__dirname, '../..')
const ROOM_MODEL_FILE = path.join(ROOT, 'Hans/src/api/model/roomModel.ts')

describe('FEAT-152: 前端 TypeScript 类型租约字段', () => {
  const content = fs.readFileSync(ROOM_MODEL_FILE, 'utf-8')

  test('roomModel.ts 文件存在', () => {
    expect(fs.existsSync(ROOM_MODEL_FILE)).toBeTruthy()
  })

  test('RoomItem 接口包含 anjuCodeSubmitted 字段', () => {
    expect(content).toMatch(/anjuCodeSubmitted\??\s*:\s*(boolean\s*\|\s*null|boolean)/)
  })

  test('RoomItem 接口包含 tenantName 字段', () => {
    expect(content).toMatch(/tenantName\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 rentalStartDate 字段', () => {
    expect(content).toMatch(/rentalStartDate\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 rentalEndDate 字段', () => {
    expect(content).toMatch(/rentalEndDate\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口不包含旧字段 leaseDuration', () => {
    expect(content).not.toMatch(/leaseDuration/)
  })

  test('RoomItem 接口不包含旧字段 daysUntilExpiry', () => {
    expect(content).not.toMatch(/daysUntilExpiry/)
  })

  test('前端 TypeScript 类型检查通过', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 60000,
    })
    expect(result).toBeDefined()
  })
})

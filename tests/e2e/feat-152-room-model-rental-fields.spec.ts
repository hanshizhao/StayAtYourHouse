import { expect, test, describe } from '@playwright/test'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')
const ROOM_MODEL_FILE = path.join(ROOT, 'Hans/src/api/model/roomModel.ts')

describe('FEAT-152: 前端 TypeScript 类型新增租约字段', () => {
  const content = fs.readFileSync(ROOM_MODEL_FILE, 'utf-8')

  test('roomModel.ts 文件存在', () => {
    expect(fs.existsSync(ROOM_MODEL_FILE)).toBeTruthy()
  })

  test('RoomItem 接口包含 anjuCodeSubmitted 字段', () => {
    expect(content).toMatch(/anjuCodeSubmitted\??\s*:\s*(boolean\s*\|\s*null|boolean)/)
  })

  test('RoomItem 接口包含 leaseDuration 字段', () => {
    expect(content).toMatch(/leaseDuration\??\s*:\s*(string\s*\|\s*null|string)/)
  })

  test('RoomItem 接口包含 daysUntilExpiry 字段', () => {
    expect(content).toMatch(/daysUntilExpiry\??\s*:\s*(number\s*\|\s*null|number)/)
  })

  test('前端 TypeScript 类型检查通过', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 60000,
    });
    expect(result).toBeDefined();
  });
});

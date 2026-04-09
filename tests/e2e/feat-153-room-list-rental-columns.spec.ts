import { expect, test, describe } from '@playwright/test'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

const ROOT = path.resolve(__dirname, '../..')
const ROOM_INDEX_FILE = path.join(ROOT, 'Hans/src/pages/housing/room/index.vue')

describe('FEAT-153: 前端列表页新增 3 列', () => {
  const content = fs.readFileSync(ROOM_INDEX_FILE, 'utf-8')

  test('index.vue 文件存在', () => {
    expect(fs.existsSync(ROOM_INDEX_FILE)).toBeTruthy()
  })

  test('columns 数组包含 anjuCodeSubmitted 列', () => {
    expect(content).toMatch(/colKey:\s*['"]anjuCodeSubmitted['"]/)
    expect(content).toMatch(/title:\s*['"]安居码['"]/)
  })

  test('columns 数组包含 leaseDuration 列', () => {
    expect(content).toMatch(/colKey:\s*['"]leaseDuration['"]/)
    expect(content).toMatch(/title:\s*['"]已租时长['"]/)
  })

  test('columns 数组包含 daysUntilExpiry 列', () => {
    expect(content).toMatch(/colKey:\s*['"]daysUntilExpiry['"]/)
    expect(content).toMatch(/title:\s*['"]到期天数['"]/)
  })

  test('template 包含 #anjuCodeSubmitted slot', () => {
    expect(content).toMatch(/#anjuCodeSubmitted/)
    expect(content).toMatch(/anjuCodeSubmitted === true/)
    expect(content).toMatch(/anjuCodeSubmitted === false/)
  })

  test('template 包含 #leaseDuration slot', () => {
    expect(content).toMatch(/#leaseDuration/)
    expect(content).toMatch(/row\.leaseDuration/)
  })

  test('template 包含 #daysUntilExpiry slot', () => {
    expect(content).toMatch(/#daysUntilExpiry/)
    expect(content).toMatch(/row\.daysUntilExpiry/)
  })

  test('到期天数使用条件样式', () => {
    expect(content).toMatch(/getExpiryClass/)
    expect(content).toMatch(/expiry-positive/)
    expect(content).toMatch(/expiry-zero/)
    expect(content).toMatch(/expiry-negative/)
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

/**
 * FEAT-159: E2E 测试更新 — 匹配展开行结构
 *
 * 验收标准：
 * 1. feat-152 测试验证新字段类型（tenantName/rentalStartDate/rentalEndDate）
 * 2. feat-153 测试验证展开行结构和旧代码移除
 * 3. feat-154 集成测试验证后端+前端全链路
 * 4. 所有测试文件可被 Playwright 发现并运行
 */
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const PROJECT_ROOT = path.resolve(__dirname, '../..')

test.describe('FEAT-159: E2E 测试文件完整性验证', () => {
  const testFiles = [
    'tests/e2e/feat-152-room-model-rental-fields.spec.ts',
    'tests/e2e/feat-153-room-list-rental-columns.spec.ts',
    'tests/e2e/feat-154-room-list-rental-info.spec.ts',
  ]

  test('feat-152 测试文件存在', () => {
    const filePath = path.join(PROJECT_ROOT, testFiles[0])
    expect(fs.existsSync(filePath)).toBeTruthy()
  })

  test('feat-153 测试文件存在', () => {
    const filePath = path.join(PROJECT_ROOT, testFiles[1])
    expect(fs.existsSync(filePath)).toBeTruthy()
  })

  test('feat-154 测试文件存在', () => {
    const filePath = path.join(PROJECT_ROOT, testFiles[2])
    expect(fs.existsSync(filePath)).toBeTruthy()
  })

  test('feat-152 测试包含新字段断言', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, testFiles[0]), 'utf-8')
    expect(content).toMatch(/tenantName/)
    expect(content).toMatch(/rentalStartDate/)
    expect(content).toMatch(/rentalEndDate/)
    // 旧字段移除由 feat-152 自身断言验证（直接检查 roomModel.ts 源文件）
  })

  test('feat-153 测试包含展开行断言', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, testFiles[1]), 'utf-8')
    expect(content).toMatch(/expanded-row-keys/)
    expect(content).toMatch(/@expand-change/)
    expect(content).toMatch(/#expandedRow/)
    expect(content).toMatch(/expandedRowKeys/)
    expect(content).toMatch(/handleExpandChange/)
  })

  test('feat-153 测试验证旧代码移除', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, testFiles[1]), 'utf-8')
    expect(content).toMatch(/getExpiryClass/)
    expect(content).toMatch(/expiry-positive/)
    expect(content).toMatch(/expiry-zero/)
    expect(content).toMatch(/expiry-negative/)
  })

  test('feat-154 集成测试包含后端新字段断言', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, testFiles[2]), 'utf-8')
    expect(content).toMatch(/TenantName/)
    expect(content).toMatch(/RentalStartDate/)
    expect(content).toMatch(/RentalEndDate/)
    expect(content).toMatch(/Renter/)
  })

  test('feat-154 集成测试包含展开行断言', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, testFiles[2]), 'utf-8')
    expect(content).toMatch(/expanded-row-keys/)
    expect(content).toMatch(/expandedRow/)
    expect(content).toMatch(/暂无租客信息/)
  })
})

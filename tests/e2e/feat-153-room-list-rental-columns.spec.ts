/**
 * FEAT-153: 前端列表页展开行结构验证（已更新匹配 FEAT-158 重设计）
 *
 * 验证：
 * - 旧列（anjuCodeSubmitted/leaseDuration/daysUntilExpiry）已从 columns 移除
 * - 旧模板槽和 getExpiryClass 已移除
 * - t-table 包含 expanded-row-keys 属性和 @expand-change 事件
 * - 存在 #expandedRow 展开行模板
 * - 存在 expandedRowKeys ref 和 handleExpandChange 函数
 */
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const ROOT = path.resolve(__dirname, '../..')
const ROOM_INDEX_FILE = path.join(ROOT, 'Hans/src/pages/housing/room/index.vue')

describe('FEAT-153: 前端列表页展开行结构验证', () => {
  const content = fs.readFileSync(ROOM_INDEX_FILE, 'utf-8')

  test('index.vue 文件存在', () => {
    expect(fs.existsSync(ROOM_INDEX_FILE)).toBeTruthy()
  })

  // ==================== 旧列已移除 ====================

  test('columns 数组不包含 anjuCodeSubmitted 列', () => {
    expect(content).not.toMatch(/colKey:\s*['"]anjuCodeSubmitted['"]/)
  })

  test('columns 数组不包含 leaseDuration 列', () => {
    expect(content).not.toMatch(/colKey:\s*['"]leaseDuration['"]/)
  })

  test('columns 数组不包含 daysUntilExpiry 列', () => {
    expect(content).not.toMatch(/colKey:\s*['"]daysUntilExpiry['"]/)
  })

  // ==================== 旧模板槽已移除 ====================

  test('template 不包含 #leaseDuration slot', () => {
    expect(content).not.toMatch(/#leaseDuration/)
  })

  test('template 不包含 #daysUntilExpiry slot', () => {
    expect(content).not.toMatch(/#daysUntilExpiry/)
  })

  // ==================== getExpiryClass 已移除 ====================

  test('getExpiryClass 函数已移除', () => {
    expect(content).not.toMatch(/getExpiryClass/)
  })

  test('过期 CSS 类已移除（expiry-positive/zero/negative）', () => {
    expect(content).not.toMatch(/expiry-positive/)
    expect(content).not.toMatch(/expiry-zero/)
    expect(content).not.toMatch(/expiry-negative/)
  })

  // ==================== 展开行属性 ====================

  test('t-table 包含 expanded-row-keys 属性', () => {
    expect(content).toMatch(/:expanded-row-keys="expandedRowKeys"/)
  })

  test('t-table 包含 @expand-change 事件', () => {
    expect(content).toMatch(/@expand-change="handleExpandChange"/)
  })

  // ==================== 展开行模板 ====================

  test('template 包含 #expandedRow 模板', () => {
    expect(content).toMatch(/#expandedRow/)
  })

  test('展开行模板包含 tenantName 条件渲染', () => {
    expect(content).toMatch(/row\.tenantName/)
  })

  test('展开行模板包含 rentalStartDate 和 rentalEndDate', () => {
    expect(content).toMatch(/row\.rentalStartDate/)
    expect(content).toMatch(/row\.rentalEndDate/)
  })

  test('展开行模板包含 anjuCodeSubmitted 渲染', () => {
    expect(content).toMatch(/row\.anjuCodeSubmitted/)
  })

  test('展开行模板包含空状态（暂无租客信息）', () => {
    expect(content).toMatch(/暂无租客信息/)
  })

  // ==================== Script 逻辑 ====================

  test('存在 expandedRowKeys ref', () => {
    expect(content).toMatch(/const expandedRowKeys\s*=\s*ref/)
  })

  test('存在 handleExpandChange 函数', () => {
    expect(content).toMatch(/function\s+handleExpandChange/)
  })

  test('handlePageChange 中重置展开状态', () => {
    expect(content).toMatch(/expandedRowKeys\.value\s*=\s*\[\]/)
  })

  // ==================== 展开行样式 ====================

  test('存在展开行样式类', () => {
    expect(content).toMatch(/\.expanded-row/)
    expect(content).toMatch(/\.expanded-item/)
    expect(content).toMatch(/\.expanded-label/)
    expect(content).toMatch(/\.expanded-value/)
    expect(content).toMatch(/\.expanded-row-empty/)
  })

  // ==================== 构建验证 ====================

  test('前端 TypeScript 类型检查通过', () => {
    const result = execSync('npm run build:type', {
      cwd: path.join(ROOT, 'Hans'),
      encoding: 'utf-8',
      timeout: 60000,
    })
    expect(result).toBeDefined()
  })
})

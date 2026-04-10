import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '../..')
const DTO_PATH = path.join(ROOT, 'Gentle/Gentle.Application/Dtos/Room/RoomDto.cs')

describe('FEAT-155: RoomDto 字段调整', () => {
  it('RoomDto.cs 文件存在', () => {
    expect(fs.existsSync(DTO_PATH)).toBeTruthy()
  })

  it('已删除 LeaseDuration 字段', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).not.toContain('LeaseDuration')
    expect(content).not.toContain('已租时长')
  })

  it('已删除 DaysUntilExpiry 字段', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).not.toContain('DaysUntilExpiry')
    expect(content).not.toContain('到期天数')
  })

  it('已新增 TenantName 字段 (string?)', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).toMatch(/string\?\s+TenantName/)
    expect(content).toContain('租客姓名')
  })

  it('已新增 RentalStartDate 字段 (DateTime?)', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).toMatch(/DateTime\?\s+RentalStartDate/)
    expect(content).toContain('租赁开始日期')
  })

  it('已新增 RentalEndDate 字段 (DateTime?)', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).toMatch(/DateTime\?\s+RentalEndDate/)
    expect(content).toContain('租赁结束日期')
  })

  it('RoomDto 新增字段属性声明完整', () => {
    const content = fs.readFileSync(DTO_PATH, 'utf-8')
    expect(content).toContain('public class RoomDto')
    expect(content).toContain('public string? TenantName { get; set; }')
    expect(content).toContain('public DateTime? RentalStartDate { get; set; }')
    expect(content).toContain('public DateTime? RentalEndDate { get; set; }')
  })
})

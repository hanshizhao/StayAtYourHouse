import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const ROOM_DTO_PATH = path.join(PROJECT_ROOT, 'Gentle/Gentle.Application/Dtos/Room/RoomDto.cs')

describe('FEAT-150: RoomDto 新增租约字段', () => {
  test('RoomDto.cs 文件存在', () => {
    expect(fs.existsSync(ROOM_DTO_PATH)).toBeTruthy()
  })

  test('RoomDto 包含 AnjuCodeSubmitted 属性', () => {
    const content = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
    expect(content).toMatch(/bool\?\s+AnjuCodeSubmitted\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 LeaseDuration 属性', () => {
    const content = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
    expect(content).toMatch(/string\?\s+LeaseDuration\s*\{[^}]*\}/)
  })

  test('RoomDto 包含 DaysUntilExpiry 属性', () => {
    const content = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
    expect(content).toMatch(/int\?\s+DaysUntilExpiry\s*\{[^}]*\}/)
  })

  test('租约字段位于 Status 属性之后', () => {
    const content = fs.readFileSync(ROOM_DTO_PATH, 'utf-8')
    const statusIndex = content.indexOf('public RoomStatus Status')
    const anjuIndex = content.indexOf('public bool? AnjuCodeSubmitted')
    const leaseIndex = content.indexOf('public string? LeaseDuration')
    const daysIndex = content.indexOf('public int? DaysUntilExpiry')

    expect(statusIndex).toBeGreaterThan(0)
    expect(anjuIndex).toBeGreaterThan(statusIndex)
    expect(leaseIndex).toBeGreaterThan(statusIndex)
    expect(daysIndex).toBeGreaterThan(statusIndex)
  })

  test('dotnet build 构建成功', () => {
    const result = execSync('dotnet build', {
      cwd: path.join(PROJECT_ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    })
    expect(result).toContain('0 个错误')
  })
})

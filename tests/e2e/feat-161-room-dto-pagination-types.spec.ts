import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const ROOT = path.resolve(__dirname, '..', '..')

test('RoomDto 文件包含 5 个新字段', () => {
  const dtoPath = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos', 'Room', 'RoomDto.cs')
  expect(fs.existsSync(dtoPath)).toBeTruthy()

  const content = fs.readFileSync(dtoPath, 'utf-8')

  expect(content).toContain('LandlordLeaseStatus')
  expect(content).toContain('LandlordLeaseExpiredDays')
  expect(content).toContain('TenantLeaseStatus')
  expect(content).toContain('TenantLeaseExpiredDays')
  expect(content).toContain('TenantMonthlyRent')
})

test('RoomListInput 类存在且包含必要属性', () => {
  const dtoPath = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos', 'Room', 'RoomDto.cs')
  const content = fs.readFileSync(dtoPath, 'utf-8')

  expect(content).toContain('class RoomListInput')
  expect(content).toContain('CommunityId')
  expect(content).toContain('Status')
  expect(content).toContain('HasLeaseAlert')
  expect(content).toContain('Page')
  expect(content).toContain('PageSize')
})

test('RoomListResult 类存在且包含 List 和 Total', () => {
  const dtoPath = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos', 'Room', 'RoomDto.cs')
  const content = fs.readFileSync(dtoPath, 'utf-8')

  expect(content).toContain('class RoomListResult')
  expect(content).toContain('List<RoomDto>')
  expect(content).toContain('Total')
})

test('LeaseStatus 枚举类型被正确引用', () => {
  const dtoPath = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos', 'Room', 'RoomDto.cs')
  const content = fs.readFileSync(dtoPath, 'utf-8')

  expect(content).toContain('using Gentle.Core.Enums')
  expect(content).toMatch(/public\s+LeaseStatus\s+LandlordLeaseStatus/)
  expect(content).toMatch(/public\s+LeaseStatus\s+TenantLeaseStatus/)
})

test('后端 dotnet build 编译成功', () => {
  const result = execSync('dotnet build --nologo -v q', {
    cwd: path.join(ROOT, 'Gentle'),
    encoding: 'utf-8',
    timeout: 120_000,
  })

  expect(result).toContain('已成功生成')
  expect(result).not.toMatch(/错误\s+\d+/)
})

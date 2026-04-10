import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test, describe } from '@playwright/test'

const ROOT = path.resolve(__dirname, '..', '..')
const SERVICE_FILE = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Services', 'RoomService.cs')
const DTO_FILE = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Dtos', 'Room', 'RoomDto.cs')
const XML_FILE = path.join(ROOT, 'Gentle', 'Gentle.Application', 'Gentle.Application.xml')

describe('FEAT-156: RoomService 映射逻辑调整', () => {
  test('RoomService.cs 包含 .Include(r => r.Renter)', () => {
    const content = fs.readFileSync(SERVICE_FILE, 'utf-8')
    expect(content).toContain('.Include(r => r.Renter)')
  })

  test('RoomService.cs 映射 TenantName/RentalStartDate/RentalEndDate', () => {
    const content = fs.readFileSync(SERVICE_FILE, 'utf-8')
    expect(content).toContain('dto.TenantName = rental.Renter?.Name')
    expect(content).toContain('dto.RentalStartDate = rental.CheckInDate')
    expect(content).toContain('dto.RentalEndDate = rental.ContractEndDate')
  })

  test('RoomService.cs 不再包含 LeaseDuration/DaysUntilExpiry 映射', () => {
    const content = fs.readFileSync(SERVICE_FILE, 'utf-8')
    expect(content).not.toContain('dto.LeaseDuration')
    expect(content).not.toContain('dto.DaysUntilExpiry')
  })

  test('RoomService.CalculateLeaseDuration 方法已移除', () => {
    const content = fs.readFileSync(SERVICE_FILE, 'utf-8')
    expect(content).not.toContain('CalculateLeaseDuration')
  })

  test('RoomService.cs 不再使用 today 变量', () => {
    const content = fs.readFileSync(SERVICE_FILE, 'utf-8')
    // GetListAsync 方法中不应有 DateTime.Today
    const getListStart = content.indexOf('GetListAsync')
    const getByIdStart = content.indexOf('GetByIdAsync')
    const getListBody = content.substring(getListStart, getByIdStart)
    expect(getListBody).not.toContain('DateTime.Today')
    expect(getListBody).not.toContain('var today')
  })

  test('RoomDto.cs 包含 TenantName/RentalStartDate/RentalEndDate 字段', () => {
    const content = fs.readFileSync(DTO_FILE, 'utf-8')
    expect(content).toContain('public string? TenantName')
    expect(content).toContain('public DateTime? RentalStartDate')
    expect(content).toContain('public DateTime? RentalEndDate')
  })

  test('RoomDto.cs 不再包含 LeaseDuration/DaysUntilExpiry 字段', () => {
    const content = fs.readFileSync(DTO_FILE, 'utf-8')
    expect(content).not.toContain('LeaseDuration')
    expect(content).not.toContain('DaysUntilExpiry')
  })

  test('Gentle.Application.xml 包含新字段条目', () => {
    const content = fs.readFileSync(XML_FILE, 'utf-8')
    expect(content).toContain('RoomDto.TenantName')
    expect(content).toContain('RoomDto.RentalStartDate')
    expect(content).toContain('RoomDto.RentalEndDate')
  })

  test('Gentle.Application.xml 不再包含旧字段和 CalculateLeaseDuration 条目', () => {
    const content = fs.readFileSync(XML_FILE, 'utf-8')
    expect(content).not.toContain('RoomDto.LeaseDuration')
    expect(content).not.toContain('RoomDto.DaysUntilExpiry')
    expect(content).not.toContain('CalculateLeaseDuration')
  })

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build --nologo -v q', {
      cwd: path.join(ROOT, 'Gentle'),
      encoding: 'utf-8',
      timeout: 120_000,
    })
    expect(result).toContain('已成功生成')
    expect(result).toContain('0 个错误')
  })
})

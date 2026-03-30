// FEAT-108: 更新后端单元测试
// 验证 LeaseType → LeaseMonths 重构后单元测试正确更新

import { expect, test } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..', '..')
const GENTLE_ROOT = path.join(ROOT, 'Gentle')

const reminderTestsPath = path.join(
  GENTLE_ROOT,
  'Gentle.Tests/Services/RentalReminderServiceTests.cs',
)
const todoTestsPath = path.join(
  GENTLE_ROOT,
  'Gentle.Tests/Services/TodoServiceTests.cs',
)

// RentalReminderServiceTests.cs
const reminderContent = fs.readFileSync(reminderTestsPath, 'utf-8')
const todoContent = fs.readFileSync(todoTestsPath, 'utf-8')

test('FEAT-108: RentalReminderServiceTests 文件存在', () => {
  expect(fs.existsSync(reminderTestsPath)).toBeTruthy()
})

test('FEAT-108: LeaseType_EnumValues_AreCorrect 测试已删除', () => {
  expect(reminderContent).not.toContain('LeaseType_EnumValues_AreCorrect')
})

test('FEAT-108: RentalReminderServiceTests 不再引用 LeaseType 枚举', () => {
  expect(reminderContent).not.toContain('LeaseType.Monthly')
  expect(reminderContent).not.toContain('LeaseType.HalfYear')
  expect(reminderContent).not.toContain('LeaseType.Yearly')
})

test('FEAT-108: RenewRentalInput 默认值断言使用 LeaseMonths (RentalReminder)', () => {
  expect(reminderContent).toContain('Assert.Equal(1, input.LeaseMonths)')
  expect(reminderContent).not.toContain('input.LeaseType')
})

test('FEAT-108: CreateValidRenewInput 使用 LeaseMonths', () => {
  expect(reminderContent).toContain('LeaseMonths = 1')
})

test('FEAT-108: 仍保留其他枚举测试（RentalReminderStatus、RentalStatus、DepositStatus）', () => {
  expect(reminderContent).toContain('RentalReminderStatus_EnumValues_AreCorrect')
  expect(reminderContent).toContain('RentalStatus_EnumValues_AreCorrect')
  expect(reminderContent).toContain('DepositStatus_EnumValues_AreCorrect')
})

// TodoServiceTests.cs
test('FEAT-108: TodoServiceTests 文件存在', () => {
  expect(fs.existsSync(todoTestsPath)).toBeTruthy()
})

test('FEAT-108: RenewRentalInput 默认值断言使用 LeaseMonths (Todo)', () => {
  expect(todoContent).toContain('Assert.Equal(1, input.LeaseMonths)')
  expect(todoContent).not.toContain('input.LeaseType')
})

test('FEAT-108: TodoServiceTests 仍保留其他枚举测试（TodoType、RentalReminderStatus、UtilityBillStatus）', () => {
  expect(todoContent).toContain('TodoType_EnumValues_AreCorrect')
  expect(todoContent).toContain('RentalReminderStatus_EnumValues_AreCorrect')
  expect(todoContent).toContain('UtilityBillStatus_EnumValues_AreCorrect')
})

// 后端编译验证
test('FEAT-108: dotnet build Gentle.Tests 成功', () => {
  const result = execSync('dotnet build Gentle.Tests/Gentle.Tests.csproj --no-restore', {
    cwd: GENTLE_ROOT,
    encoding: 'utf-8',
    timeout: 120_000,
  })
  expect(result).toContain('已成功生成')
})

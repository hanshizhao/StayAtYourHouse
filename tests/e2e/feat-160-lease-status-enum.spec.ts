import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const enumFile = path.resolve(__dirname, '../../Gentle/Gentle.Core/Enums/LeaseStatus.cs')
const extFile = path.resolve(__dirname, '../../Gentle/Gentle.Core/Enums/LeaseStatusExtensions.cs')

test.describe('FEAT-160: LeaseStatus 枚举及扩展方法', () => {
  test('LeaseStatus.cs 文件存在', () => {
    expect(fs.existsSync(enumFile)).toBeTruthy()
  })

  test('LeaseStatusExtensions.cs 文件存在', () => {
    expect(fs.existsSync(extFile)).toBeTruthy()
  })

  test('LeaseStatus 枚举包含正确成员和值', () => {
    const content = fs.readFileSync(enumFile, 'utf-8')
    expect(content).toContain('Normal = 0')
    expect(content).toContain('ExpiringSoon = 1')
    expect(content).toContain('Expired = 2')
    expect(content).toContain('None = 3')
  })

  test('LeaseStatusExtensions 包含 ToText 方法', () => {
    const content = fs.readFileSync(extFile, 'utf-8')
    expect(content).toContain('ToText(this LeaseStatus status)')
    expect(content).toContain('LeaseStatus.Normal => "正常"')
    expect(content).toContain('LeaseStatus.ExpiringSoon => "即将到期"')
    expect(content).toContain('LeaseStatus.Expired => "已过期"')
    expect(content).toContain('LeaseStatus.None => "无租约"')
  })

  test('后端项目编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: path.resolve(__dirname, '../../Gentle'),
      encoding: 'utf-8',
      timeout: 60000,
    })
    expect(result).toContain('0 个错误')
  })
})

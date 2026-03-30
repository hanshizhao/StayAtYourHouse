import { expect, test } from '@playwright/test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..', '..')
const MIGRATIONS_DIR = path.join(ROOT, 'Gentle', 'Gentle.Database.Migrations', 'Migrations')

// 查找迁移文件
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.includes('LeaseTypeToLeaseMonths') && !f.endsWith('.Designer.cs'))

const migrationContent = migrationFiles.length > 0
  ? fs.readFileSync(path.join(MIGRATIONS_DIR, migrationFiles[0]), 'utf-8')
  : ''

test('FEAT-107: 迁移文件存在', () => {
  expect(migrationFiles.length).toBe(1)
})

test('FEAT-107: Up 方法包含 AddColumn LeaseMonths', () => {
  expect(migrationContent).toContain('AddColumn')
  expect(migrationContent).toContain('LeaseMonths')
})

test('FEAT-107: Up 方法包含数据转换 SQL (lease_type → lease_months)', () => {
  expect(migrationContent).toContain('UPDATE rental_record')
  expect(migrationContent).toContain('LeaseMonths')
  // 验证 CASE 转换逻辑包含关键值
  expect(migrationContent).toMatch(/WHEN 0 THEN 1/)
  expect(migrationContent).toMatch(/WHEN 1 THEN 6/)
  expect(migrationContent).toMatch(/WHEN 2 THEN 12/)
})

test('FEAT-107: Up 方法包含 DropColumn LeaseType', () => {
  expect(migrationContent).toContain('DropColumn')
  expect(migrationContent).toContain('"LeaseType"')
})

test('FEAT-107: Down 方法包含反向迁移（AddColumn LeaseType + DropColumn LeaseMonths）', () => {
  // Down 应该恢复 LeaseType 列并删除 LeaseMonths 列
  const downMatch = migrationContent.match(/protected override void Down\([\s\S]*?\n        \}/)
  expect(downMatch).toBeTruthy()
  const downContent = downMatch![0]
  expect(downContent).toContain('LeaseType')
  expect(downContent).toContain('DropColumn')
})

test('FEAT-107: 迁移项目编译成功', () => {
  const result = execSync(
    'dotnet build Gentle.Database.Migrations/Gentle.Database.Migrations.csproj --no-restore',
    { cwd: path.join(ROOT, 'Gentle'), encoding: 'utf-8' },
  )
  expect(result).toContain('已成功生成') // 或 'Build succeeded'
})

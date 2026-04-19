import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { test, expect } from '@playwright/test'

test.describe('FEAT-169: 后端实体 Debt 和 DebtRepayment', () => {
  const rootDir = resolve(__dirname, '../..')
  const debtEntityPath = resolve(rootDir, 'Gentle/Gentle.Core/Entities/Debt.cs')
  const debtRepaymentEntityPath = resolve(rootDir, 'Gentle/Gentle.Core/Entities/DebtRepayment.cs')

  test('Debt 实体文件存在', () => {
    expect(existsSync(debtEntityPath)).toBeTruthy()
  })

  test('DebtRepayment 实体文件存在', () => {
    expect(existsSync(debtRepaymentEntityPath)).toBeTruthy()
  })

  test('Debt 实体包含必需字段', async () => {
    const content = await import('node:fs').then(fs => fs.readFileSync(debtEntityPath, 'utf-8'))
    expect(content).toContain('TenantId')
    expect(content).toContain('TotalAmount')
    expect(content).toContain('Status')
    expect(content).toContain('Description')
    expect(content).toContain('Remark')
    expect(content).toContain('ICollection<DebtRepayment>')
    expect(content).toContain('Entity<int>')
    expect(content).toContain('IEntitySeedData<Debt>')
  })

  test('DebtRepayment 实体包含必需字段', async () => {
    const content = await import('node:fs').then(fs => fs.readFileSync(debtRepaymentEntityPath, 'utf-8'))
    expect(content).toContain('DebtId')
    expect(content).toContain('Amount')
    expect(content).toContain('PaymentDate')
    expect(content).toContain('PaymentChannel')
    expect(content).toContain('Remark')
    expect(content).toContain('Entity<int>')
    expect(content).toContain('IEntitySeedData<DebtRepayment>')
  })

  test('dotnet build 编译成功', () => {
    const result = execSync('dotnet build', {
      cwd: resolve(rootDir, 'Gentle'),
      encoding: 'utf-8',
      timeout: 60000,
    })
    expect(result).toContain('已成功生成')
    expect(result).toMatch(/0 个错误/)
  })
})

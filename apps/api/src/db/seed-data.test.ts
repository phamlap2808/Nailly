import { describe, expect, it } from 'vitest'
import { demoSeed } from './seed-data'
import { invoices, invoiceItems, payments, refunds, staff, shopSettings } from './schema'

describe('demo seed data', () => {
  it('defines finance persistence columns for invoices, payments, refunds, settings, and staff commission', () => {
    expect(invoices).toBeDefined()
    expect(invoiceItems).toBeDefined()
    expect(payments).toBeDefined()
    expect(refunds).toBeDefined()
    expect(shopSettings.taxRateBps).toBeDefined()
    expect(shopSettings.invoicePrefix).toBeDefined()
    expect(shopSettings.receiptFooter).toBeDefined()
    expect(staff.commissionRateBps).toBeDefined()
  })

  it('creates one shop with English public content', () => {
    expect(demoSeed.shop.name).toBe('Luma Nail Studio')
    expect(demoSeed.shop.locale).toBe('en')
    expect(demoSeed.shop.address).toContain('Main Street')
  })

  it('includes nail services, staff, gallery, and role-based admins', () => {
    expect(demoSeed.categories.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.services.length).toBeGreaterThanOrEqual(6)
    expect(demoSeed.staff.length).toBeGreaterThanOrEqual(3)
    expect(demoSeed.media.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.adminUsers.map((user) => user.role).sort()).toEqual(['manager', 'owner', 'staff'])
  })

  it('includes realistic finance demo data for POS and reporting', () => {
    expect(demoSeed.shop.taxRateBps).toBe(825)
    expect(demoSeed.shop.invoicePrefix).toBe('INV')
    expect(demoSeed.staff.every((person) => typeof person.commissionRateBps === 'number')).toBe(true)
    expect(demoSeed.financeInvoices.length).toBeGreaterThanOrEqual(4)
    expect(demoSeed.financeInvoices.some((invoice) => invoice.source === 'walk_in')).toBe(true)
    expect(demoSeed.financeInvoices.some((invoice) => invoice.refunds.length > 0)).toBe(true)
  })
})

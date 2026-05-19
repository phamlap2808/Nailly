import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('invoice page routing', () => {
  it('keeps the invoice list at a sibling index route so detail routes can render independently', () => {
    expect(existsSync(new URL('../pages/admin/invoices/index.vue', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../pages/admin/invoices.vue', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../pages/admin/invoices/[id]/index.vue', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../pages/admin/invoices/[id].vue', import.meta.url))).toBe(false)
    expect(existsSync(new URL('../pages/admin/invoices/[id]/print.vue', import.meta.url))).toBe(true)
    expect(existsSync(new URL('../pages/admin/invoices/[id]/receipt.vue', import.meta.url))).toBe(true)
  })
})

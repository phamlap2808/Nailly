import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('admin shell brand', () => {
  it('uses saved shop settings for the sidebar studio name', () => {
    const source = readSource('../components/AdminShell.vue')

    expect(source).toContain('/admin/shop-settings')
    expect(source).toContain('sidebarShopName')
    expect(source).toContain('{{ sidebarShopName }}')
  })
})

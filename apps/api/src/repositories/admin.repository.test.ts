import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const orderBy = vi.fn().mockResolvedValue([])
  const where = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ orderBy, where }))
  const select = vi.fn(() => ({ from }))
  const deleteWhere = vi.fn().mockResolvedValue(undefined)
  const deleteFrom = vi.fn(() => ({ where: deleteWhere }))
  const insertValues = vi.fn().mockResolvedValue(undefined)
  const insertInto = vi.fn(() => ({ values: insertValues }))

  return {
    db: { delete: deleteFrom, insert: insertInto, select },
    deleteFrom,
    deleteWhere,
    insertInto,
    insertValues,
    orderBy,
    where,
    from,
    select
  }
})

vi.mock('../db/client', () => ({
  createDb: vi.fn(() => ({ db: mocks.db }))
}))

import { buildRolePermissionRows, buildShopSettingsUpdateValues, createAdminRepository } from './admin.repository'

describe('createAdminRepository', () => {
  beforeEach(() => {
    mocks.select.mockClear()
    mocks.from.mockClear()
    mocks.where.mockClear()
    mocks.orderBy.mockClear()
    mocks.deleteFrom.mockClear()
    mocks.deleteWhere.mockClear()
    mocks.insertInto.mockClear()
    mocks.insertValues.mockClear()
  })

  it('applies booking status filters before ordering bookings', async () => {
    const repository = createAdminRepository()

    await repository.listBookings({ status: 'confirmed' })

    expect(mocks.where).toHaveBeenCalledTimes(1)
    expect(mocks.orderBy).toHaveBeenCalledTimes(1)
  })

  it('lists all bookings without a where clause when no filter is supplied', async () => {
    const repository = createAdminRepository()

    await repository.listBookings()

    expect(mocks.where).not.toHaveBeenCalled()
    expect(mocks.orderBy).toHaveBeenCalledTimes(1)
  })

  it('drops server-owned metadata from shop settings updates', () => {
    const values = buildShopSettingsUpdateValues({
      name: 'Luma Nail Studio',
      tagline: 'Quiet care',
      id: 'shop-id',
      createdAt: '2026-05-19T00:00:00.000Z',
      updatedAt: '2026-05-19T00:00:00.000Z'
    })

    expect(values).toMatchObject({
      name: 'Luma Nail Studio',
      tagline: 'Quiet care'
    })
    expect(values).not.toHaveProperty('id')
    expect(values).not.toHaveProperty('createdAt')
    expect(values.updatedAt).toBeInstanceOf(Date)
  })

  it('builds complete role permission rows with explicit disabled permissions', () => {
    const rows = buildRolePermissionRows('manager', ['reports.view', 'settings.manage'])

    expect(rows.find((row) => row.permission === 'reports.view')).toMatchObject({
      role: 'manager',
      enabled: true
    })
    expect(rows.find((row) => row.permission === 'reports.export')).toMatchObject({
      role: 'manager',
      enabled: false
    })
  })

  it('replaces role permissions even when called as an unbound repository method', async () => {
    const repository = createAdminRepository()
    const replaceRolePermissions = repository.replaceRolePermissions

    await expect(replaceRolePermissions('staff', ['bookings.view'])).resolves.toBeDefined()

    expect(mocks.deleteWhere).toHaveBeenCalledTimes(1)
    expect(mocks.insertValues).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ role: 'staff', permission: 'bookings.view', enabled: true })
    ]))
  })
})

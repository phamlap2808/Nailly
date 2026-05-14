import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const orderBy = vi.fn().mockResolvedValue([])
  const where = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ orderBy, where }))
  const select = vi.fn(() => ({ from }))

  return {
    db: { select },
    orderBy,
    where,
    from,
    select
  }
})

vi.mock('../db/client', () => ({
  createDb: vi.fn(() => ({ db: mocks.db }))
}))

import { createAdminRepository } from './admin.repository'

describe('createAdminRepository', () => {
  beforeEach(() => {
    mocks.select.mockClear()
    mocks.from.mockClear()
    mocks.where.mockClear()
    mocks.orderBy.mockClear()
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
})

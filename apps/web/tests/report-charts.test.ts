import { describe, expect, it } from 'vitest'
import { buildRevenueTrendRows, takeTopRows, toPercent } from '../utils/report-charts'

describe('report chart helpers', () => {
  it('groups visible invoice revenue by issued day in cents', () => {
    expect(
      buildRevenueTrendRows([
        {
          totalCents: 12000,
          refundedCents: 2000,
          issuedAt: '2026-05-18T10:00:00.000Z',
          createdAt: '2026-05-18T09:00:00.000Z'
        },
        {
          totalCents: 8000,
          refundedCents: 0,
          issuedAt: '2026-05-18T13:00:00.000Z',
          createdAt: '2026-05-18T12:00:00.000Z'
        },
        {
          totalCents: 5000,
          refundedCents: 1000,
          issuedAt: null,
          createdAt: '2026-05-19T08:00:00.000Z'
        }
      ])
    ).toEqual([
      { key: '2026-05-18', label: 'May 18', grossCents: 20000, netCents: 18000, invoiceCount: 2 },
      { key: '2026-05-19', label: 'May 19', grossCents: 5000, netCents: 4000, invoiceCount: 1 }
    ])
  })

  it('limits ranked rows without mutating the source rows', () => {
    const rows = [
      { name: 'A', salesCents: 1000 },
      { name: 'B', salesCents: 5000 },
      { name: 'C', salesCents: 3000 }
    ]

    expect(takeTopRows(rows, 'salesCents', 2)).toEqual([
      { name: 'B', salesCents: 5000 },
      { name: 'C', salesCents: 3000 }
    ])
    expect(rows.map((row) => row.name)).toEqual(['A', 'B', 'C'])
  })

  it('converts values to stable chart percentages', () => {
    expect(toPercent(25, 100)).toBe('25%')
    expect(toPercent(0, 100)).toBe('0%')
    expect(toPercent(5, 100, 8)).toBe('8%')
    expect(toPercent(10, 0)).toBe('0%')
  })
})

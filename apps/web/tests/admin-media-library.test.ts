import { describe, expect, it } from 'vitest'
import {
  filterMediaAssets,
  formatMediaBytes,
  getAltStatus,
  getMediaFilename,
  getUsageLabel,
  paginateMediaAssets
} from '../utils/admin-media-library'

const assets = [
  {
    id: 'gallery-soft',
    publicUrl: 'http://localhost:9100/nailly-media/demo/gallery-soft-pink-manicure.jpg',
    altText: 'Soft pink manicure',
    usageType: 'gallery',
    sizeBytes: 512_000
  },
  {
    id: 'service-gel',
    publicUrl: 'http://localhost:9100/nailly-media/demo/service-gel-manicure.jpg',
    altText: '',
    usageType: 'service',
    sizeBytes: 1_572_864
  },
  {
    id: 'staff-maya',
    publicUrl: 'http://localhost:9100/nailly-media/demo/staff-maya.jpg',
    altText: 'Maya portrait',
    usageType: 'staff',
    sizeBytes: 98_304
  }
]

describe('admin media library helpers', () => {
  it('filters media by search text and usage type', () => {
    expect(filterMediaAssets(assets, { searchQuery: 'pink', usage: 'all' }).map((asset) => asset.id)).toEqual([
      'gallery-soft'
    ])

    expect(filterMediaAssets(assets, { searchQuery: 'gel', usage: 'service' }).map((asset) => asset.id)).toEqual([
      'service-gel'
    ])

    expect(filterMediaAssets(assets, { searchQuery: '', usage: 'staff' }).map((asset) => asset.id)).toEqual([
      'staff-maya'
    ])
  })

  it('paginates media and clamps the current page', () => {
    const firstPage = paginateMediaAssets(assets, 1, 2)

    expect(firstPage.items.map((asset) => asset.id)).toEqual(['gallery-soft', 'service-gel'])
    expect(firstPage).toMatchObject({
      currentPage: 1,
      totalPages: 2,
      totalItems: 3,
      startItem: 1,
      endItem: 2
    })

    const lastPage = paginateMediaAssets(assets, 9, 2)

    expect(lastPage.items.map((asset) => asset.id)).toEqual(['staff-maya'])
    expect(lastPage).toMatchObject({
      currentPage: 2,
      totalPages: 2,
      startItem: 3,
      endItem: 3
    })
  })

  it('formats media display metadata', () => {
    expect(getMediaFilename(assets[0])).toBe('gallery-soft-pink-manicure.jpg')
    expect(getUsageLabel('gallery')).toBe('Gallery')
    expect(getUsageLabel('service')).toBe('Service')
    expect(getUsageLabel('staff')).toBe('Staff')
    expect(formatMediaBytes(512_000)).toBe('500 KB')
    expect(formatMediaBytes(1_572_864)).toBe('1.5 MB')
    expect(getAltStatus('Soft pink manicure')).toBe('Ready')
    expect(getAltStatus('   ')).toBe('Missing')
  })
})

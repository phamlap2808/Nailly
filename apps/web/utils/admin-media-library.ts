export type MediaUsageFilter = 'all' | 'gallery' | 'service' | 'staff' | 'banner'
export type AltStatus = 'Ready' | 'Missing'

interface MediaAssetLike {
  publicUrl: string
  altText?: string | null
  usageType: string
  sizeBytes: number
}

interface MediaPagination<TAsset> {
  items: TAsset[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startItem: number
  endItem: number
}

export function getMediaFilename(asset: Pick<MediaAssetLike, 'publicUrl'>) {
  try {
    const url = new URL(asset.publicUrl)
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? asset.publicUrl)
  } catch {
    return asset.publicUrl.split('/').filter(Boolean).at(-1) ?? asset.publicUrl
  }
}

export function getUsageLabel(value: string) {
  if (value === 'gallery') return 'Gallery'
  if (value === 'service') return 'Service'
  if (value === 'staff') return 'Staff'
  if (value === 'banner') return 'Banner'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatMediaBytes(value: number) {
  if (!Number.isFinite(value)) return ''
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function getAltStatus(value: string | null | undefined): AltStatus {
  return value?.trim() ? 'Ready' : 'Missing'
}

export function filterMediaAssets<TAsset extends MediaAssetLike>(
  assets: TAsset[],
  filters: { searchQuery: string; usage: MediaUsageFilter }
) {
  const query = filters.searchQuery.trim().toLocaleLowerCase()

  return assets.filter((asset) => {
    const matchesUsage = filters.usage === 'all' || asset.usageType === filters.usage
    if (!matchesUsage) return false
    if (!query) return true

    return [asset.altText ?? '', asset.usageType, asset.publicUrl, getMediaFilename(asset)]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function paginateMediaAssets<TAsset>(
  assets: TAsset[],
  currentPage: number,
  pageSize: number
): MediaPagination<TAsset> {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 1)
  const totalItems = assets.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)

  return {
    items: assets.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}

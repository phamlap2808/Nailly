export type CatalogStatusFilter = 'all' | 'active' | 'inactive'

interface CatalogServiceItem {
  name: string
  description?: string
  active: boolean
}

interface CatalogFilterOptions {
  searchQuery: string
  status: CatalogStatusFilter
}

interface CatalogPagination<TService> {
  items: TService[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startItem: number
  endItem: number
}

export function filterCatalogServices<TService extends CatalogServiceItem>(
  services: TService[],
  filters: CatalogFilterOptions
) {
  const query = filters.searchQuery.trim().toLocaleLowerCase()

  return services.filter((service) => {
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && service.active) ||
      (filters.status === 'inactive' && !service.active)

    if (!matchesStatus) return false
    if (!query) return true

    return [service.name, service.description ?? '']
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function paginateCatalogServices<TService>(
  services: TService[],
  currentPage: number,
  pageSize: number
): CatalogPagination<TService> {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 1)
  const totalItems = services.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)

  return {
    items: services.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}

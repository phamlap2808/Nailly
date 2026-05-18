export type StaffStatusFilter = 'all' | 'active' | 'inactive'

interface StaffTableRow {
  name: string
  title: string
  bio?: string
  active: boolean
}

interface StaffServiceCoverage {
  staffServices?: Array<{ serviceId: string }>
}

interface StaffPagination<TStaff> {
  items: TStaff[]
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  startItem: number
  endItem: number
}

export function filterStaffRows<TStaff extends StaffTableRow>(
  staff: TStaff[],
  filters: { searchQuery: string; status: StaffStatusFilter }
) {
  const query = filters.searchQuery.trim().toLocaleLowerCase()

  return staff.filter((row) => {
    const matchesStatus =
      filters.status === 'all' ||
      (filters.status === 'active' && row.active) ||
      (filters.status === 'inactive' && !row.active)

    if (!matchesStatus) return false
    if (!query) return true

    return [row.name, row.title, row.bio ?? '']
      .join(' ')
      .toLocaleLowerCase()
      .includes(query)
  })
}

export function getStaffServiceLabel(staff: StaffServiceCoverage) {
  if (!staff.staffServices) return 'All services'

  const count = staff.staffServices.length
  if (count === 0) return 'No services'
  return count === 1 ? '1 service' : `${count} services`
}

export function paginateStaffRows<TStaff>(
  staff: TStaff[],
  currentPage: number,
  pageSize: number
): StaffPagination<TStaff> {
  const safePageSize = Math.max(1, Math.trunc(pageSize) || 1)
  const totalItems = staff.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const safeCurrentPage = Math.min(Math.max(1, Math.trunc(currentPage) || 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * safePageSize
  const endIndex = Math.min(startIndex + safePageSize, totalItems)

  return {
    items: staff.slice(startIndex, endIndex),
    currentPage: safeCurrentPage,
    totalPages,
    totalItems,
    pageSize: safePageSize,
    startItem: totalItems ? startIndex + 1 : 0,
    endItem: endIndex
  }
}

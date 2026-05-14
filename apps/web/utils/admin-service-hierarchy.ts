export interface ServiceHierarchyCategory {
  id: string
  name: string
  description?: string | null
  active?: boolean
}

export interface ServiceHierarchyItem {
  id: string
  categoryId: string
  active: boolean
}

export interface ServiceHierarchyNode<TService extends ServiceHierarchyItem = ServiceHierarchyItem> {
  id: string
  name: string
  description: string
  active: boolean
  serviceCount: number
  activeServiceCount: number
  inactiveServiceCount: number
  services: TService[]
  isAll?: boolean
}

export interface ServiceHierarchy<TService extends ServiceHierarchyItem = ServiceHierarchyItem> {
  all: ServiceHierarchyNode<TService>
  categories: Array<ServiceHierarchyNode<TService>>
}

function countActiveServices<TService extends ServiceHierarchyItem>(services: TService[]) {
  return services.filter((service) => service.active).length
}

function buildNode<TService extends ServiceHierarchyItem>(
  category: ServiceHierarchyCategory,
  services: TService[]
): ServiceHierarchyNode<TService> {
  const activeServiceCount = countActiveServices(services)

  return {
    id: category.id,
    name: category.name,
    description: category.description ?? '',
    active: category.active ?? true,
    serviceCount: services.length,
    activeServiceCount,
    inactiveServiceCount: services.length - activeServiceCount,
    services
  }
}

export function buildServiceHierarchy<TService extends ServiceHierarchyItem>(
  categories: ServiceHierarchyCategory[],
  services: TService[]
): ServiceHierarchy<TService> {
  const activeServiceCount = countActiveServices(services)

  return {
    all: {
      id: 'all',
      name: 'All services',
      description: 'Every service in the catalog.',
      active: true,
      serviceCount: services.length,
      activeServiceCount,
      inactiveServiceCount: services.length - activeServiceCount,
      services,
      isAll: true
    },
    categories: categories.map((category) =>
      buildNode(
        category,
        services.filter((service) => service.categoryId === category.id)
      )
    )
  }
}

export function getSelectedCategoryNode<TService extends ServiceHierarchyItem>(
  hierarchy: ServiceHierarchy<TService>,
  selectedCategoryId: string
) {
  if (selectedCategoryId === 'all') return hierarchy.all
  return hierarchy.categories.find((category) => category.id === selectedCategoryId) ?? hierarchy.all
}

export function getServicesForCategorySelection<TService extends ServiceHierarchyItem>(
  services: TService[],
  selectedCategoryId: string
) {
  if (selectedCategoryId === 'all') return services
  return services.filter((service) => service.categoryId === selectedCategoryId)
}

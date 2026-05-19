import type { JsonCache } from '../cache/redis'

export function createAdminService(
  repository: ReturnType<typeof import('../repositories/admin.repository').createAdminRepository>,
  cache?: Pick<JsonCache, 'del'>
) {
  async function invalidatePublicSite() {
    if (cache) {
      await cache.del('public:site')
    }
  }

  return {
    // Bookings
    listBookings: repository.listBookings,
    getBooking: repository.getBooking,
    updateBooking: repository.updateBooking,
    updateBookingStatus: repository.updateBookingStatus,

    // Categories
    listServiceCategories: repository.listServiceCategories,
    createServiceCategory: async (input: Parameters<typeof repository.createServiceCategory>[0]) => {
      const result = await repository.createServiceCategory(input)
      await invalidatePublicSite()
      return result
    },
    updateServiceCategory: async (id: string, input: Record<string, unknown>) => {
      const result = await repository.updateServiceCategory(id, input)
      await invalidatePublicSite()
      return result
    },

    // Services
    listServices: repository.listServices,
    createService: async (input: Parameters<typeof repository.createService>[0]) => {
      const result = await repository.createService(input)
      await invalidatePublicSite()
      return result
    },
    updateService: async (id: string, input: Record<string, unknown>) => {
      const result = await repository.updateService(id, input)
      await invalidatePublicSite()
      return result
    },

    // Staff
    listStaff: repository.listStaff,
    createStaff: async (input: Parameters<typeof repository.createStaff>[0]) => {
      const result = await repository.createStaff(input)
      await invalidatePublicSite()
      return result
    },
    updateStaff: async (id: string, input: Record<string, unknown>) => {
      const result = await repository.updateStaff(id, input)
      await invalidatePublicSite()
      return result
    },
    setStaffServices: async (staffId: string, serviceIds: string[]) => {
      const result = await repository.setStaffServices(staffId, serviceIds)
      await invalidatePublicSite()
      return result
    },

    // Shop Settings
    getShopSettings: repository.getShopSettings,
    updateShopSettings: async (input: Record<string, unknown>) => {
      const result = await repository.updateShopSettings(input)
      await invalidatePublicSite()
      return result
    },

    // Admin Users
    listAdminUsers: repository.listAdminUsers,
    createAdminUser: repository.createAdminUser,

    // Permissions
    listRolePermissions: repository.listRolePermissions,
    replaceRolePermissions: repository.replaceRolePermissions,

    // Media
    listMedia: repository.listMedia,
    createMedia: async (input: Parameters<typeof repository.createMedia>[0]) => {
      const result = await repository.createMedia(input)
      await invalidatePublicSite()
      return result
    },
    updateMedia: async (id: string, input: Record<string, unknown>) => {
      const result = await repository.updateMedia(id, input)
      await invalidatePublicSite()
      return result
    },

    // Banners
    listBanners: repository.listBanners,
    createBanner: async (input: Parameters<typeof repository.createBanner>[0]) => {
      const result = await repository.createBanner(input)
      await invalidatePublicSite()
      return result
    },
    updateBanner: async (id: string, input: Record<string, unknown>) => {
      const result = await repository.updateBanner(id, input)
      await invalidatePublicSite()
      return result
    }
  }
}

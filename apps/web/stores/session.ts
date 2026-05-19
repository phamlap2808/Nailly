import { defineStore } from 'pinia'
import { permissionsForRole, type AdminPermission, type AdminRole } from '@nailly/shared/src/permissions'
import { buildApiUrl, resolveRuntimeApiBaseUrl } from '../utils/api-url'

export interface AdminProfile {
  id: string
  email: string
  name: string
  role: AdminRole
  permissions: AdminPermission[]
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<AdminProfile | null>(null)
  const loaded = ref(false)

  const config = useRuntimeConfig()
  const apiBaseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  function buildUrl(path: string) {
    return buildApiUrl(apiBaseUrl, path)
  }

  async function loadMe() {
    try {
      user.value = await $fetch<AdminProfile>(buildUrl('/auth/me'), {
        credentials: 'include',
        headers: requestHeaders
      })
      user.value.permissions ??= permissionsForRole(user.value.role)
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
  }

  async function login(email: string, password: string) {
    const profile = await $fetch<AdminProfile>(buildUrl('/auth/login'), {
      method: 'POST',
      credentials: 'include',
      headers: requestHeaders,
      body: { email, password }
    })
    profile.permissions ??= permissionsForRole(profile.role)
    user.value = profile
    return profile
  }

  async function logout() {
    await $fetch(buildUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include',
      headers: requestHeaders
    })
    user.value = null
  }

  return { user, loaded, loadMe, login, logout }
})

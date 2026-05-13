import { defineStore } from 'pinia'
import { buildApiUrl } from '../utils/api-url'

export interface AdminProfile {
  id: string
  email: string
  name: string
  role: string
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<AdminProfile | null>(null)
  const loaded = ref(false)

  const { apiBaseUrl } = useRuntimeConfig().public

  function buildUrl(path: string) {
    return buildApiUrl(apiBaseUrl, path)
  }

  async function loadMe() {
    try {
      user.value = await $fetch<AdminProfile>(buildUrl('/auth/me'), {
        credentials: 'include'
      })
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
      body: { email, password }
    })
    user.value = profile
    return profile
  }

  async function logout() {
    await $fetch(buildUrl('/auth/logout'), {
      method: 'POST',
      credentials: 'include'
    })
    user.value = null
  }

  return { user, loaded, loadMe, login, logout }
})

import { buildApiUrl, resolveRuntimeApiBaseUrl } from '../utils/api-url'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const apiBaseUrl = resolveRuntimeApiBaseUrl(config, import.meta.server)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  return {
    provide: {
      api: <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) =>
        $fetch<T>(buildApiUrl(apiBaseUrl, path), {
          credentials: 'include',
          headers: requestHeaders,
          ...options
        })
    }
  }
})

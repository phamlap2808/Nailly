import { buildApiUrl } from '../utils/api-url'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  return {
    provide: {
      api: <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) =>
        $fetch<T>(buildApiUrl(config.public.apiBaseUrl, path), {
          credentials: 'include',
          ...options
        })
    }
  }
})

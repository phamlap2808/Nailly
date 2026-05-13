import type { NitroFetchRequest } from 'nitropack'

declare module '#app' {
  interface NuxtApp {
    $api: <T = unknown>(
      path: string,
      options?: Parameters<typeof $fetch<T, NitroFetchRequest>>[1]
    ) => Promise<T>
  }
}

export {}

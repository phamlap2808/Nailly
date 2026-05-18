export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

interface RuntimeApiConfig {
  apiBaseUrl?: string
  public?: {
    apiBaseUrl?: string
  }
}

export function resolveRuntimeApiBaseUrl(config: RuntimeApiConfig, renderingOnServer: boolean) {
  if (renderingOnServer && config.apiBaseUrl) return config.apiBaseUrl

  return config.public?.apiBaseUrl ?? config.apiBaseUrl ?? ''
}

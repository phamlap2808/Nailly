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

export function buildRuntimeApiRequest(
  config: RuntimeApiConfig,
  renderingOnServer: boolean,
  path: string,
  requestHeaders: { cookie?: string } = {}
) {
  const headers = renderingOnServer && requestHeaders.cookie
    ? { cookie: requestHeaders.cookie }
    : undefined

  return {
    url: buildApiUrl(resolveRuntimeApiBaseUrl(config, renderingOnServer), path),
    options: {
      credentials: 'include' as const,
      ...(headers ? { headers } : {})
    }
  }
}

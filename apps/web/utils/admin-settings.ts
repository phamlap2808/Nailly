export interface SettingsFormLike {
  name: string
  tagline: string
  description: string
  phone: string
  email: string | null
  address: string
  mapUrl: string | null
  seoTitle: string
  seoDescription: string
}

function valueOrFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

function optionalString(value: string | null | undefined) {
  return value?.trim() || null
}

export function buildSettingsSavePayload(input: SettingsFormLike) {
  return {
    ...input,
    email: optionalString(input.email),
    mapUrl: optionalString(input.mapUrl)
  }
}

export function buildSettingsPreview(input: SettingsFormLike) {
  const contactParts = [input.phone, input.email].map((value) => value?.trim()).filter(Boolean)

  return {
    profileTitle: valueOrFallback(input.name, 'Studio name'),
    tagline: valueOrFallback(input.tagline, 'No tagline yet'),
    description: valueOrFallback(input.description, 'No public description yet.'),
    contactLine: contactParts.length ? contactParts.join(' / ') : 'No contact details yet',
    address: valueOrFallback(input.address, 'No address yet'),
    mapStatus: input.mapUrl?.trim() ? 'Map link ready' : 'No map link',
    seoTitle: valueOrFallback(input.seoTitle, 'Search title'),
    seoDescription: valueOrFallback(input.seoDescription, 'Search description')
  }
}

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
  taxRateBps: number
  invoicePrefix: string
  receiptFooter: string
}

function valueOrFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback
}

function optionalString(value: string | null | undefined) {
  return value?.trim() || null
}

export function buildSettingsSavePayload(input: SettingsFormLike) {
  return {
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    phone: input.phone,
    email: optionalString(input.email),
    address: input.address,
    mapUrl: optionalString(input.mapUrl),
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    taxRateBps: input.taxRateBps,
    invoicePrefix: input.invoicePrefix.trim() || 'INV',
    receiptFooter: input.receiptFooter.trim()
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

export function formatTaxRate(taxRateBps: number) {
  return `${(taxRateBps / 100).toFixed(2)}%`
}

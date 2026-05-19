export const DEFAULT_SHOP_NAME = 'Luma Nail Studio'

export function resolveShopName(name?: string | null) {
  return name?.trim() || DEFAULT_SHOP_NAME
}

export function shopInitials(name?: string | null) {
  const words = resolveShopName(name).split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => word[0]).join('')

  return initials.toUpperCase() || 'LN'
}

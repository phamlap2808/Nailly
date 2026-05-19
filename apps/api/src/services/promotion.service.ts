import { promotionValidationSchema, type PromotionDiscountType } from '@nailly/shared'

export type PromotionForValidation = {
  code: string
  name: string
  discountType: PromotionDiscountType
  discountValue: number
  minSubtotalCents: number
  maxDiscountCents: number | null
  startsAt: Date | null
  endsAt: Date | null
  usageLimit: number | null
  usedCount: number
  active: boolean
}

export type PromotionValidationResult =
  | {
      valid: true
      code: string
      name: string
      discountCents: number
      discountReason: string
    }
  | {
      valid: false
      code: 'not_found' | 'inactive' | 'not_started' | 'expired' | 'minimum_not_met' | 'usage_limit_reached'
      message: string
      discountCents: 0
    }

export function normalizePromotionCode(code: string) {
  return code.trim().toUpperCase()
}

function nonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.trunc(value))
}

export function calculatePromotionDiscount(promotion: PromotionForValidation, subtotalCents: number) {
  const subtotal = nonNegativeInteger(subtotalCents)
  const rawDiscount = promotion.discountType === 'percent'
    ? Math.round((subtotal * nonNegativeInteger(promotion.discountValue)) / 100)
    : nonNegativeInteger(promotion.discountValue)
  const cappedDiscount = promotion.maxDiscountCents === null
    ? rawDiscount
    : Math.min(rawDiscount, nonNegativeInteger(promotion.maxDiscountCents))

  return Math.min(cappedDiscount, subtotal)
}

export function validatePromotionForSubtotal(
  promotion: PromotionForValidation | null,
  subtotalCents: number,
  now = new Date()
): PromotionValidationResult {
  if (!promotion) {
    return { valid: false, code: 'not_found', message: 'Promotion code was not found.', discountCents: 0 }
  }

  if (!promotion.active) {
    return { valid: false, code: 'inactive', message: 'Promotion code is inactive.', discountCents: 0 }
  }

  if (promotion.startsAt && now < promotion.startsAt) {
    return { valid: false, code: 'not_started', message: 'Promotion code is not active yet.', discountCents: 0 }
  }

  if (promotion.endsAt && now > promotion.endsAt) {
    return { valid: false, code: 'expired', message: 'Promotion code has expired.', discountCents: 0 }
  }

  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    return { valid: false, code: 'usage_limit_reached', message: 'Promotion code has reached its usage limit.', discountCents: 0 }
  }

  if (subtotalCents < promotion.minSubtotalCents) {
    return {
      valid: false,
      code: 'minimum_not_met',
      message: 'Promotion code requires a higher subtotal.',
      discountCents: 0
    }
  }

  const discountCents = calculatePromotionDiscount(promotion, subtotalCents)

  return {
    valid: true,
    code: promotion.code,
    name: promotion.name,
    discountCents,
    discountReason: `Promo ${promotion.code}`
  }
}

export async function validatePromotionCode(
  repository: { getPromotionByCode(code: string): Promise<PromotionForValidation | null> },
  input: unknown
) {
  const parsed = promotionValidationSchema.parse(input)
  const promotion = await repository.getPromotionByCode(parsed.code)

  return validatePromotionForSubtotal(promotion, parsed.subtotalCents)
}

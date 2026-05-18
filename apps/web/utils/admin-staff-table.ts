export function formatCommissionRate(commissionRateBps: number) {
  return `${(commissionRateBps / 100).toFixed(2)}%`
}

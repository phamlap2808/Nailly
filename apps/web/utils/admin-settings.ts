export function formatTaxRate(taxRateBps: number) {
  return `${(taxRateBps / 100).toFixed(2)}%`
}

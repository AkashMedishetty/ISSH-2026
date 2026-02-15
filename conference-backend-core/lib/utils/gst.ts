/**
 * Calculate GST (Goods and Services Tax) at 18% on a base amount.
 * Returns the GST amount rounded to the nearest rupee.
 *
 * @param baseAmount - The base registration amount (non-negative)
 * @returns The GST amount as a non-negative integer
 */
export function calculateGST(baseAmount: number): number {
  return Math.round(baseAmount * 18 / 100);
}

export type BookingTotals = {
  subtotal: number;
  taxAmount: number;
  taxPercentage: number;
  commissionAmount: number;
  commissionPercent: number;
  totalPrice: number;
};

export function computeBookingTotals(
  group: Array<{ price?: number | null; taxAmount?: number | null }>,
  taxPercentage: number,
  commissionPercent: number,
): BookingTotals {
  const subtotal = group.reduce((sum, item) => sum + Number(item?.price || 0), 0);
  const taxPct = Number.isFinite(taxPercentage) && taxPercentage >= 0 ? taxPercentage : 0;
  const taxAmount = group.reduce((sum, item) => {
    const storedTax = Number(item?.taxAmount || 0);
    if (storedTax > 0) return sum + storedTax;
    return sum + (Number(item?.price || 0) * taxPct) / 100;
  }, 0);
  const commPct =
    Number.isFinite(commissionPercent) && commissionPercent >= 0 ? commissionPercent : 15;
  const commissionAmount = Number(((subtotal * commPct) / 100).toFixed(2));
  const totalPrice = Number((subtotal + commissionAmount + taxAmount).toFixed(2));
  return {
    subtotal,
    taxAmount,
    taxPercentage: taxPct,
    commissionAmount,
    commissionPercent: commPct,
    totalPrice,
  };
}

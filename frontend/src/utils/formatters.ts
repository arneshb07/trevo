/**
 * Formats an integer or decimal rupee amount into Indian currency format (e.g. ₹10,00,000)
 */
export function formatRupees(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  
  // Format according to Indian numbering system (lakhs/crores)
  const str = absAmount.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Formats a decimal into percentage string (e.g. 0.12 -> 12%, 0.008 -> 0.8%)
 */
export function formatPercent(rate: number | null | undefined): string {
  if (rate === undefined || rate === null || isNaN(rate) || rate === 0) return '0%';
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

/**
 * Formats a number of days (e.g. Day 5 or 5 Days)
 */
export function formatDays(days: number | null | undefined, prefix: 'Day' | 'days' = 'Day'): string {
  if (days === undefined || days === null) return 'N/A';
  return prefix === 'Day' ? `Day ${days}` : `${days} days`;
}

/**
 * Returns human-readable label for ActionType
 */
export function getActionLabel(action: string): string {
  switch (action) {
    case 'BANK_FINANCE':
      return 'BANK_FINANCE';
    case 'SUPPLIER_FINANCE':
      return 'SUPPLIER_FINANCE';
    case 'DELAY':
      return 'DELAY';
    case 'PAY_NOW':
      return 'PAY_NOW';
    case 'PAY_MATURITY':
      return 'PAY_MATURITY';
    default:
      return action;
  }
}

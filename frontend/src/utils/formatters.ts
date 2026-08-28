/**
 * Formats an integer rupee amount into Indian currency format (e.g. ₹10,00,000)
 */
export function formatRupees(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
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
export function formatPercent(rate: number | undefined): string {
  if (rate === undefined || rate === null || rate === 0) return '0%';
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}

/**
 * Returns readable label for ActionType
 */
export function getActionLabel(action: string): string {
  switch (action) {
    case 'BANK_FINANCE':
      return 'BANK FINANCE';
    case 'SUPPLIER_FINANCE':
      return 'SUPPLIER FINANCE';
    case 'DELAY':
      return 'DELAY';
    case 'PAY_NOW':
      return 'PAY NOW';
    case 'PAY_MATURITY':
      return 'PAY MATURITY';
    default:
      return action;
  }
}

/**
 * Returns styling classes for Action badges
 */
export function getActionBadgeStyle(action: string): { bg: string; text: string; border: string } {
  switch (action) {
    case 'BANK_FINANCE':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30'
      };
    case 'SUPPLIER_FINANCE':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/30'
      };
    case 'DELAY':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30'
      };
    case 'PAY_NOW':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30'
      };
    case 'PAY_MATURITY':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30'
      };
    default:
      return {
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700'
      };
  }
}

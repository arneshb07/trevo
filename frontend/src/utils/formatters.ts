/**
 * Formats an integer or decimal rupee amount into Indian currency format (e.g. ₹10,00,000)
 */
export function formatRupees(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const roundedAmount = Math.round(absAmount * 100) / 100;
  const integerPart = Math.floor(roundedAmount);
  const decimalPart = roundedAmount % 1 === 0 ? '' : `.${Math.round((roundedAmount % 1) * 100).toString().padStart(2, '0')}`;

  // Format according to Indian numbering system (lakhs/crores)
  const str = integerPart.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${formatted}${decimalPart}`;
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
export function getActionLabel(action: string | undefined): string {
  if (!action) return 'Not available';

  switch (action) {
    case 'BANK_FINANCE':
      return 'Bank financing';
    case 'SUPPLIER_FINANCE':
      return 'Supplier financing';
    case 'DELAY':
      return 'Delay';
    case 'PAY_NOW':
      return 'Pay now';
    case 'PAY_MATURITY':
      return 'Pay at maturity';
    default:
      return action;
  }
}

/** Converts engine identifiers into readable business-facing text. */
export function formatEngineTerm(value: string | undefined): string {
  if (!value) return 'Not available';

  const labels: Record<string, string> = {
    BANK_FACILITY_CAPACITY_BOUND: 'Bank financing capacity fully utilized',
    BANK_LIMIT: 'Bank financing capacity',
    LIQUIDITY_BUFFER: 'Protected liquidity preservation',
    LIQUIDITY_BUFFER_PRESERVATION: 'Protected liquidity preservation',
    OBLIGATION_PAYROLL_PROTECTION: 'Payroll obligation protection',
    SUPPLIER_LIMIT: 'Supplier financing capacity',
    SUPPLIER_SCF_PROGRAM_DRAW: 'Supplier financing program draw',
    buffer_day12: 'Protected buffer through Day 12',
  };

  return labels[value] || value.replace(/_/g, ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

export function formatEngineExplanation(value: string | undefined): string {
  if (!value) return 'Not available';

  return value
    .replace(/BANK_FINANCE/g, getActionLabel('BANK_FINANCE'))
    .replace(/SUPPLIER_FINANCE/g, getActionLabel('SUPPLIER_FINANCE'))
    .replace(/PAY_MATURITY/g, getActionLabel('PAY_MATURITY'))
    .replace(/PAY_NOW/g, getActionLabel('PAY_NOW'))
    .replace(/LIQUIDITY_BUFFER/g, 'protected liquidity')
    .replace(/BANK_FACILITY_CAPACITY_BOUND/g, 'bank financing capacity');
}

/**
 * Returns CSS class names for action badges (used with the CSS design system)
 */
export function getActionBadgeClass(action: string | undefined): string {
  switch (action) {
    case 'BANK_FINANCE':
      return 'badge-primary';
    case 'SUPPLIER_FINANCE':
      return 'badge-primary';
    case 'DELAY':
      return 'badge-warning';
    case 'PAY_NOW':
    case 'PAY_MATURITY':
      return 'badge-neutral';
    default:
      return 'badge-neutral';
  }
}

/**
 * Returns Tailwind badge token classes for legacy presentation components.
 */
export function getActionBadgeStyle(action: string | undefined): {
  bg: string;
  text: string;
  border: string;
} {
  switch (action) {
    case 'BANK_FINANCE':
    case 'SUPPLIER_FINANCE':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
      };
    case 'DELAY':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
      };
    case 'PAY_NOW':
    case 'PAY_MATURITY':
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/20',
      };
  }
}

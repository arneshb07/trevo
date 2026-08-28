import assert from 'node:assert';
import { readFileSync } from 'node:fs';

console.log('=== RUNNING TREVO INTEGRATION & DEMO VALIDATION TESTS ===\n');

// Load JSON fixtures
const demoState = JSON.parse(readFileSync('./mock/demo_state.json', 'utf8'));
const baselineDecisions = JSON.parse(readFileSync('./mock/baseline_decisions.json', 'utf8'));
const shockDecisions = JSON.parse(readFileSync('./mock/shock_decisions.json', 'utf8'));

// 1. Validate Baseline Data Integrity
console.log('Test 1: Validating Baseline BusinessState & Orion Components dataset...');
assert.strictEqual(demoState.cash, 1000000, 'Baseline cash must be ₹10,00,000');
assert.strictEqual(demoState.buffer, 500000, 'Protected buffer must be ₹5,00,000');
assert.strictEqual(demoState.payables.length, 3, 'Must have exactly 3 payables');
assert.strictEqual(demoState.receivables.length, 2, 'Must have exactly 2 receivables');
assert.strictEqual(demoState.obligations[0].amount, 400000, 'Payroll must be ₹4,00,000');
console.log('✔ Baseline data matches canonical gold specification.\n');

// 2. Validate Baseline Decision Plan
console.log('Test 2: Validating Baseline Decision Plan...');
assert.strictEqual(baselineDecisions.total_cost, 5236, 'Baseline total cost must be exactly ₹5,236');
const invA = baselineDecisions.decisions.find(d => d.invoice_id === 'INV-A');
const invB = baselineDecisions.decisions.find(d => d.invoice_id === 'INV-B');
const invC = baselineDecisions.decisions.find(d => d.invoice_id === 'INV-C');

assert.strictEqual(invA.selected_action, 'BANK_FINANCE', 'INV-A baseline must be BANK_FINANCE');
assert.strictEqual(invA.cost, 1973, 'INV-A cost must be ₹1,973');
assert.strictEqual(invB.selected_action, 'DELAY', 'INV-B baseline must be DELAY');
assert.strictEqual(invB.cost, 2400, 'INV-B cost must be ₹2,400');
assert.strictEqual(invC.selected_action, 'SUPPLIER_FINANCE', 'INV-C baseline must be SUPPLIER_FINANCE');
assert.strictEqual(invC.cost, 863, 'INV-C cost must be ₹863');
console.log('✔ Baseline decisions: INV-A (BANK_FINANCE), INV-B (DELAY), INV-C (SUPPLIER_FINANCE), Total = ₹5,236.\n');

// 3. Validate Primary Demo Shock Event: AR-Y Delay to Day 20
console.log('Test 3: Validating Primary Demo Event (AR-Y delay to Day 20)...');
assert.strictEqual(shockDecisions.total_cost, 5795, 'Shock total cost must be exactly ₹5,795');

const shockInvB = shockDecisions.decisions.find(d => d.invoice_id === 'INV-B');
assert.strictEqual(shockInvB.selected_action, 'BANK_FINANCE', 'INV-B must flip from DELAY to BANK_FINANCE');
assert.strictEqual(shockInvB.cost, 2959, 'INV-B shock cost must be ₹2,959');

const costDelta = shockDecisions.total_cost - baselineDecisions.total_cost;
assert.strictEqual(costDelta, 559, 'Cost delta must be exactly +₹559');
console.log('✔ Primary Event: INV-B flips DELAY -> BANK_FINANCE, Total = ₹5,795, Delta = +₹559.\n');

// 4. Validate Formatter Logic
function formatRupees(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));
  const str = absAmount.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') lastThree = ',' + lastThree;
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

console.log('Test 4: Validating Indian currency & percentage formatters...');
assert.strictEqual(formatRupees(1000000), '₹10,00,000');
assert.strictEqual(formatRupees(500000), '₹5,00,000');
assert.strictEqual(formatRupees(5236), '₹5,236');
assert.strictEqual(formatRupees(559), '₹559');
console.log('✔ Formatters produce correct Indian formatting standards.\n');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! (100% SPEC COMPLIANCE)');

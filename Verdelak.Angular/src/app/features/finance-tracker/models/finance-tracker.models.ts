export interface FinanceDashboard {
  accounts: FinanceAccountBalance[];
  bills: FinanceRecurringBill[];
  yearSnapshots: FinanceYearSnapshot[];
  donations: FinanceDonation[];
  totalDebt: number;
  totalSavings: number;
  netWorth: number;
  currentYearDonationTotal: number;
}

export interface FinanceAccountBalance {
  id: number;
  name: string;
  category: string;
  balance: number;
  isDebt: boolean;
  asOfDate: string;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
}

export interface FinanceAccountBalanceHistory {
  id: number;
  financeAccountBalanceId: number;
  balance: number;
  asOfDate: string;
  recordedAt: string;
  notes: string | null;
}

export interface FinanceNetWorthHistory {
  asOfDate: string;
  totalDebt: number;
  totalSavings: number;
  netWorth: number;
  debtChange: number | null;
  savingsChange: number | null;
  netWorthChange: number | null;
  accountUpdates: number;
}

export interface FinanceBillReport {
  unpaidByMonth: FinanceUnpaidBillsByMonth[];
  paymentHistory: FinanceBillPaymentHistory[];
  paidTotalsByCategory: FinancePaidTotalByCategory[];
  upcomingAndOverdue: FinanceUpcomingBill[];
  annualBillSummaries: FinanceBillAnnualSummary[];
  monthlyPaidTotals: FinanceMonthlyPaidTotal[];
  frequencySummaries: FinanceBillFrequencySummary[];
  overdueRisks: FinanceBillOverdueRisk[];
  paymentVariances: FinanceBillPaymentVariance[];
}

export interface FinanceUnpaidBillsByMonth {
  year: number;
  month: number;
  unpaidCount: number;
  expectedTotal: number;
}

export interface FinanceBillPaymentHistory {
  billId: number;
  billName: string;
  category: string;
  year: number;
  month: number;
  isPaid: boolean;
  paidDate: string | null;
  expectedAmount: number | null;
  amountPaid: number | null;
  notes: string | null;
}

export interface FinancePaidTotalByCategory {
  category: string;
  paidTotal: number;
  paymentCount: number;
}

export interface FinanceUpcomingBill {
  billId: number;
  billName: string;
  category: string;
  dueDate: string;
  expectedAmount: number | null;
  isPaid: boolean;
  paidDate: string | null;
  amountPaid: number | null;
  status: string;
}

export interface FinanceBillAnnualSummary {
  billId: number;
  billName: string;
  category: string;
  dueCount: number;
  paidCount: number;
  expectedTotal: number;
  paidTotal: number;
  averagePaid: number;
  paymentRate: number;
  lastPaidDate: string | null;
}

export interface FinanceMonthlyPaidTotal {
  year: number;
  month: number;
  paidTotal: number;
  paymentCount: number;
}

export interface FinanceBillFrequencySummary {
  frequency: string;
  billCount: number;
  expectedMonthlyTotal: number;
}

export interface FinanceBillOverdueRisk {
  billId: number;
  billName: string;
  category: string;
  dueCount: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  unpaidExpectedTotal: number;
  oldestUnpaidDueDate: string | null;
  lastPaidDate: string | null;
  paymentRate: number;
}

export interface FinanceBillPaymentVariance {
  billId: number;
  billName: string;
  category: string;
  paymentCount: number;
  expectedAmount: number;
  averagePaid: number;
  averageVariance: number;
  largestOverage: number;
  largestUnderage: number;
}

export interface FinanceBillBatchResult {
  updatedCount: number;
  skippedCount: number;
  message: string;
}

export interface FinanceAccountBalanceUpsert {
  name: string;
  category: string;
  balance: number;
  isDebt: boolean;
  asOfDate: string | null;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
}

export interface FinanceRecurringBill {
  id: number;
  name: string;
  category: string;
  expectedAmount: number | null;
  dueDay: number;
  billingIntervalMonths: number;
  startMonth: number;
  isDueForSelectedMonth: boolean;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  isPaidForSelectedMonth: boolean;
  paidDate: string | null;
  amountPaid: number | null;
  paymentNotes: string | null;
}

export interface FinanceRecurringBillUpsert {
  name: string;
  category: string;
  expectedAmount: number | null;
  dueDay: number;
  billingIntervalMonths: number;
  startMonth: number;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
}

export interface FinanceRecurringBillPaymentUpdate {
  isPaid: boolean;
  paidDate: string | null;
  amountPaid: number | null;
  notes: string | null;
}

export interface FinanceYearSnapshot {
  id: number;
  snapshotDate: string;
  totalDebt: number;
  totalSavings: number;
  difference: number;
  isFrozen: boolean;
  notes: string | null;
}

export interface FinanceYearSnapshotUpsert {
  snapshotDate: string;
  totalDebt: number;
  totalSavings: number;
  difference: number;
  isFrozen: boolean;
  notes: string | null;
}

export interface FinanceDonation {
  id: number;
  donationDate: string;
  organization: string;
  amount: number;
  method: string | null;
  hasReceipt: boolean;
  receiptReference: string | null;
  notes: string | null;
}

export interface FinanceDonationUpsert {
  donationDate: string;
  organization: string;
  amount: number;
  method: string | null;
  hasReceipt: boolean;
  receiptReference: string | null;
  notes: string | null;
}

export interface FinanceTrackerSettings {
  accountCategories: string[];
  billCategories: string[];
  donationMethods: string[];
  yearCloseMonth: number;
  yearCloseDay: number;
  defaultReportYear: number;
  defaultReportMonth: number;
}

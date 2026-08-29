import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FinanceBillReportsPanel } from '../finance-bill-reports-panel/finance-bill-reports-panel';
import { FinanceDonationsPanel } from '../finance-donations-panel/finance-donations-panel';
import { FinanceReportsExportPanel } from '../finance-reports-export-panel/finance-reports-export-panel';
import { CsvDownloadService } from '../../../shared/services/csv-download.service';
import { FinanceTrackerService } from '../finance-tracker.service';
import {
  FinanceAccountBalance,
  FinanceAccountBalanceHistory,
  FinanceAccountBalanceUpsert,
  FinanceBillReport,
  FinanceDonation,
  FinanceDonationUpsert,
  FinanceNetWorthHistory,
  FinanceRecurringBill,
  FinanceRecurringBillUpsert,
  FinanceTrackerSettings,
  FinanceYearSnapshot,
  FinanceYearSnapshotUpsert
} from '../models/finance-tracker.models';

interface AccountForm {
  id: number | null;
  name: string;
  category: string;
  balance: number;
  isDebt: boolean;
  asOfDate: string;
  sortOrder: number;
  isActive: boolean;
  notes: string;
}

interface BillForm {
  id: number | null;
  name: string;
  category: string;
  expectedAmount: number | null;
  dueDay: number;
  billingIntervalMonths: number;
  startMonth: number;
  sortOrder: number;
  isActive: boolean;
  notes: string;
}

interface BillPaymentForm {
  billId: number | null;
  billName: string;
  isPaid: boolean;
  paidDate: string;
  amountPaid: number | null;
  notes: string;
}

interface SnapshotForm {
  id: number | null;
  snapshotDate: string;
  totalDebt: number;
  totalSavings: number;
  difference: number;
  isFrozen: boolean;
  notes: string;
}

interface DonationForm {
  id: number | null;
  donationDate: string;
  organization: string;
  amount: number;
  method: string;
  hasReceipt: boolean;
  receiptReference: string;
  notes: string;
}

type TabKey = 'balances' | 'bills' | 'snapshots' | 'donations';

interface SnapshotTrend {
  snapshot: FinanceYearSnapshot;
  debtChange: number | null;
  savingsChange: number | null;
  differenceChange: number | null;
}

interface SnapshotChartRow extends SnapshotTrend {
  debtWidth: number;
  savingsWidth: number;
  differenceWidth: number;
}

interface DonationOrganizationSummary {
  organization: string;
  total: number;
  count: number;
  receiptedTotal: number;
  missingReceiptTotal: number;
}

interface BillCategorySummary {
  category: string;
  paid: number;
  total: number;
  expectedTotal: number;
  paidTotal: number;
  remainingTotal: number;
}

interface BillInsightCard {
  label: string;
  value: string;
  detail: string;
  tone: string;
}

interface BillBurnDownRow {
  label: string;
  amount: number;
  count: number;
  width: number;
  tone: string;
}

interface AccountHistoryTrend {
  history: FinanceAccountBalanceHistory;
  change: number | null;
  percentChange: number | null;
  chartTop: number;
}

interface SnapshotSummary {
  first: FinanceYearSnapshot | null;
  latest: FinanceYearSnapshot | null;
  debtChange: number | null;
  savingsChange: number | null;
  differenceChange: number | null;
}

interface SnapshotComparison {
  from: FinanceYearSnapshot | null;
  to: FinanceYearSnapshot | null;
  debtChange: number | null;
  savingsChange: number | null;
  differenceChange: number | null;
}

interface DashboardHistoryChartRow extends FinanceNetWorthHistory {
  debtHeight: number;
  savingsHeight: number;
  netWorthTop: number;
}

interface AccountCompositionRow {
  category: string;
  total: number;
  isDebt: boolean;
  width: number;
}

type ReportValue = string | number | boolean | null | undefined;
type ReportRow = Record<string, ReportValue>;

@Component({
  selector: 'app-finance-dashboard-page',
  imports: [CommonModule, FormsModule, FinanceBillReportsPanel, FinanceDonationsPanel, FinanceReportsExportPanel],
  templateUrl: './finance-dashboard-page.html',
  styleUrl: './finance-dashboard-page.scss'
})
export class FinanceTrackerPage implements OnInit {
  readonly viewModel = this;

  readonly accounts = signal<FinanceAccountBalance[]>([]);
  readonly accountHistory = signal<FinanceAccountBalanceHistory[]>([]);
  readonly netWorthHistory = signal<FinanceNetWorthHistory[]>([]);
  readonly billReport = signal<FinanceBillReport>(this.emptyBillReport());
  readonly bills = signal<FinanceRecurringBill[]>([]);
  readonly snapshots = signal<FinanceYearSnapshot[]>([]);
  readonly donations = signal<FinanceDonation[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly message = signal<string | null>(null);
  readonly activeTab = signal<TabKey>('balances');
  readonly selectedYear = signal(new Date().getFullYear());
  readonly selectedMonth = signal(new Date().getMonth() + 1);
  readonly reportStartDate = signal(`${new Date().getFullYear()}-01-01`);
  readonly reportEndDate = signal(new Date().toISOString().slice(0, 10));
  readonly settings = signal<FinanceTrackerSettings>(this.defaultSettings());
  readonly compareFromSnapshotId = signal<number | null>(null);
  readonly compareToSnapshotId = signal<number | null>(null);
  readonly donationSearch = signal('');
  readonly donationReceiptFilter = signal<'all' | 'withReceipt' | 'missingReceipt'>('all');
  readonly receiptReportTaxYear = signal(new Date().getFullYear());
  readonly totalDebt = signal(0);
  readonly totalSavings = signal(0);
  readonly netWorth = signal(0);
  readonly donationTotal = signal(0);
  readonly accountForm = signal<AccountForm>(this.emptyAccountForm());
  readonly billForm = signal<BillForm>(this.emptyBillForm());
  readonly billPaymentForm = signal<BillPaymentForm>(this.emptyBillPaymentForm());
  readonly snapshotForm = signal<SnapshotForm>(this.emptySnapshotForm());
  readonly donationForm = signal<DonationForm>(this.emptyDonationForm());

  readonly groupedAccounts = computed(() => {
    const groups = new Map<string, FinanceAccountBalance[]>();
    this.accounts()
      .filter(account => account.isActive)
      .forEach(account => {
        const key = account.category || 'Other';
        groups.set(key, [...(groups.get(key) ?? []), account]);
      });

    return [...groups.entries()].map(([category, accounts]) => ({
      category,
      accounts,
      total: accounts.reduce((sum, account) => sum + account.balance, 0),
      isDebt: accounts.every(account => account.isDebt)
    }));
  });

  readonly assetGroups = computed(() => this.groupedAccounts().filter(group => !group.isDebt));
  readonly debtGroups = computed(() => this.groupedAccounts().filter(group => group.isDebt));
  readonly accountCompositionRows = computed<AccountCompositionRow[]>(() => {
    const groups = this.groupedAccounts();
    const max = Math.max(1, ...groups.map(group => Math.abs(group.total)));
    return groups
      .map(group => ({
        category: group.category,
        total: group.total,
        isDebt: group.isDebt,
        width: this.percentOf(group.total, max)
      }))
      .sort((left, right) => Math.abs(right.total) - Math.abs(left.total) || left.category.localeCompare(right.category));
  });
  readonly activeAccountCount = computed(() => this.accounts().filter(account => account.isActive).length);
  readonly debtAccountCount = computed(() => this.accounts().filter(account => account.isActive && account.isDebt).length);
  readonly oldestBalanceDate = computed(() => {
    const activeDates = this.accounts()
      .filter(account => account.isActive && account.asOfDate)
      .map(account => account.asOfDate.slice(0, 10))
      .sort();

    return activeDates[0] ?? null;
  });
  readonly currentSnapshotPreview = computed(() => ({
    snapshotDate: this.yearCloseDate(),
    totalDebt: this.totalDebt(),
    totalSavings: this.totalSavings(),
    difference: this.netWorth()
  }));
  readonly latestSnapshot = computed(() => {
    const snapshots = [...this.snapshots()].sort((left, right) => right.snapshotDate.localeCompare(left.snapshotDate));
    return snapshots[0] ?? null;
  });
  readonly latestSnapshotDebt = computed(() => this.latestSnapshot()?.totalDebt ?? null);
  readonly latestSnapshotSavings = computed(() => this.latestSnapshot()?.totalSavings ?? null);
  readonly latestSnapshotDifference = computed(() => this.latestSnapshot()?.difference ?? null);
  readonly snapshotTrends = computed<SnapshotTrend[]>(() => {
    const snapshots = [...this.snapshots()].sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
    return snapshots.map((snapshot, index) => {
      const previous = index > 0 ? snapshots[index - 1] : null;
      return {
        snapshot,
        debtChange: previous ? snapshot.totalDebt - previous.totalDebt : null,
        savingsChange: previous ? snapshot.totalSavings - previous.totalSavings : null,
        differenceChange: previous ? snapshot.difference - previous.difference : null
      };
    }).reverse();
  });
  readonly snapshotChartRows = computed<SnapshotChartRow[]>(() => {
    const trends = this.snapshotTrends();
    const maxValue = Math.max(
      1,
      ...trends.flatMap(trend => [
        Math.abs(trend.snapshot.totalDebt),
        Math.abs(trend.snapshot.totalSavings),
        Math.abs(trend.snapshot.difference)
      ])
    );

    return trends.map(trend => ({
      ...trend,
      debtWidth: this.percentOf(trend.snapshot.totalDebt, maxValue),
      savingsWidth: this.percentOf(trend.snapshot.totalSavings, maxValue),
      differenceWidth: this.percentOf(trend.snapshot.difference, maxValue)
    }));
  });
  readonly snapshotSummary = computed<SnapshotSummary>(() => {
    const snapshots = [...this.snapshots()].sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
    const first = snapshots[0] ?? null;
    const latest = snapshots[snapshots.length - 1] ?? null;

    return {
      first,
      latest,
      debtChange: first && latest ? latest.totalDebt - first.totalDebt : null,
      savingsChange: first && latest ? latest.totalSavings - first.totalSavings : null,
      differenceChange: first && latest ? latest.difference - first.difference : null
    };
  });
  readonly bestDifferenceGain = computed(() =>
    this.snapshotTrends()
      .filter(trend => trend.differenceChange !== null)
      .sort((left, right) => (right.differenceChange ?? 0) - (left.differenceChange ?? 0))[0] ?? null);
  readonly weakestDifferenceYear = computed(() =>
    this.snapshotTrends()
      .filter(trend => trend.differenceChange !== null)
      .sort((left, right) => (left.differenceChange ?? 0) - (right.differenceChange ?? 0))[0] ?? null);
  readonly bestDebtReduction = computed(() =>
    this.snapshotTrends()
      .filter(trend => trend.debtChange !== null)
      .sort((left, right) => (left.debtChange ?? 0) - (right.debtChange ?? 0))[0] ?? null);
  readonly bestSavingsGain = computed(() =>
    this.snapshotTrends()
      .filter(trend => trend.savingsChange !== null)
      .sort((left, right) => (right.savingsChange ?? 0) - (left.savingsChange ?? 0))[0] ?? null);
  readonly sortedSnapshots = computed(() =>
    [...this.snapshots()].sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate)));
  readonly snapshotComparison = computed<SnapshotComparison>(() => {
    const from = this.snapshots().find(snapshot => snapshot.id === this.compareFromSnapshotId()) ?? null;
    const to = this.snapshots().find(snapshot => snapshot.id === this.compareToSnapshotId()) ?? null;

    return {
      from,
      to,
      debtChange: from && to ? to.totalDebt - from.totalDebt : null,
      savingsChange: from && to ? to.totalSavings - from.totalSavings : null,
      differenceChange: from && to ? to.difference - from.difference : null
    };
  });
  readonly yearCloseSnapshotExists = computed(() =>
    this.snapshots().some(snapshot => snapshot.snapshotDate.slice(0, 10) === this.currentSnapshotPreview().snapshotDate));
  readonly priorSnapshot = computed(() => {
    const snapshots = [...this.snapshots()].sort((left, right) => right.snapshotDate.localeCompare(left.snapshotDate));
    return snapshots[1] ?? null;
  });
  readonly latestSnapshotComparison = computed(() => {
    const latest = this.latestSnapshot();
    const prior = this.priorSnapshot();
    return {
      prior,
      debtChange: latest && prior ? latest.totalDebt - prior.totalDebt : null,
      savingsChange: latest && prior ? latest.totalSavings - prior.totalSavings : null,
      differenceChange: latest && prior ? latest.difference - prior.difference : null
    };
  });
  readonly yearCloseChecklist = computed(() => {
    const existing = this.snapshots().find(snapshot => snapshot.snapshotDate.slice(0, 10) === this.currentSnapshotPreview().snapshotDate);

    return [
      {
        label: 'Current balances entered',
        complete: this.activeAccountCount() > 0,
        detail: `${this.activeAccountCount()} active accounts`
      },
      {
        label: 'Balances dated for close year',
        complete: this.accounts().some(account => account.isActive && account.asOfDate?.slice(0, 4) === String(this.selectedYear())),
        detail: String(this.selectedYear())
      },
      {
        label: 'Year-close snapshot exists',
        complete: !!existing,
        detail: this.currentSnapshotPreview().snapshotDate
      },
      {
        label: 'Snapshot frozen',
        complete: existing?.isFrozen ?? false,
        detail: existing ? (existing.isFrozen ? 'Frozen' : 'Not frozen') : 'No snapshot yet'
      }
    ];
  });

  readonly unpaidBills = computed(() => this.bills().filter(bill => bill.isActive && !bill.isPaidForSelectedMonth).length);
  readonly selectedAccountHistoryTrends = computed<AccountHistoryTrend[]>(() => {
    const history = [...this.accountHistory()].sort((left, right) => left.asOfDate.localeCompare(right.asOfDate));
    const balances = history.map(item => item.balance);
    const min = Math.min(...balances, 0);
    const max = Math.max(...balances, 1);
    const range = Math.max(1, max - min);
    return history.map((item, index) => ({
      history: item,
      change: index > 0 ? item.balance - history[index - 1].balance : null,
      percentChange: index > 0 && history[index - 1].balance !== 0
        ? ((item.balance - history[index - 1].balance) / Math.abs(history[index - 1].balance)) * 100
        : null,
      chartTop: 100 - Math.round(((item.balance - min) / range) * 100)
    })).reverse();
  });
  readonly selectedAccountHistoryLatest = computed(() => this.selectedAccountHistoryTrends()[0]?.history ?? null);
  readonly selectedAccountHistoryOldest = computed(() => {
    const trends = this.selectedAccountHistoryTrends();
    return trends.length ? trends[trends.length - 1].history : null;
  });
  readonly selectedAccountLifetimeChange = computed(() => {
    const latest = this.selectedAccountHistoryLatest();
    const oldest = this.selectedAccountHistoryOldest();
    return latest && oldest ? latest.balance - oldest.balance : null;
  });
  readonly selectedAccountLastChange = computed(() => this.selectedAccountHistoryTrends()[0]?.change ?? null);
  readonly selectedAccountHighest = computed(() =>
    this.accountHistory().length
      ? [...this.accountHistory()].sort((left, right) => right.balance - left.balance)[0]
      : null);
  readonly selectedAccountLowest = computed(() =>
    this.accountHistory().length
      ? [...this.accountHistory()].sort((left, right) => left.balance - right.balance)[0]
      : null);
  readonly selectedAccountAverageBalance = computed(() => {
    const history = this.accountHistory();
    return history.length ? history.reduce((sum, item) => sum + item.balance, 0) / history.length : null;
  });
  readonly latestNetWorthHistory = computed(() => this.netWorthHistory()[0] ?? null);
  readonly oldestNetWorthHistory = computed(() =>
    this.netWorthHistory().length ? this.netWorthHistory()[this.netWorthHistory().length - 1] : null);
  readonly netWorthHistoryChange = computed(() => {
    const latest = this.latestNetWorthHistory();
    const oldest = this.oldestNetWorthHistory();
    return latest && oldest ? latest.netWorth - oldest.netWorth : null;
  });
  readonly netWorthHistoryRows = computed(() => this.netWorthHistory().slice(0, 12));
  readonly previousNetWorthHistory = computed(() => this.netWorthHistory()[1] ?? null);
  readonly previousMonthComparison = computed(() => {
    const latest = this.latestNetWorthHistory();
    const previous = this.previousNetWorthHistory();
    return {
      previous,
      debtChange: latest && previous ? latest.totalDebt - previous.totalDebt : null,
      savingsChange: latest && previous ? latest.totalSavings - previous.totalSavings : null,
      netWorthChange: latest && previous ? latest.netWorth - previous.netWorth : null
    };
  });
  readonly accountHistoryChartRows = computed(() => this.selectedAccountHistoryTrends().slice().reverse());
  readonly netWorthChartRows = computed(() => {
    const rows = this.netWorthHistory().slice().reverse();
    const values = rows.map(row => row.netWorth);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = Math.max(1, max - min);
    return rows.map(row => ({
      ...row,
      chartTop: 100 - Math.round(((row.netWorth - min) / range) * 100)
    }));
  });
  readonly dashboardHistoryChartRows = computed<DashboardHistoryChartRow[]>(() => {
    const rows = this.netWorthHistory().slice(0, 12).reverse();
    const maxBalance = Math.max(1, ...rows.flatMap(row => [Math.abs(row.totalDebt), Math.abs(row.totalSavings)]));
    const netWorthValues = rows.map(row => row.netWorth);
    const minNetWorth = Math.min(...netWorthValues, 0);
    const maxNetWorth = Math.max(...netWorthValues, 1);
    const netWorthRange = Math.max(1, maxNetWorth - minNetWorth);

    return rows.map(row => ({
      ...row,
      debtHeight: this.percentOf(row.totalDebt, maxBalance),
      savingsHeight: this.percentOf(row.totalSavings, maxBalance),
      netWorthTop: 100 - Math.round(((row.netWorth - minNetWorth) / netWorthRange) * 100)
    }));
  });
  readonly dashboardSnapshotChartRows = computed(() =>
    this.snapshotChartRows().slice().reverse().slice(-8));
  readonly financialYearStartDate = computed(() => this.financialYearStartFor(this.selectedYear(), this.selectedMonth()));
  readonly financialYearEndDate = computed(() => this.addDays(this.addYears(this.financialYearStartDate(), 1), -1));
  readonly financialYearLabel = computed(() =>
    `${this.dateInput(this.financialYearStartDate().toISOString())} to ${this.dateInput(this.financialYearEndDate().toISOString())}`);
  readonly maxUnpaidBills = computed(() =>
    Math.max(1, ...this.billReport().unpaidByMonth.map(row => row.unpaidCount)));
  readonly maxPaidCategoryTotal = computed(() =>
    Math.max(1, ...this.billReport().paidTotalsByCategory.map(row => row.paidTotal)));
  readonly maxMonthlyPaidTotal = computed(() =>
    Math.max(1, ...this.billReport().monthlyPaidTotals.map(row => row.paidTotal)));
  readonly maxFrequencyExpectedTotal = computed(() =>
    Math.max(1, ...this.billReport().frequencySummaries.map(row => row.expectedMonthlyTotal)));
  readonly maxOverdueRiskTotal = computed(() =>
    Math.max(1, ...this.billReport().overdueRisks.map(row => row.unpaidExpectedTotal)));
  readonly topAnnualBillSummaries = computed(() =>
    [...this.billReport().annualBillSummaries]
      .sort((left, right) => right.paidTotal - left.paidTotal || left.billName.localeCompare(right.billName))
      .slice(0, 8));
  readonly topOverdueRisks = computed(() =>
    this.billReport().overdueRisks.slice(0, 8));
  readonly topPaymentVariances = computed(() =>
    this.billReport().paymentVariances
      .filter(row => row.averageVariance !== 0 || row.largestOverage !== 0 || row.largestUnderage !== 0)
      .slice(0, 8));
  readonly recentBillPaymentHistory = computed(() => this.billReport().paymentHistory.slice(0, 12));
  readonly activeBills = computed(() => this.bills().filter(bill => bill.isActive));
  readonly paidBills = computed(() => this.activeBills().filter(bill => bill.isPaidForSelectedMonth).length);
  readonly monthlyExpectedTotal = computed(() =>
    this.activeBills().reduce((sum, bill) => sum + (bill.expectedAmount ?? 0), 0));
  readonly monthlyPaidTotal = computed(() =>
    this.activeBills()
      .filter(bill => bill.isPaidForSelectedMonth)
      .reduce((sum, bill) => sum + (bill.amountPaid ?? bill.expectedAmount ?? 0), 0));
  readonly monthlyRemainingTotal = computed(() => Math.max(0, this.monthlyExpectedTotal() - this.monthlyPaidTotal()));
  readonly billProgressPercent = computed(() => {
    const total = this.activeBills().length;
    return total ? Math.round((this.paidBills() / total) * 100) : 0;
  });
  readonly overdueBillCount = computed(() =>
    this.activeBills().filter(bill => this.billStatus(bill) === 'overdue').length);
  readonly dueSoonBillCount = computed(() =>
    this.activeBills().filter(bill => this.billStatus(bill) === 'dueSoon').length);
  readonly annualExpectedBillTotal = computed(() =>
    this.billReport().annualBillSummaries.reduce((sum, row) => sum + row.expectedTotal, 0));
  readonly annualPaidBillTotal = computed(() =>
    this.billReport().annualBillSummaries.reduce((sum, row) => sum + row.paidTotal, 0));
  readonly annualBillPaymentRate = computed(() => {
    const due = this.billReport().annualBillSummaries.reduce((sum, row) => sum + row.dueCount, 0);
    const paid = this.billReport().annualBillSummaries.reduce((sum, row) => sum + row.paidCount, 0);
    return due ? Math.round((paid / due) * 100) : 0;
  });
  readonly largestOverdueRisk = computed(() =>
    this.billReport().overdueRisks
      .filter(row => row.unpaidCount > 0 || row.overdueCount > 0)
      .sort((left, right) => right.unpaidExpectedTotal - left.unpaidExpectedTotal || right.overdueCount - left.overdueCount)[0] ?? null);
  readonly largestPaymentVariance = computed(() =>
    this.billReport().paymentVariances
      .filter(row => row.averageVariance !== 0 || row.largestOverage !== 0 || row.largestUnderage !== 0)
      .sort((left, right) => Math.abs(right.averageVariance) - Math.abs(left.averageVariance) || left.billName.localeCompare(right.billName))[0] ?? null);
  readonly billInsightCards = computed<BillInsightCard[]>(() => {
    const risk = this.largestOverdueRisk();
    const variance = this.largestPaymentVariance();
    return [
      {
        label: 'Month progress',
        value: `${this.billProgressPercent()}%`,
        detail: `${this.paidBills()} of ${this.activeBills().length} active bills paid / ${this.money(this.monthlyRemainingTotal())} remaining`,
        tone: this.unpaidBills() === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : this.overdueBillCount() ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-amber-200 bg-amber-50 text-amber-900'
      },
      {
        label: 'Year payment rate',
        value: `${this.annualBillPaymentRate()}%`,
        detail: `${this.money(this.annualPaidBillTotal())} paid of ${this.money(this.annualExpectedBillTotal())} expected`,
        tone: this.annualBillPaymentRate() >= 95 ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'app-token-soft-surface app-token-text-strong'
      },
      {
        label: 'Largest risk',
        value: risk ? risk.billName : 'None',
        detail: risk ? `${risk.overdueCount} overdue / ${this.money(risk.unpaidExpectedTotal)} unpaid expected` : 'No unpaid risk rows for the selected year',
        tone: risk ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      },
      {
        label: 'Largest variance',
        value: variance ? variance.billName : 'Stable',
        detail: variance ? `Average variance ${this.signedMoney(variance.averageVariance)} across ${variance.paymentCount} payments` : 'No recurring bill variance yet',
        tone: variance ? 'app-token-soft-surface app-token-text-strong' : 'border-slate-200 bg-slate-50 text-slate-800'
      }
    ];
  });
  readonly billBurnDownRows = computed<BillBurnDownRow[]>(() => {
    const total = Math.max(1, this.monthlyExpectedTotal());
    const overdueAmount = this.activeBills()
      .filter(bill => this.billStatus(bill) === 'overdue')
      .reduce((sum, bill) => sum + (bill.expectedAmount ?? 0), 0);
    const dueSoonAmount = this.activeBills()
      .filter(bill => this.billStatus(bill) === 'dueSoon')
      .reduce((sum, bill) => sum + (bill.expectedAmount ?? 0), 0);
    const openAmount = Math.max(0, this.monthlyRemainingTotal() - overdueAmount - dueSoonAmount);

    return [
      {
        label: 'Paid',
        amount: this.monthlyPaidTotal(),
        count: this.paidBills(),
        width: this.percentOf(this.monthlyPaidTotal(), total),
        tone: 'bg-emerald-500'
      },
      {
        label: 'Overdue',
        amount: overdueAmount,
        count: this.overdueBillCount(),
        width: this.percentOf(overdueAmount, total),
        tone: 'bg-rose-500'
      },
      {
        label: 'Due soon',
        amount: dueSoonAmount,
        count: this.dueSoonBillCount(),
        width: this.percentOf(dueSoonAmount, total),
        tone: 'bg-amber-500'
      },
      {
        label: 'Open later',
        amount: openAmount,
        count: Math.max(0, this.unpaidBills() - this.overdueBillCount() - this.dueSoonBillCount()),
        width: this.percentOf(openAmount, total),
        tone: 'bg-slate-400'
      }
    ].filter(row => row.amount > 0 || row.count > 0);
  });
  readonly upcomingBills = computed(() =>
    this.activeBills()
      .filter(bill => !bill.isPaidForSelectedMonth)
      .sort((left, right) => left.dueDay - right.dueDay || left.name.localeCompare(right.name))
      .slice(0, 5));
  readonly selectedMonthName = computed(() =>
    new Date(this.selectedYear(), this.selectedMonth() - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }));
  readonly billCategorySummaries = computed<BillCategorySummary[]>(() => {
    const map = new Map<string, BillCategorySummary>();
    this.activeBills().forEach(bill => {
      const key = bill.category || 'Other';
      const summary = map.get(key) ?? {
        category: key,
        paid: 0,
        total: 0,
        expectedTotal: 0,
        paidTotal: 0,
        remainingTotal: 0
      };
      const expected = bill.expectedAmount ?? 0;
      const paid = bill.isPaidForSelectedMonth ? bill.amountPaid ?? expected : 0;
      summary.total += 1;
      summary.paid += bill.isPaidForSelectedMonth ? 1 : 0;
      summary.expectedTotal += expected;
      summary.paidTotal += paid;
      summary.remainingTotal += Math.max(0, expected - paid);
      map.set(key, summary);
    });

    return [...map.values()].sort((left, right) => left.category.localeCompare(right.category));
  });
  readonly monthCloseChecklist = computed(() => [
    {
      label: 'Bills paid',
      complete: this.activeBills().length > 0 && this.unpaidBills() === 0,
      detail: `${this.paidBills()} of ${this.activeBills().length}`
    },
    {
      label: 'Balances updated',
      complete: this.accounts().some(account => account.isActive && account.asOfDate?.slice(0, 7) === `${this.selectedYear()}-${String(this.selectedMonth()).padStart(2, '0')}`),
      detail: this.oldestBalanceDate() ?? 'No active balances'
    },
    {
      label: 'Donations reviewed',
      complete: this.missingReceiptDonations().length === 0,
      detail: `${this.missingReceiptDonations().length} missing receipts`
    },
    {
      label: 'Year snapshot ready',
      complete: this.snapshots().some(snapshot => snapshot.snapshotDate.slice(0, 10) === this.currentSnapshotPreview().snapshotDate),
      detail: this.currentSnapshotPreview().snapshotDate
    }
  ]);
  readonly filteredDonations = computed(() => {
    const search = this.donationSearch().trim().toLowerCase();
    const receiptFilter = this.donationReceiptFilter();

    return this.donations().filter(donation => {
      const matchesSearch = !search ||
        donation.organization.toLowerCase().includes(search) ||
        (donation.method ?? '').toLowerCase().includes(search) ||
        (donation.receiptReference ?? '').toLowerCase().includes(search) ||
        (donation.notes ?? '').toLowerCase().includes(search);
      const matchesReceipt = receiptFilter === 'all' ||
        (receiptFilter === 'withReceipt' && donation.hasReceipt) ||
        (receiptFilter === 'missingReceipt' && !donation.hasReceipt);

      return matchesSearch && matchesReceipt;
    });
  });
  readonly donationCount = computed(() => this.donations().length);
  readonly donationReceiptCount = computed(() => this.donations().filter(donation => donation.hasReceipt).length);
  readonly missingReceiptDonations = computed(() => this.donations().filter(donation => !donation.hasReceipt));
  readonly missingReceiptTotal = computed(() =>
    this.missingReceiptDonations().reduce((sum, donation) => sum + donation.amount, 0));
  readonly averageDonation = computed(() => this.donationCount() ? this.donationTotal() / this.donationCount() : 0);
  readonly largestDonation = computed(() => {
    const donations = [...this.donations()].sort((left, right) => right.amount - left.amount);
    return donations[0] ?? null;
  });
  readonly donationOrganizationSummaries = computed<DonationOrganizationSummary[]>(() => {
    const map = new Map<string, DonationOrganizationSummary>();
    this.donations().forEach(donation => {
      const key = donation.organization || 'Other';
      const summary = map.get(key) ?? {
        organization: key,
        total: 0,
        count: 0,
        receiptedTotal: 0,
        missingReceiptTotal: 0
      };
      summary.total += donation.amount;
      summary.count += 1;
      if (donation.hasReceipt) {
        summary.receiptedTotal += donation.amount;
      } else {
        summary.missingReceiptTotal += donation.amount;
      }
      map.set(key, summary);
    });

    return [...map.values()].sort((left, right) => right.total - left.total || left.organization.localeCompare(right.organization));
  });
  readonly accountCategorySuggestions = computed(() =>
    this.mergeSuggestions(this.settings().accountCategories, this.accounts().map(account => account.category)));
  readonly billCategorySuggestions = computed(() =>
    this.mergeSuggestions(this.settings().billCategories, this.bills().map(bill => bill.category)));
  readonly donationMethodSuggestions = computed(() =>
    this.mergeSuggestions(this.settings().donationMethods, this.donations().map(donation => donation.method ?? '')));
  readonly reportAccounts = computed(() =>
    this.accounts()
      .filter(account => this.inReportDateRange(account.asOfDate))
      .sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name)));
  readonly reportBills = computed(() =>
    this.bills()
      .filter(bill => this.billFallsInReportRange(bill))
      .sort((left, right) => left.dueDay - right.dueDay || left.name.localeCompare(right.name)));
  readonly reportSnapshots = computed(() =>
    this.snapshotTrends()
      .filter(trend => this.inReportDateRange(trend.snapshot.snapshotDate))
      .slice()
      .reverse());
  readonly reportSelectedAccountHistoryTrends = computed(() =>
    this.selectedAccountHistoryTrends()
      .filter(trend => this.inReportDateRange(trend.history.asOfDate)));
  readonly reportNetWorthHistory = computed(() =>
    this.netWorthHistory()
      .filter(row => this.inReportDateRange(row.asOfDate)));
  readonly reportDonations = computed(() =>
    this.filteredDonations()
      .filter(donation => this.inReportDateRange(donation.donationDate))
      .sort((left, right) => left.donationDate.localeCompare(right.donationDate) || left.organization.localeCompare(right.organization)));
  readonly reportMissingReceiptDonations = computed(() =>
    this.reportDonations().filter(donation => !donation.hasReceipt));
  readonly taxYearReceiptNeededDonations = computed(() =>
    this.filteredDonations()
      .filter(donation => !donation.hasReceipt && this.dateInput(donation.donationDate).slice(0, 4) === String(this.receiptReportTaxYear()))
      .sort((left, right) => left.donationDate.localeCompare(right.donationDate) || left.organization.localeCompare(right.organization)));
  readonly reportDonationTotal = computed(() =>
    this.reportDonations().reduce((sum, donation) => sum + donation.amount, 0));
  readonly reportMissingReceiptTotal = computed(() =>
    this.reportMissingReceiptDonations().reduce((sum, donation) => sum + donation.amount, 0));
  readonly taxYearReceiptNeededTotal = computed(() =>
    this.taxYearReceiptNeededDonations().reduce((sum, donation) => sum + donation.amount, 0));
  readonly reportDonationReceiptCount = computed(() =>
    this.reportDonations().filter(donation => donation.hasReceipt).length);
  readonly reportDonationOrganizationSummaries = computed<DonationOrganizationSummary[]>(() => {
    const map = new Map<string, DonationOrganizationSummary>();
    this.reportDonations().forEach(donation => {
      const key = donation.organization || 'Other';
      const summary = map.get(key) ?? {
        organization: key,
        total: 0,
        count: 0,
        receiptedTotal: 0,
        missingReceiptTotal: 0
      };
      summary.total += donation.amount;
      summary.count += 1;
      if (donation.hasReceipt) {
        summary.receiptedTotal += donation.amount;
      } else {
        summary.missingReceiptTotal += donation.amount;
      }
      map.set(key, summary);
    });

    return [...map.values()].sort((left, right) => right.total - left.total || left.organization.localeCompare(right.organization));
  });

  exportBalancesCsv(): void {
    this.downloadCsv(`finance-balances-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportAccountRows());
  }

  exportSelectedAccountHistoryCsv(): void {
    const account = this.accountForm();
    const rows = this.reportSelectedAccountHistoryTrends()
      .slice()
      .reverse()
      .map(trend => ({
        Account: account.name,
        Category: account.category,
        Type: account.isDebt ? 'Debt' : 'Asset',
        AsOfDate: this.dateInput(trend.history.asOfDate),
        Balance: trend.history.balance,
        Change: trend.change ?? '',
        RecordedAt: trend.history.recordedAt,
        Notes: trend.history.notes ?? ''
      }));

    const safeName = (account.name || 'account').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    this.downloadCsv(`finance-${safeName}-history-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, rows);
  }

  exportNetWorthHistoryCsv(): void {
    this.downloadCsv(`finance-net-worth-history-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportNetWorthRows());
  }

  exportBillPaymentHistoryCsv(): void {
    const rows = this.billReport().paymentHistory.map(payment => ({
      Year: payment.year,
      Month: payment.month,
      Bill: payment.billName,
      Category: payment.category,
      IsPaid: payment.isPaid ? 'Yes' : 'No',
      PaidDate: payment.paidDate ? this.dateInput(payment.paidDate) : '',
      ExpectedAmount: payment.expectedAmount ?? '',
      AmountPaid: payment.amountPaid ?? '',
      Notes: payment.notes ?? ''
    }));
    this.downloadCsv(`finance-bill-payment-history-${this.selectedYear()}.csv`, rows);
  }

  exportBillAnalyticsCsv(): void {
    this.downloadCsv(`finance-bill-analytics-${this.selectedYear()}.csv`, [
      ...this.reportBillAnnualSummaryRows(),
      ...this.reportBillOverdueRiskRows(),
      ...this.reportBillPaymentVarianceRows()
    ]);
  }

  exportBillsCsv(): void {
    this.downloadCsv(`finance-bills-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportBillRows());
  }

  exportSnapshotsCsv(): void {
    this.downloadCsv(`finance-year-snapshots-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportSnapshotRows());
  }

  exportSnapshotSummaryCsv(): void {
    const summary = this.snapshotSummary();
    const rows = [
      {
        Metric: 'First Snapshot',
        Date: summary.first ? this.dateInput(summary.first.snapshotDate) : '',
        Debt: summary.first?.totalDebt ?? '',
        Savings: summary.first?.totalSavings ?? '',
        Difference: summary.first?.difference ?? ''
      },
      {
        Metric: 'Latest Snapshot',
        Date: summary.latest ? this.dateInput(summary.latest.snapshotDate) : '',
        Debt: summary.latest?.totalDebt ?? '',
        Savings: summary.latest?.totalSavings ?? '',
        Difference: summary.latest?.difference ?? ''
      },
      {
        Metric: 'Overall Change',
        Date: '',
        Debt: summary.debtChange ?? '',
        Savings: summary.savingsChange ?? '',
        Difference: summary.differenceChange ?? ''
      },
      this.snapshotHighlightRow('Best Difference Gain', this.bestDifferenceGain()),
      this.snapshotHighlightRow('Weakest Difference Year', this.weakestDifferenceYear()),
      this.snapshotHighlightRow('Best Debt Reduction', this.bestDebtReduction()),
      this.snapshotHighlightRow('Best Savings Gain', this.bestSavingsGain())
    ];
    this.downloadCsv('finance-year-snapshot-summary.csv', rows);
  }

  exportSnapshotComparisonCsv(): void {
    const comparison = this.snapshotComparison();
    const rows = [
      {
        Metric: 'From',
        Date: comparison.from ? this.dateInput(comparison.from.snapshotDate) : '',
        Debt: comparison.from?.totalDebt ?? '',
        Savings: comparison.from?.totalSavings ?? '',
        Difference: comparison.from?.difference ?? ''
      },
      {
        Metric: 'To',
        Date: comparison.to ? this.dateInput(comparison.to.snapshotDate) : '',
        Debt: comparison.to?.totalDebt ?? '',
        Savings: comparison.to?.totalSavings ?? '',
        Difference: comparison.to?.difference ?? ''
      },
      {
        Metric: 'Change',
        Date: '',
        Debt: comparison.debtChange ?? '',
        Savings: comparison.savingsChange ?? '',
        Difference: comparison.differenceChange ?? ''
      }
    ];
    this.downloadCsv('finance-year-snapshot-comparison.csv', rows);
  }

  exportDonationsCsv(): void {
    this.downloadCsv(`finance-donations-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportDonationRows());
  }

  exportDonationOrganizationCsv(): void {
    this.downloadCsv(`finance-donation-organizations-${this.reportStartDate()}-to-${this.reportEndDate()}.csv`, this.reportDonationOrganizationRows());
  }

  printDonationReport(): void {
    const donations = this.reportDonations();
    const rows = donations.map(donation => `
      <tr>
        <td>${this.escapeHtml(this.dateInput(donation.donationDate))}</td>
        <td>${this.escapeHtml(donation.organization)}</td>
        <td>${this.escapeHtml(donation.method ?? '')}</td>
        <td class="right">${this.money(donation.amount)}</td>
        <td>${donation.hasReceipt ? 'Yes' : 'No'}</td>
        <td>${this.escapeHtml(donation.receiptReference ?? '')}</td>
      </tr>`).join('');

    this.printHtml(`Donation Report - ${this.reportRangeLabel()}`, `
      <h1>Donation Report</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <p class="summary">Total donations: ${this.money(this.reportDonationTotal())} across ${donations.length} entries.</p>
      <p class="summary">Receipts on file: ${this.reportDonationReceiptCount()} of ${donations.length}. Missing receipt total: ${this.money(this.reportMissingReceiptTotal())}.</p>
      <table>
        <thead><tr><th>Date</th><th>Organization</th><th>Method</th><th>Amount</th><th>Receipt</th><th>Receipt reference</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No donations found.</td></tr>'}</tbody>
      </table>`);
  }

  printReceiptNeededReport(): void {
    const donations = this.taxYearReceiptNeededDonations();
    const rows = donations.map(donation => `
      <tr>
        <td>${this.escapeHtml(this.dateInput(donation.donationDate))}</td>
        <td>${this.escapeHtml(donation.organization)}</td>
        <td>${this.escapeHtml(donation.method ?? '')}</td>
        <td class="right">${this.money(donation.amount)}</td>
        <td>${this.escapeHtml(donation.notes ?? '')}</td>
      </tr>`).join('');

    this.printHtml(`Receipt Needed Report - ${this.receiptReportTaxYear()}`, `
      <h1>Receipt Needed Report</h1>
      <p class="summary">Tax year: ${this.receiptReportTaxYear()}</p>
      <p class="summary">${donations.length} donations need receipts, totaling ${this.money(this.taxYearReceiptNeededTotal())}.</p>
      <table>
        <thead><tr><th>Date</th><th>Organization</th><th>Method</th><th>Amount</th><th>Notes</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">No missing receipts.</td></tr>'}</tbody>
      </table>`);
  }

  printSelectedAccountHistoryReport(): void {
    const account = this.accountForm();
    const rows = this.reportSelectedAccountHistoryTrends()
      .slice()
      .reverse()
      .map(trend => `
        <tr>
          <td>${this.escapeHtml(this.dateInput(trend.history.asOfDate))}</td>
          <td class="right">${this.money(trend.history.balance)}</td>
          <td class="right">${this.signedMoney(trend.change)}</td>
          <td class="right">${trend.percentChange === null ? '' : `${trend.percentChange.toFixed(2)}%`}</td>
          <td>${this.escapeHtml(trend.history.notes ?? '')}</td>
        </tr>`).join('');

    this.printHtml(`Account History - ${account.name || 'Selected Account'} - ${this.reportRangeLabel()}`, `
      <h1>Account History</h1>
      <p class="summary">Account: ${this.escapeHtml(account.name || 'Selected Account')}</p>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <table>
        <thead><tr><th>As Of</th><th>Balance</th><th>Change</th><th>Percent Change</th><th>Notes</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">No account history in range.</td></tr>'}</tbody>
      </table>`);
  }

  printNetWorthHistoryReport(): void {
    const rows = this.reportNetWorthHistory().map(row => `
      <tr>
        <td>${this.escapeHtml(this.dateInput(row.asOfDate))}</td>
        <td class="right">${this.money(row.totalDebt)}</td>
        <td class="right">${this.signedMoney(row.debtChange)}</td>
        <td class="right">${this.money(row.totalSavings)}</td>
        <td class="right">${this.signedMoney(row.savingsChange)}</td>
        <td class="right">${this.money(row.netWorth)}</td>
        <td class="right">${this.signedMoney(row.netWorthChange)}</td>
        <td class="right">${row.accountUpdates}</td>
      </tr>`).join('');

    this.printHtml(`Net Worth History - ${this.reportRangeLabel()}`, `
      <h1>Net Worth History</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <table>
        <thead><tr><th>As Of</th><th>Total Debt</th><th>Debt Change</th><th>Total Savings</th><th>Savings Change</th><th>Net Worth</th><th>Net Worth Change</th><th>Updates</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8">No net worth history in range.</td></tr>'}</tbody>
      </table>`);
  }

  printFinanceSummaryReport(): void {
    const billRows = this.reportBills().map(bill => `
      <tr>
        <td>${this.escapeHtml(String(bill.dueDay))}</td>
        <td>${this.escapeHtml(bill.name)}</td>
        <td>${this.escapeHtml(bill.category)}</td>
        <td>${this.escapeHtml(this.billFrequencyLabel(bill))}</td>
        <td class="right">${this.money(bill.expectedAmount)}</td>
        <td>${bill.isPaidForSelectedMonth ? 'Paid' : 'Open'}</td>
      </tr>`).join('');
    const snapshotRows = this.reportSnapshots().map(trend => `
      <tr>
        <td>${this.escapeHtml(this.dateInput(trend.snapshot.snapshotDate))}</td>
        <td class="right">${this.money(trend.snapshot.totalDebt)}</td>
        <td class="right">${this.money(trend.snapshot.totalSavings)}</td>
        <td class="right">${this.money(trend.snapshot.difference)}</td>
      </tr>`).join('');

    this.printHtml(`Finance Summary - ${this.reportRangeLabel()}`, `
      <h1>Finance Summary</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <p class="summary">Current debt: ${this.money(this.totalDebt())}. Current savings: ${this.money(this.totalSavings())}. Difference: ${this.money(this.netWorth())}.</p>
      <p class="summary">Bills: ${this.paidBills()} of ${this.activeBills().length} paid for ${this.escapeHtml(this.selectedMonthName())}. Donations in range: ${this.money(this.reportDonationTotal())}.</p>
      <h2>Monthly Bills</h2>
      <table>
        <thead><tr><th>Due</th><th>Name</th><th>Category</th><th>Frequency</th><th>Expected</th><th>Status</th></tr></thead>
        <tbody>${billRows || '<tr><td colspan="6">No bills in range.</td></tr>'}</tbody>
      </table>
      <h2>Year Snapshots</h2>
      <table>
        <thead><tr><th>Date</th><th>Debt</th><th>Savings</th><th>Difference</th></tr></thead>
        <tbody>${snapshotRows || '<tr><td colspan="4">No snapshots in range.</td></tr>'}</tbody>
      </table>`);
  }

  printBalancesReport(): void {
    const rows = this.reportAccounts().map(account => `
      <tr>
        <td>${this.escapeHtml(account.name)}</td>
        <td>${this.escapeHtml(account.category)}</td>
        <td>${account.isDebt ? 'Debt' : 'Asset'}</td>
        <td class="right">${this.money(account.balance)}</td>
        <td>${this.escapeHtml(this.dateInput(account.asOfDate))}</td>
        <td>${account.isActive ? 'Yes' : 'No'}</td>
      </tr>`).join('');

    this.printHtml(`Account Balances - ${this.reportRangeLabel()}`, `
      <h1>Account Balances</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <p class="summary">Current totals: debt ${this.money(this.totalDebt())}, savings ${this.money(this.totalSavings())}, difference ${this.money(this.netWorth())}.</p>
      <table>
        <thead><tr><th>Account</th><th>Category</th><th>Type</th><th>Balance</th><th>As Of</th><th>Active</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No account balances in range.</td></tr>'}</tbody>
      </table>`);
  }

  printBillsReport(): void {
    const rows = this.reportBills().map(bill => `
      <tr>
        <td>${this.escapeHtml(this.selectedMonthName())}</td>
        <td>${this.escapeHtml(String(bill.dueDay))}</td>
        <td>${this.escapeHtml(bill.name)}</td>
        <td>${this.escapeHtml(bill.category)}</td>
        <td>${this.escapeHtml(this.billFrequencyLabel(bill))}</td>
        <td class="right">${this.money(bill.expectedAmount)}</td>
        <td>${bill.isPaidForSelectedMonth ? 'Yes' : 'No'}</td>
        <td>${bill.paidDate ? this.escapeHtml(this.dateInput(bill.paidDate)) : ''}</td>
        <td class="right">${bill.amountPaid === null ? '' : this.money(bill.amountPaid)}</td>
      </tr>`).join('');
    const overdueRows = this.billReport().overdueRisks.map(row => `
      <tr>
        <td>${this.escapeHtml(row.billName)}</td>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${row.paidCount} / ${row.dueCount}</td>
        <td class="right">${row.overdueCount}</td>
        <td class="right">${this.money(row.unpaidExpectedTotal)}</td>
        <td>${row.oldestUnpaidDueDate ? this.escapeHtml(this.dateInput(row.oldestUnpaidDueDate)) : ''}</td>
        <td class="right">${row.paymentRate.toFixed(0)}%</td>
      </tr>`).join('');
    const varianceRows = this.billReport().paymentVariances.map(row => `
      <tr>
        <td>${this.escapeHtml(row.billName)}</td>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${row.paymentCount}</td>
        <td class="right">${this.money(row.expectedAmount)}</td>
        <td class="right">${this.money(row.averagePaid)}</td>
        <td class="right">${this.signedMoney(row.averageVariance)}</td>
      </tr>`).join('');

    this.printHtml(`Monthly Bills - ${this.reportRangeLabel()}`, `
      <h1>Monthly Bills</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <p class="summary">${this.paidBills()} of ${this.activeBills().length} paid for ${this.escapeHtml(this.selectedMonthName())}. Remaining ${this.money(this.monthlyRemainingTotal())}.</p>
      <table>
        <thead><tr><th>Month</th><th>Due</th><th>Name</th><th>Category</th><th>Frequency</th><th>Expected</th><th>Paid</th><th>Paid Date</th><th>Amount Paid</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="9">No bills in range.</td></tr>'}</tbody>
      </table>
      <h2>Overdue Risk</h2>
      <table>
        <thead><tr><th>Bill</th><th>Category</th><th>Paid / Due</th><th>Overdue</th><th>Unpaid Expected</th><th>Oldest Due</th><th>Rate</th></tr></thead>
        <tbody>${overdueRows || '<tr><td colspan="7">No overdue risk rows.</td></tr>'}</tbody>
      </table>
      <h2>Payment Variance</h2>
      <table>
        <thead><tr><th>Bill</th><th>Category</th><th>Payments</th><th>Expected</th><th>Average Paid</th><th>Average Variance</th></tr></thead>
        <tbody>${varianceRows || '<tr><td colspan="6">No payment variance rows.</td></tr>'}</tbody>
      </table>`);
  }
  printBillAnalyticsReport(): void {
    const annualRows = this.billReport().annualBillSummaries.map(row => `
      <tr>
        <td>${this.escapeHtml(row.billName)}</td>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${row.paidCount} / ${row.dueCount}</td>
        <td class="right">${row.paymentRate.toFixed(0)}%</td>
        <td class="right">${this.money(row.expectedTotal)}</td>
        <td class="right">${this.money(row.paidTotal)}</td>
        <td class="right">${this.money(row.averagePaid)}</td>
        <td>${row.lastPaidDate ? this.escapeHtml(this.dateInput(row.lastPaidDate)) : ''}</td>
      </tr>`).join('');
    const monthlyRows = this.billReport().monthlyPaidTotals.map(row => `
      <tr>
        <td>${row.month}/${row.year}</td>
        <td class="right">${this.money(row.paidTotal)}</td>
        <td class="right">${row.paymentCount}</td>
      </tr>`).join('');
    const categoryRows = this.billReport().paidTotalsByCategory.map(row => `
      <tr>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${this.money(row.paidTotal)}</td>
        <td class="right">${row.paymentCount}</td>
      </tr>`).join('');
    const frequencyRows = this.billReport().frequencySummaries.map(row => `
      <tr>
        <td>${this.escapeHtml(row.frequency)}</td>
        <td class="right">${row.billCount}</td>
        <td class="right">${this.money(row.expectedMonthlyTotal)}</td>
      </tr>`).join('');
    const overdueRows = this.billReport().overdueRisks.map(row => `
      <tr>
        <td>${this.escapeHtml(row.billName)}</td>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${row.unpaidCount}</td>
        <td class="right">${row.overdueCount}</td>
        <td class="right">${this.money(row.unpaidExpectedTotal)}</td>
        <td class="right">${row.paymentRate.toFixed(0)}%</td>
      </tr>`).join('');
    const varianceRows = this.billReport().paymentVariances.map(row => `
      <tr>
        <td>${this.escapeHtml(row.billName)}</td>
        <td>${this.escapeHtml(row.category)}</td>
        <td class="right">${row.paymentCount}</td>
        <td class="right">${this.money(row.expectedAmount)}</td>
        <td class="right">${this.money(row.averagePaid)}</td>
        <td class="right">${this.signedMoney(row.averageVariance)}</td>
        <td class="right">${this.signedMoney(row.largestOverage)}</td>
        <td class="right">${this.signedMoney(row.largestUnderage)}</td>
      </tr>`).join('');

    this.printHtml(`Recurring Bill Analytics - ${this.selectedYear()}`, `
      <h1>Recurring Bill Analytics</h1>
      <p class="summary">Year: ${this.selectedYear()}</p>
      <p class="summary">Selected month: ${this.escapeHtml(this.selectedMonthName())}. Paid ${this.paidBills()} of ${this.activeBills().length}; remaining ${this.money(this.monthlyRemainingTotal())}.</p>
      <h2>Bill-Level Yearly Analytics</h2>
      <table>
        <thead><tr><th>Bill</th><th>Category</th><th>Paid / Due</th><th>Rate</th><th>Expected</th><th>Paid</th><th>Average</th><th>Last Paid</th></tr></thead>
        <tbody>${annualRows || '<tr><td colspan="8">No bill-level analytics.</td></tr>'}</tbody>
      </table>
      <h2>Monthly Paid Totals</h2>
      <table>
        <thead><tr><th>Month</th><th>Paid Total</th><th>Payment Count</th></tr></thead>
        <tbody>${monthlyRows || '<tr><td colspan="3">No monthly paid totals.</td></tr>'}</tbody>
      </table>
      <h2>Paid By Category</h2>
      <table>
        <thead><tr><th>Category</th><th>Paid Total</th><th>Payment Count</th></tr></thead>
        <tbody>${categoryRows || '<tr><td colspan="3">No category totals.</td></tr>'}</tbody>
      </table>
      <h2>Frequency Breakdown</h2>
      <table>
        <thead><tr><th>Frequency</th><th>Bill Count</th><th>Expected Monthly Total</th></tr></thead>
        <tbody>${frequencyRows || '<tr><td colspan="3">No frequency rows.</td></tr>'}</tbody>
      </table>
      <h2>Overdue Risk</h2>
      <table>
        <thead><tr><th>Bill</th><th>Category</th><th>Unpaid</th><th>Overdue</th><th>Unpaid Expected</th><th>Rate</th></tr></thead>
        <tbody>${overdueRows || '<tr><td colspan="6">No overdue risk rows.</td></tr>'}</tbody>
      </table>
      <h2>Payment Variance</h2>
      <table>
        <thead><tr><th>Bill</th><th>Category</th><th>Payments</th><th>Expected</th><th>Average Paid</th><th>Average Variance</th><th>Largest Overage</th><th>Largest Underage</th></tr></thead>
        <tbody>${varianceRows || '<tr><td colspan="8">No payment variance rows.</td></tr>'}</tbody>
      </table>`);
  }

  printSnapshotsReport(): void {
    const rows = this.reportSnapshots().map(trend => `
      <tr>
        <td>${this.escapeHtml(this.dateInput(trend.snapshot.snapshotDate))}</td>
        <td class="right">${this.money(trend.snapshot.totalDebt)}</td>
        <td class="right">${this.signedMoney(trend.debtChange)}</td>
        <td class="right">${this.money(trend.snapshot.totalSavings)}</td>
        <td class="right">${this.signedMoney(trend.savingsChange)}</td>
        <td class="right">${this.money(trend.snapshot.difference)}</td>
        <td class="right">${this.signedMoney(trend.differenceChange)}</td>
        <td>${trend.snapshot.isFrozen ? 'Yes' : 'No'}</td>
      </tr>`).join('');

    this.printHtml(`Year Snapshots - ${this.reportRangeLabel()}`, `
      <h1>Year Snapshots</h1>
      <p class="summary">Range: ${this.escapeHtml(this.reportRangeLabel())}</p>
      <table>
        <thead><tr><th>Date</th><th>Debt</th><th>Debt Change</th><th>Savings</th><th>Savings Change</th><th>Difference</th><th>Difference Change</th><th>Frozen</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="8">No snapshots in range.</td></tr>'}</tbody>
      </table>`);
  }

  exportFinanceWorkbook(): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);

    this.service.exportWorkbook(this.selectedYear(), this.selectedMonth(), this.reportStartDate(), this.reportEndDate()).subscribe({
      next: response => {
        const fallback = `finance-workbook-${this.reportStartDate()}-to-${this.reportEndDate()}.xlsx`;
        const filename = this.filenameFromDisposition(response.headers.get('content-disposition')) ?? fallback;
        this.downloadBlob(filename, response.body ?? new Blob([]));
        this.message.set('Finance workbook exported.');
      },
      error: (err: any) => {
        this.error.set(err.error ?? err.message ?? 'Failed to export finance workbook.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  constructor(
    private readonly service: FinanceTrackerService,
    private readonly csvDownload: CsvDownloadService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.service.getSettings().subscribe({
      next: settings => {
        this.settings.set(settings);
        this.selectedYear.set(settings.defaultReportYear);
        this.selectedMonth.set(settings.defaultReportMonth);
        this.receiptReportTaxYear.set(settings.defaultReportYear);
        this.reportStartDate.set(`${settings.defaultReportYear}-01-01`);
        this.reportEndDate.set(this.endOfMonth(settings.defaultReportYear, settings.defaultReportMonth));
        this.load();
      },
      error: () => this.load()
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.getDashboard(this.selectedYear(), this.selectedMonth()).subscribe({
      next: dashboard => {
        this.accounts.set(dashboard.accounts);
        this.accountHistory.set([]);
        this.bills.set(dashboard.bills);
        this.snapshots.set(dashboard.yearSnapshots);
        this.ensureSnapshotComparisonSelection(dashboard.yearSnapshots);
        this.donations.set(dashboard.donations);
        this.totalDebt.set(dashboard.totalDebt);
        this.totalSavings.set(dashboard.totalSavings);
        this.netWorth.set(dashboard.netWorth);
        this.donationTotal.set(dashboard.currentYearDonationTotal);
        this.loadNetWorthHistory();
        this.loadBillReport();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load finance tracker.'),
      complete: () => this.loading.set(false)
    });
  }

  setTab(tab: TabKey): void {
    this.activeTab.set(tab);
  }

  loadNetWorthHistory(): void {
    this.service.getNetWorthHistory().subscribe({
      next: history => this.netWorthHistory.set(history),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load net worth history.')
    });
  }

  loadBillReport(): void {
    this.service.getBillReport(this.selectedYear(), this.selectedMonth()).subscribe({
      next: report => this.billReport.set(report),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load recurring bill reports.')
    });
  }

  setAccountField<K extends keyof AccountForm>(field: K, value: AccountForm[K]): void {
    this.accountForm.set({ ...this.accountForm(), [field]: value });
  }

  setBillField<K extends keyof BillForm>(field: K, value: BillForm[K]): void {
    this.billForm.set({ ...this.billForm(), [field]: value });
  }

  setBillPaymentField<K extends keyof BillPaymentForm>(field: K, value: BillPaymentForm[K]): void {
    this.billPaymentForm.set({ ...this.billPaymentForm(), [field]: value });
  }

  setSnapshotField<K extends keyof SnapshotForm>(field: K, value: SnapshotForm[K]): void {
    const next = { ...this.snapshotForm(), [field]: value };
    if (field === 'totalDebt' || field === 'totalSavings') {
      next.difference = Number(next.totalSavings || 0) - Number(next.totalDebt || 0);
    }
    this.snapshotForm.set(next);
  }

  setDonationField<K extends keyof DonationForm>(field: K, value: DonationForm[K]): void {
    this.donationForm.set({ ...this.donationForm(), [field]: value });
  }

  selectAccount(account: FinanceAccountBalance): void {
    this.accountForm.set({
      id: account.id,
      name: account.name,
      category: account.category,
      balance: account.balance,
      isDebt: account.isDebt,
      asOfDate: this.dateInput(account.asOfDate),
      sortOrder: account.sortOrder,
      isActive: account.isActive,
      notes: account.notes ?? ''
    });
    this.loadAccountHistory(account.id);
  }

  saveAccount(): void {
    const form = this.accountForm();
    if (!form.name.trim()) {
      this.error.set('Account name is required.');
      return;
    }

    const payload: FinanceAccountBalanceUpsert = {
      name: form.name.trim(),
      category: form.category.trim() || (form.isDebt ? 'Debt' : 'Savings'),
      balance: Number(form.balance) || 0,
      isDebt: form.isDebt,
      asOfDate: form.asOfDate || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      notes: form.notes.trim() || null
    };

    const request = form.id
      ? this.service.updateAccount(form.id, payload)
      : this.service.createAccount(payload);
    this.save(request, `${payload.name} saved.`, () => this.accountForm.set(this.emptyAccountForm()));
  }

  loadAccountHistory(accountId: number): void {
    this.service.getAccountHistory(accountId).subscribe({
      next: history => this.accountHistory.set(history),
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to load account history.')
    });
  }

  deleteAccount(): void {
    const form = this.accountForm();
    if (!form.id || !window.confirm(`Delete ${form.name}?`)) {
      return;
    }

    this.save(this.service.deleteAccount(form.id), `${form.name} deleted.`, () => this.accountForm.set(this.emptyAccountForm()));
  }

  selectBill(bill: FinanceRecurringBill): void {
    this.billForm.set({
      id: bill.id,
      name: bill.name,
      category: bill.category,
      expectedAmount: bill.expectedAmount,
      dueDay: bill.dueDay,
      billingIntervalMonths: bill.billingIntervalMonths,
      startMonth: bill.startMonth,
      sortOrder: bill.sortOrder,
      isActive: bill.isActive,
      notes: bill.notes ?? ''
    });
    this.billPaymentForm.set({
      billId: bill.id,
      billName: bill.name,
      isPaid: bill.isPaidForSelectedMonth,
      paidDate: bill.paidDate ? this.dateInput(bill.paidDate) : this.today(),
      amountPaid: bill.amountPaid ?? bill.expectedAmount,
      notes: bill.paymentNotes ?? ''
    });
  }

  saveBill(): void {
    const form = this.billForm();
    if (!form.name.trim()) {
      this.error.set('Bill name is required.');
      return;
    }

    const payload: FinanceRecurringBillUpsert = {
      name: form.name.trim(),
      category: form.category.trim() || 'Household',
      expectedAmount: form.expectedAmount === null ? null : Number(form.expectedAmount),
      dueDay: Math.max(1, Math.min(31, Number(form.dueDay) || 1)),
      billingIntervalMonths: Math.max(1, Math.min(12, Number(form.billingIntervalMonths) || 1)),
      startMonth: Math.max(1, Math.min(12, Number(form.startMonth) || 1)),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      notes: form.notes.trim() || null
    };
    const request = form.id ? this.service.updateBill(form.id, payload) : this.service.createBill(payload);
    this.save(request, `${payload.name} saved.`, () => this.billForm.set(this.emptyBillForm()));
  }

  toggleBillPaid(bill: FinanceRecurringBill): void {
    if (!bill.isDueForSelectedMonth) {
      this.error.set(`${bill.name} is not due for ${this.selectedMonthName()}.`);
      return;
    }

    this.service.updateBillPayment(bill.id, this.selectedYear(), this.selectedMonth(), {
      isPaid: !bill.isPaidForSelectedMonth,
      paidDate: !bill.isPaidForSelectedMonth ? this.today() : null,
      amountPaid: !bill.isPaidForSelectedMonth ? bill.expectedAmount : null,
      notes: bill.paymentNotes
    }).subscribe({
      next: () => {
        this.message.set(`${bill.name} ${bill.isPaidForSelectedMonth ? 'reopened' : 'marked paid'}.`);
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to update bill payment.')
    });
  }

  saveBillPayment(): void {
    const form = this.billPaymentForm();
    if (!form.billId) {
      this.error.set('Select a bill before saving payment details.');
      return;
    }
    const bill = this.bills().find(candidate => candidate.id === form.billId);
    if (bill && !bill.isDueForSelectedMonth) {
      this.error.set(`${bill.name} is not due for ${this.selectedMonthName()}.`);
      return;
    }

    this.service.updateBillPayment(form.billId, this.selectedYear(), this.selectedMonth(), {
      isPaid: form.isPaid,
      paidDate: form.isPaid ? form.paidDate || this.today() : null,
      amountPaid: form.isPaid ? form.amountPaid : null,
      notes: form.notes.trim() || null
    }).subscribe({
      next: () => {
        this.message.set(`${form.billName} payment updated.`);
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to update bill payment.')
    });
  }

  markSelectedBillExpectedPaid(): void {
    const form = this.billPaymentForm();
    if (!form.billId) {
      this.error.set('Select a bill first.');
      return;
    }

    const bill = this.bills().find(candidate => candidate.id === form.billId);
    this.billPaymentForm.set({
      ...form,
      isPaid: true,
      paidDate: this.today(),
      amountPaid: bill?.expectedAmount ?? form.amountPaid ?? 0
    });
  }

  copyPriorMonthPayments(): void {
    this.service.copyPriorMonthBillPayments(this.selectedYear(), this.selectedMonth()).subscribe({
      next: result => {
        this.message.set(result.message || `Copied ${result.updatedCount} prior-month bill payments.`);
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to copy prior-month payments.')
    });
  }

  markAllExpectedBillsPaid(): void {
    if (!window.confirm(`Mark all expected bills paid for ${this.selectedMonthName()}?`)) {
      return;
    }

    this.service.markExpectedBillsPaid(this.selectedYear(), this.selectedMonth()).subscribe({
      next: result => {
        this.message.set(result.message || `Marked ${result.updatedCount} expected bills paid.`);
        this.load();
      },
      error: err => this.error.set(err.error ?? err.message ?? 'Failed to mark expected bills paid.')
    });
  }

  billStatus(bill: FinanceRecurringBill): 'paid' | 'overdue' | 'dueSoon' | 'open' | 'inactive' {
    if (!bill.isActive) {
      return 'inactive';
    }

    if (bill.isPaidForSelectedMonth) {
      return 'paid';
    }
    if (!bill.isDueForSelectedMonth) {
      return 'inactive';
    }

    const today = new Date();
    const dueDate = new Date(this.selectedYear(), this.selectedMonth() - 1, Math.min(bill.dueDay, new Date(this.selectedYear(), this.selectedMonth(), 0).getDate()));
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
    if (daysUntilDue < 0) {
      return 'overdue';
    }

    return daysUntilDue <= 7 ? 'dueSoon' : 'open';
  }

  billStatusLabel(bill: FinanceRecurringBill): string {
    const status = this.billStatus(bill);
    return status === 'paid' ? 'Paid' :
      status === 'overdue' ? 'Overdue' :
      status === 'dueSoon' ? 'Due soon' :
      status === 'inactive' ? (bill.isActive ? 'Not due' : 'Inactive') :
      'Open';
  }

  billFrequencyLabel(bill: FinanceRecurringBill): string {
    return bill.billingIntervalMonths === 1 ? 'Monthly' :
      bill.billingIntervalMonths === 3 ? 'Quarterly' :
      bill.billingIntervalMonths === 6 ? 'Semiannual' :
      bill.billingIntervalMonths === 12 ? 'Yearly' :
      `Every ${bill.billingIntervalMonths} months`;
  }

  deleteBill(): void {
    const form = this.billForm();
    if (!form.id || !window.confirm(`Delete ${form.name}?`)) {
      return;
    }

    this.save(this.service.deleteBill(form.id), `${form.name} deleted.`, () => this.billForm.set(this.emptyBillForm()));
  }

  captureCurrentSnapshot(): void {
    const date = this.currentSnapshotPreview().snapshotDate;
    this.snapshotForm.set({
      id: null,
      snapshotDate: date,
      totalDebt: this.totalDebt(),
      totalSavings: this.totalSavings(),
      difference: this.netWorth(),
      isFrozen: true,
      notes: 'Captured from current balances'
    });
    this.activeTab.set('snapshots');
  }

  saveCurrentSnapshot(): void {
    const preview = this.currentSnapshotPreview();
    const existing = this.snapshots().find(snapshot => snapshot.snapshotDate.slice(0, 10) === preview.snapshotDate);
    if (existing?.isFrozen && !window.confirm(`${preview.snapshotDate} already has a frozen snapshot. Overwrite it with the current balance totals?`)) {
      return;
    }

    const payload: FinanceYearSnapshotUpsert = {
      snapshotDate: preview.snapshotDate,
      totalDebt: preview.totalDebt,
      totalSavings: preview.totalSavings,
      difference: preview.difference,
      isFrozen: true,
      notes: 'Captured from current balances'
    };

    const request = existing
      ? this.service.updateYearSnapshot(existing.id, payload)
      : this.service.createYearSnapshot(payload);
    this.save(request, `${preview.snapshotDate} snapshot saved.`, () => this.snapshotForm.set(this.emptySnapshotForm()));
  }

  setComparisonFrom(value: string | number | null): void {
    this.compareFromSnapshotId.set(value === null || value === '' ? null : Number(value));
  }

  setComparisonTo(value: string | number | null): void {
    this.compareToSnapshotId.set(value === null || value === '' ? null : Number(value));
  }

  selectSnapshot(snapshot: FinanceYearSnapshot): void {
    this.snapshotForm.set({
      id: snapshot.id,
      snapshotDate: this.dateInput(snapshot.snapshotDate),
      totalDebt: snapshot.totalDebt,
      totalSavings: snapshot.totalSavings,
      difference: snapshot.difference,
      isFrozen: snapshot.isFrozen,
      notes: snapshot.notes ?? ''
    });
  }

  saveSnapshot(): void {
    const form = this.snapshotForm();
    if (form.id && this.snapshots().find(snapshot => snapshot.id === form.id)?.isFrozen && !window.confirm('This snapshot is frozen. Save changes anyway?')) {
      return;
    }

    const payload: FinanceYearSnapshotUpsert = {
      snapshotDate: form.snapshotDate || this.today(),
      totalDebt: Number(form.totalDebt) || 0,
      totalSavings: Number(form.totalSavings) || 0,
      difference: Number(form.difference) || 0,
      isFrozen: form.isFrozen,
      notes: form.notes.trim() || null
    };
    const request = form.id ? this.service.updateYearSnapshot(form.id, payload) : this.service.createYearSnapshot(payload);
    this.save(request, 'Snapshot saved.', () => this.snapshotForm.set(this.emptySnapshotForm()));
  }

  deleteSnapshot(): void {
    const form = this.snapshotForm();
    if (!form.id || !window.confirm('Delete this yearly snapshot?')) {
      return;
    }

    this.save(this.service.deleteYearSnapshot(form.id), 'Snapshot deleted.', () => this.snapshotForm.set(this.emptySnapshotForm()));
  }

  selectDonation(donation: FinanceDonation): void {
    this.donationForm.set({
      id: donation.id,
      donationDate: this.dateInput(donation.donationDate),
      organization: donation.organization,
      amount: donation.amount,
      method: donation.method ?? '',
      hasReceipt: donation.hasReceipt,
      receiptReference: donation.receiptReference ?? '',
      notes: donation.notes ?? ''
    });
  }

  saveDonation(): void {
    const form = this.donationForm();
    if (!form.organization.trim()) {
      this.error.set('Organization is required.');
      return;
    }

    const payload: FinanceDonationUpsert = {
      donationDate: form.donationDate || this.today(),
      organization: form.organization.trim(),
      amount: Number(form.amount) || 0,
      method: form.method.trim() || null,
      hasReceipt: form.hasReceipt,
      receiptReference: form.receiptReference.trim() || null,
      notes: form.notes.trim() || null
    };
    const request = form.id ? this.service.updateDonation(form.id, payload) : this.service.createDonation(payload);
    this.save(request, `${payload.organization} donation saved.`, () => this.donationForm.set(this.emptyDonationForm()));
  }

  deleteDonation(): void {
    const form = this.donationForm();
    if (!form.id || !window.confirm(`Delete donation to ${form.organization}?`)) {
      return;
    }

    this.save(this.service.deleteDonation(form.id), 'Donation deleted.', () => this.donationForm.set(this.emptyDonationForm()));
  }

  money(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);
  }

  signedMoney(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const formatted = this.money(Math.abs(value));
    return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
  }

  percent(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '-';
    }

    const formatted = Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 1 });
    return value > 0 ? `+${formatted}%` : value < 0 ? `-${formatted}%` : '0%';
  }

  setSelectedMonth(month: number): void {
    this.selectedMonth.set(month);
    this.load();
  }

  setReportStartDate(value: string): void {
    this.reportStartDate.set(value || `${this.selectedYear()}-01-01`);
  }

  setReportEndDate(value: string): void {
    this.reportEndDate.set(value || this.today());
  }

  useFinancialYearReportRange(): void {
    this.reportStartDate.set(this.dateInput(this.financialYearStartDate().toISOString()));
    this.reportEndDate.set(this.dateInput(this.financialYearEndDate().toISOString()));
    this.message.set(`Report range set to financial year ${this.financialYearLabel()}.`);
  }

  setReceiptReportTaxYear(value: string | number): void {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 1900) {
      this.receiptReportTaxYear.set(Math.trunc(parsed));
    }
  }

  setDonationReceiptFilter(filter: 'all' | 'withReceipt' | 'missingReceipt'): void {
    this.donationReceiptFilter.set(filter);
  }

  clearDonationFilters(): void {
    this.donationSearch.set('');
    this.donationReceiptFilter.set('all');
  }

  changeMonth(amount: number): void {
    const date = new Date(this.selectedYear(), this.selectedMonth() - 1 + amount, 1);
    this.selectedYear.set(date.getFullYear());
    this.selectedMonth.set(date.getMonth() + 1);
    this.load();
  }

  private percentOf(value: number, maxValue: number): number {
    return Math.max(3, Math.round((Math.abs(value) / maxValue) * 100));
  }

  private snapshotHighlightRow(label: string, trend: SnapshotTrend | null) {
    return {
      Metric: label,
      Date: trend ? this.dateInput(trend.snapshot.snapshotDate) : '',
      Debt: trend?.debtChange ?? '',
      Savings: trend?.savingsChange ?? '',
      Difference: trend?.differenceChange ?? ''
    };
  }

  private ensureSnapshotComparisonSelection(snapshots: FinanceYearSnapshot[]): void {
    if (snapshots.length < 2 || (this.compareFromSnapshotId() && this.compareToSnapshotId())) {
      return;
    }

    const sorted = [...snapshots].sort((left, right) => left.snapshotDate.localeCompare(right.snapshotDate));
    this.compareFromSnapshotId.set(sorted[0].id);
    this.compareToSnapshotId.set(sorted[sorted.length - 1].id);
  }

  private reportAccountRows(): ReportRow[] {
    return this.reportAccounts().map(account => ({
      Name: account.name,
      Category: account.category,
      Type: account.isDebt ? 'Debt' : 'Asset',
      Balance: account.balance,
      AsOfDate: this.dateInput(account.asOfDate),
      Active: account.isActive ? 'Yes' : 'No',
      Notes: account.notes ?? ''
    }));
  }

  private reportBillRows(): ReportRow[] {
    return this.reportBills().map(bill => ({
      Month: this.selectedMonthName(),
      DueDay: bill.dueDay,
      Name: bill.name,
      Category: bill.category,
      Frequency: this.billFrequencyLabel(bill),
      ExpectedAmount: bill.expectedAmount ?? '',
      Paid: bill.isPaidForSelectedMonth ? 'Yes' : 'No',
      PaidDate: bill.paidDate ? this.dateInput(bill.paidDate) : '',
      AmountPaid: bill.amountPaid ?? '',
      Status: this.billStatusLabel(bill),
      Active: bill.isActive ? 'Yes' : 'No',
      Notes: bill.notes ?? '',
      PaymentNotes: bill.paymentNotes ?? ''
    }));
  }

  private reportBillPaymentRows(): ReportRow[] {
    return this.billReport().paymentHistory.map(payment => ({
      Year: payment.year,
      Month: payment.month,
      Bill: payment.billName,
      Category: payment.category,
      Paid: payment.isPaid ? 'Yes' : 'No',
      PaidDate: payment.paidDate ? this.dateInput(payment.paidDate) : '',
      Expected: payment.expectedAmount ?? '',
      AmountPaid: payment.amountPaid ?? '',
      Notes: payment.notes ?? ''
    }));
  }

  private reportPaidCategoryRows(): ReportRow[] {
    return this.billReport().paidTotalsByCategory.map(row => ({
      Category: row.category,
      PaidTotal: row.paidTotal,
      PaymentCount: row.paymentCount
    }));
  }

  private reportBillAnnualSummaryRows(): ReportRow[] {
    return this.billReport().annualBillSummaries.map(row => ({
      Bill: row.billName,
      Category: row.category,
      DueCount: row.dueCount,
      PaidCount: row.paidCount,
      PaymentRate: `${Math.round(row.paymentRate)}%`,
      ExpectedTotal: row.expectedTotal,
      PaidTotal: row.paidTotal,
      AveragePaid: row.averagePaid,
      LastPaidDate: row.lastPaidDate ? this.dateInput(row.lastPaidDate) : ''
    }));
  }

  private reportMonthlyPaidRows(): ReportRow[] {
    return this.billReport().monthlyPaidTotals.map(row => ({
      Year: row.year,
      Month: row.month,
      PaidTotal: row.paidTotal,
      PaymentCount: row.paymentCount
    }));
  }

  private reportBillFrequencyRows(): ReportRow[] {
    return this.billReport().frequencySummaries.map(row => ({
      Frequency: row.frequency,
      BillCount: row.billCount,
      ExpectedMonthlyTotal: row.expectedMonthlyTotal
    }));
  }

  private reportBillOverdueRiskRows(): ReportRow[] {
    return this.billReport().overdueRisks.map(row => ({
      Report: 'Overdue Risk',
      Bill: row.billName,
      Category: row.category,
      DueCount: row.dueCount,
      PaidCount: row.paidCount,
      UnpaidCount: row.unpaidCount,
      OverdueCount: row.overdueCount,
      UnpaidExpectedTotal: row.unpaidExpectedTotal,
      OldestUnpaidDueDate: row.oldestUnpaidDueDate ? this.dateInput(row.oldestUnpaidDueDate) : '',
      LastPaidDate: row.lastPaidDate ? this.dateInput(row.lastPaidDate) : '',
      PaymentRate: `${Math.round(row.paymentRate)}%`
    }));
  }

  private reportBillPaymentVarianceRows(): ReportRow[] {
    return this.billReport().paymentVariances.map(row => ({
      Report: 'Payment Variance',
      Bill: row.billName,
      Category: row.category,
      PaymentCount: row.paymentCount,
      ExpectedAmount: row.expectedAmount,
      AveragePaid: row.averagePaid,
      AverageVariance: row.averageVariance,
      LargestOverage: row.largestOverage,
      LargestUnderage: row.largestUnderage
    }));
  }

  private reportNetWorthRows(): ReportRow[] {
    return this.reportNetWorthHistory().map(row => ({
      AsOfDate: this.dateInput(row.asOfDate),
      TotalDebt: row.totalDebt,
      DebtChange: row.debtChange ?? '',
      TotalSavings: row.totalSavings,
      SavingsChange: row.savingsChange ?? '',
      NetWorth: row.netWorth,
      NetWorthChange: row.netWorthChange ?? '',
      AccountUpdates: row.accountUpdates
    }));
  }

  private reportSelectedAccountHistoryRows(): ReportRow[] {
    const account = this.accountForm();
    return this.reportSelectedAccountHistoryTrends()
      .slice()
      .reverse()
      .map(trend => ({
        Account: account.name,
        Category: account.category,
        Type: account.isDebt ? 'Debt' : 'Asset',
        AsOfDate: this.dateInput(trend.history.asOfDate),
        Balance: trend.history.balance,
        Change: trend.change ?? '',
        PercentChange: trend.percentChange === null ? '' : `${trend.percentChange.toFixed(2)}%`,
        RecordedAt: trend.history.recordedAt,
        Notes: trend.history.notes ?? ''
      }));
  }

  private reportSnapshotRows(): ReportRow[] {
    return this.reportSnapshots().map(trend => ({
      SnapshotDate: this.dateInput(trend.snapshot.snapshotDate),
      TotalDebt: trend.snapshot.totalDebt,
      DebtChange: trend.debtChange ?? '',
      TotalSavings: trend.snapshot.totalSavings,
      SavingsChange: trend.savingsChange ?? '',
      Difference: trend.snapshot.difference,
      DifferenceChange: trend.differenceChange ?? '',
      Frozen: trend.snapshot.isFrozen ? 'Yes' : 'No',
      Notes: trend.snapshot.notes ?? ''
    }));
  }

  private reportDonationRows(): ReportRow[] {
    return this.reportDonations().map(donation => ({
      DonationDate: this.dateInput(donation.donationDate),
      Organization: donation.organization,
      Amount: donation.amount,
      Method: donation.method ?? '',
      HasReceipt: donation.hasReceipt ? 'Yes' : 'No',
      ReceiptReference: donation.receiptReference ?? '',
      Notes: donation.notes ?? ''
    }));
  }

  private reportDonationOrganizationRows(): ReportRow[] {
    return this.reportDonationOrganizationSummaries().map(summary => ({
      Organization: summary.organization,
      DonationCount: summary.count,
      Total: summary.total,
      ReceiptedTotal: summary.receiptedTotal,
      MissingReceiptTotal: summary.missingReceiptTotal
    }));
  }

  private inReportDateRange(value: string | null | undefined): boolean {
    if (!value) {
      return false;
    }

    const date = this.dateInput(value);
    const start = this.reportStartDate();
    const end = this.reportEndDate();
    return (!start || date >= start) && (!end || date <= end);
  }

  private billFallsInReportRange(bill: FinanceRecurringBill): boolean {
    if (!bill.isDueForSelectedMonth) {
      return false;
    }

    if (bill.paidDate) {
      return this.inReportDateRange(bill.paidDate);
    }

    const monthDate = `${this.selectedYear()}-${String(this.selectedMonth()).padStart(2, '0')}-${String(Math.min(bill.dueDay, 28)).padStart(2, '0')}`;
    return this.inReportDateRange(monthDate);
  }

  private reportRangeLabel(): string {
    const start = this.reportStartDate() || 'beginning';
    const end = this.reportEndDate() || 'today';
    return `${start} to ${end}`;
  }

  private yearCloseDate(): string {
    const settings = this.settings();
    const day = Math.min(settings.yearCloseDay, new Date(this.selectedYear(), settings.yearCloseMonth, 0).getDate());
    return `${this.selectedYear()}-${String(settings.yearCloseMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private financialYearStartFor(year: number, month: number): Date {
    const settings = this.settings();
    const closeMonth = settings.yearCloseMonth;
    const closeDay = Math.min(settings.yearCloseDay, new Date(year, closeMonth, 0).getDate());
    const startsThisYear = month >= closeMonth;
    const startYear = startsThisYear ? year : year - 1;
    return new Date(startYear, closeMonth - 1, closeDay);
  }

  private addYears(date: Date, years: number): Date {
    const copy = new Date(date);
    copy.setFullYear(copy.getFullYear() + years);
    return copy;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private endOfMonth(year: number, month: number): string {
    const day = new Date(year, month, 0).getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private mergeSuggestions(...groups: string[][]): string[] {
    return Array.from(new Set(groups
      .flat()
      .map(item => item.trim())
      .filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
  }

  private reportTableHtml(headers: string[], rows: ReportValue[][]): string {
    const body = rows.length
      ? rows.map(row => `<tr>${row.map(value => `<td>${this.escapeHtml(this.reportCell(value))}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${headers.length}">No rows found.</td></tr>`;

    return `<table>
      <thead><tr>${headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('')}</tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  emptyBillReport(): FinanceBillReport {
    return {
      unpaidByMonth: [],
      paymentHistory: [],
      paidTotalsByCategory: [],
      upcomingAndOverdue: [],
      annualBillSummaries: [],
      monthlyPaidTotals: [],
      frequencySummaries: [],
      overdueRisks: [],
      paymentVariances: []
    };
  }

  private reportCell(value: ReportValue): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private downloadCsv(filename: string, rows: ReportRow[]): void {
    this.csvDownload.downloadObjects(filename, rows);
  }

  private downloadText(filename: string, text: string, type: string): void {
    const blob = new Blob([text], { type });
    this.downloadBlob(filename, blob);
  }

  private downloadBlob(filename: string, blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private filenameFromDisposition(header: string | null): string | null {
    const match = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i.exec(header ?? '');
    return match ? decodeURIComponent(match[1]) : null;
  }

  private printHtml(title: string, body: string): void {
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) {
      this.error.set('Unable to open print window. Check popup settings.');
      return;
    }

    win.document.write(`<!doctype html>
      <html>
      <head>
        <title>${this.escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; line-height: 1.35; background: #ffffff; }
          h1 { font-size: 24px; margin: 0 0 8px; letter-spacing: 0; }
          h2 { border-bottom: 1px solid #cbd5e1; font-size: 16px; margin: 24px 0 8px; padding-bottom: 4px; }
          .report-meta { border-bottom: 3px solid #0f172a; display: grid; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; }
          .report-kicker { color: #475569; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin: 0 0 2px; text-transform: uppercase; }
          .report-title { font-size: 22px; font-weight: 800; margin: 0; }
          .report-details { display: flex; flex-wrap: wrap; gap: 10px 18px; color: #475569; font-size: 12px; font-weight: 700; }
          .metric-grid { display: grid; gap: 8px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0 0 16px; }
          .metric { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; break-inside: avoid; }
          .metric span { color: #64748b; display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; }
          .metric strong { display: block; font-size: 14px; margin-top: 2px; }
          .summary { margin: 4px 0; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-top: 14px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; vertical-align: top; }
          th { background: #e2e8f0; color: #1e293b; font-weight: 800; }
          tbody tr:nth-child(even) { background: #f8fafc; }
          thead { display: table-header-group; }
          tr, .metric { break-inside: avoid; }
          .right { text-align: right; }
          @page { margin: 0.45in; }
          @media print {
            button { display: none; }
            body { margin: 0; }
            .metric-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          }
        </style>
      </head>
      <body>
        <div class="report-meta">
          <div>
            <p class="report-kicker">Verdelak Finance Tracker</p>
            <p class="report-title">${this.escapeHtml(title)}</p>
          </div>
          <div class="report-details">
            <span>Generated: ${this.escapeHtml(new Date().toLocaleString())}</span>
            <span>Range: ${this.escapeHtml(this.reportRangeLabel())}</span>
            <span>Selected month: ${this.escapeHtml(this.selectedMonthName())} ${this.selectedYear()}</span>
          </div>
        </div>
        ${this.printMetricGridHtml()}
        ${body}
      </body>
      </html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  private printMetricGridHtml(): string {
    return `<div class="metric-grid">
      <div class="metric"><span>Total debt</span><strong>${this.money(this.totalDebt())}</strong></div>
      <div class="metric"><span>Total savings</span><strong>${this.money(this.totalSavings())}</strong></div>
      <div class="metric"><span>Difference</span><strong>${this.money(this.netWorth())}</strong></div>
      <div class="metric"><span>Bills paid</span><strong>${this.paidBills()} / ${this.activeBills().length}</strong></div>
    </div>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private save(request: any, successMessage: string, afterSave: () => void): void {
    this.loading.set(true);
    this.error.set(null);
    this.message.set(null);
    request.subscribe({
      next: () => {
        this.message.set(successMessage);
        afterSave();
        this.load();
      },
      error: (err: any) => {
        this.error.set(err.error ?? err.message ?? 'Save failed.');
        this.loading.set(false);
      }
    });
  }

  emptyAccountForm(): AccountForm {
    return {
      id: null,
      name: '',
      category: this.settings().accountCategories[0] ?? 'Savings',
      balance: 0,
      isDebt: false,
      asOfDate: this.today(),
      sortOrder: 0,
      isActive: true,
      notes: ''
    };
  }

  emptyBillForm(): BillForm {
    return {
      id: null,
      name: '',
      category: this.settings().billCategories[0] ?? 'Household',
      expectedAmount: null,
      dueDay: 1,
      billingIntervalMonths: 1,
      startMonth: 1,
      sortOrder: 0,
      isActive: true,
      notes: ''
    };
  }

  emptyBillPaymentForm(): BillPaymentForm {
    return {
      billId: null,
      billName: '',
      isPaid: false,
      paidDate: this.today(),
      amountPaid: null,
      notes: ''
    };
  }

  emptySnapshotForm(): SnapshotForm {
    return {
      id: null,
      snapshotDate: this.yearCloseDate(),
      totalDebt: 0,
      totalSavings: 0,
      difference: 0,
      isFrozen: true,
      notes: ''
    };
  }

  emptyDonationForm(): DonationForm {
    return {
      id: null,
      donationDate: this.today(),
      organization: '',
      amount: 0,
      method: this.settings().donationMethods[0] ?? '',
      hasReceipt: false,
      receiptReference: '',
      notes: ''
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dateInput(value: string): string {
    return value.slice(0, 10);
  }

  private defaultSettings(): FinanceTrackerSettings {
    const now = new Date();
    return {
      accountCategories: ['Checking', 'Credit Card', 'HSA', 'IRA', 'Retirement', 'Savings'],
      billCategories: ['Credit Card', 'Household', 'Insurance', 'Medical', 'Subscription', 'Utilities'],
      donationMethods: ['Cash', 'Check', 'Credit Card', 'Online', 'Payroll', 'Other'],
      yearCloseMonth: 5,
      yearCloseDay: 1,
      defaultReportYear: now.getFullYear(),
      defaultReportMonth: now.getMonth() + 1
    };
  }
}


import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import {
  FinanceAccountBalance,
  FinanceAccountBalanceHistory,
  FinanceAccountBalanceUpsert,
  FinanceBillBatchResult,
  FinanceBillReport,
  FinanceDashboard,
  FinanceDonation,
  FinanceDonationUpsert,
  FinanceNetWorthHistory,
  FinanceRecurringBill,
  FinanceRecurringBillPaymentUpdate,
  FinanceRecurringBillUpsert,
  FinanceTrackerSettings,
  FinanceYearSnapshot,
  FinanceYearSnapshotUpsert
} from './models/finance-tracker.models';

@Injectable({ providedIn: 'root' })
export class FinanceTrackerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/finance-tracker`;
  private readonly settingsUrl = `${environment.apiUrl}/admin/settings`;

  getSettings() {
    return this.http.get<FinanceTrackerSettings>(`${this.settingsUrl}/finance-tracker`);
  }

  getDashboard(year: number, month: number) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.get<FinanceDashboard>(`${this.baseUrl}/dashboard`, { params });
  }

  createAccount(payload: FinanceAccountBalanceUpsert) {
    return this.http.post<FinanceAccountBalance>(`${this.baseUrl}/accounts`, payload);
  }

  updateAccount(id: number, payload: FinanceAccountBalanceUpsert) {
    return this.http.put<FinanceAccountBalance>(`${this.baseUrl}/accounts/${id}`, payload);
  }

  deleteAccount(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/accounts/${id}`);
  }

  getAccountHistory(id: number) {
    return this.http.get<FinanceAccountBalanceHistory[]>(`${this.baseUrl}/accounts/${id}/history`);
  }

  getNetWorthHistory() {
    return this.http.get<FinanceNetWorthHistory[]>(`${this.baseUrl}/history/net-worth`);
  }

  createBill(payload: FinanceRecurringBillUpsert) {
    return this.http.post<FinanceRecurringBill>(`${this.baseUrl}/bills`, payload);
  }

  updateBill(id: number, payload: FinanceRecurringBillUpsert) {
    return this.http.put<FinanceRecurringBill>(`${this.baseUrl}/bills/${id}`, payload);
  }

  updateBillPayment(id: number, year: number, month: number, payload: FinanceRecurringBillPaymentUpdate) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.patch<FinanceRecurringBill>(`${this.baseUrl}/bills/${id}/payment`, payload, { params });
  }

  copyPriorMonthBillPayments(year: number, month: number) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.post<FinanceBillBatchResult>(`${this.baseUrl}/bills/payments/copy-prior-month`, {}, { params });
  }

  markExpectedBillsPaid(year: number, month: number) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.post<FinanceBillBatchResult>(`${this.baseUrl}/bills/payments/mark-expected-paid`, {}, { params });
  }

  deleteBill(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/bills/${id}`);
  }

  getBillReport(year: number, month: number) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);

    return this.http.get<FinanceBillReport>(`${this.baseUrl}/bills/report`, { params });
  }

  exportWorkbook(year: number, month: number, startDate: string, endDate: string) {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get(`${this.baseUrl}/export/xlsx`, {
      params,
      observe: 'response',
      responseType: 'blob'
    });
  }

  createYearSnapshot(payload: FinanceYearSnapshotUpsert) {
    return this.http.post<FinanceYearSnapshot>(`${this.baseUrl}/year-snapshots`, payload);
  }

  updateYearSnapshot(id: number, payload: FinanceYearSnapshotUpsert) {
    return this.http.put<FinanceYearSnapshot>(`${this.baseUrl}/year-snapshots/${id}`, payload);
  }

  deleteYearSnapshot(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/year-snapshots/${id}`);
  }

  createDonation(payload: FinanceDonationUpsert) {
    return this.http.post<FinanceDonation>(`${this.baseUrl}/donations`, payload);
  }

  updateDonation(id: number, payload: FinanceDonationUpsert) {
    return this.http.put<FinanceDonation>(`${this.baseUrl}/donations/${id}`, payload);
  }

  deleteDonation(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/donations/${id}`);
  }
}

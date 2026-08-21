namespace Verdelak.Api.Dtos;

public record FinanceDashboardDto(
    IEnumerable<FinanceAccountBalanceDto> Accounts,
    IEnumerable<FinanceRecurringBillDto> Bills,
    IEnumerable<FinanceYearSnapshotDto> YearSnapshots,
    IEnumerable<FinanceDonationDto> Donations,
    decimal TotalDebt,
    decimal TotalSavings,
    decimal NetWorth,
    decimal CurrentYearDonationTotal);

public record FinanceAccountBalanceDto(
    int Id,
    string Name,
    string Category,
    decimal Balance,
    bool IsDebt,
    DateTime AsOfDate,
    int SortOrder,
    bool IsActive,
    string? Notes);

public record FinanceAccountBalanceHistoryDto(
    int Id,
    int FinanceAccountBalanceId,
    decimal Balance,
    DateTime AsOfDate,
    DateTime RecordedAt,
    string? Notes);

public record FinanceNetWorthHistoryDto(
    DateTime AsOfDate,
    decimal TotalDebt,
    decimal TotalSavings,
    decimal NetWorth,
    decimal? DebtChange,
    decimal? SavingsChange,
    decimal? NetWorthChange,
    int AccountUpdates);

public record FinanceBillReportDto(
    IEnumerable<FinanceUnpaidBillsByMonthDto> UnpaidByMonth,
    IEnumerable<FinanceBillPaymentHistoryDto> PaymentHistory,
    IEnumerable<FinancePaidTotalByCategoryDto> PaidTotalsByCategory,
    IEnumerable<FinanceUpcomingBillDto> UpcomingAndOverdue,
    IEnumerable<FinanceBillAnnualSummaryDto> AnnualBillSummaries,
    IEnumerable<FinanceMonthlyPaidTotalDto> MonthlyPaidTotals,
    IEnumerable<FinanceBillFrequencySummaryDto> FrequencySummaries,
    IEnumerable<FinanceBillOverdueRiskDto> OverdueRisks,
    IEnumerable<FinanceBillPaymentVarianceDto> PaymentVariances);

public record FinanceUnpaidBillsByMonthDto(
    int Year,
    int Month,
    int UnpaidCount,
    decimal ExpectedTotal);

public record FinanceBillPaymentHistoryDto(
    int BillId,
    string BillName,
    string Category,
    int Year,
    int Month,
    bool IsPaid,
    DateTime? PaidDate,
    decimal? ExpectedAmount,
    decimal? AmountPaid,
    string? Notes);

public record FinancePaidTotalByCategoryDto(
    string Category,
    decimal PaidTotal,
    int PaymentCount);

public record FinanceUpcomingBillDto(
    int BillId,
    string BillName,
    string Category,
    DateTime DueDate,
    decimal? ExpectedAmount,
    bool IsPaid,
    DateTime? PaidDate,
    decimal? AmountPaid,
    string Status);

public record FinanceBillAnnualSummaryDto(
    int BillId,
    string BillName,
    string Category,
    int DueCount,
    int PaidCount,
    decimal ExpectedTotal,
    decimal PaidTotal,
    decimal AveragePaid,
    decimal PaymentRate,
    DateTime? LastPaidDate);

public record FinanceMonthlyPaidTotalDto(
    int Year,
    int Month,
    decimal PaidTotal,
    int PaymentCount);

public record FinanceBillFrequencySummaryDto(
    string Frequency,
    int BillCount,
    decimal ExpectedMonthlyTotal);

public record FinanceBillOverdueRiskDto(
    int BillId,
    string BillName,
    string Category,
    int DueCount,
    int PaidCount,
    int UnpaidCount,
    int OverdueCount,
    decimal UnpaidExpectedTotal,
    DateTime? OldestUnpaidDueDate,
    DateTime? LastPaidDate,
    decimal PaymentRate);

public record FinanceBillPaymentVarianceDto(
    int BillId,
    string BillName,
    string Category,
    int PaymentCount,
    decimal ExpectedAmount,
    decimal AveragePaid,
    decimal AverageVariance,
    decimal LargestOverage,
    decimal LargestUnderage);

public record FinanceBillBatchResultDto(
    int UpdatedCount,
    int SkippedCount,
    string Message);

public record FinanceAccountBalanceUpsertDto(
    string Name,
    string Category,
    decimal Balance,
    bool IsDebt,
    DateTime? AsOfDate,
    int SortOrder,
    bool IsActive,
    string? Notes);

public record FinanceRecurringBillDto(
    int Id,
    string Name,
    string Category,
    decimal? ExpectedAmount,
    int DueDay,
    int BillingIntervalMonths,
    int StartMonth,
    bool IsDueForSelectedMonth,
    int SortOrder,
    bool IsActive,
    string? Notes,
    bool IsPaidForSelectedMonth,
    DateTime? PaidDate,
    decimal? AmountPaid,
    string? PaymentNotes);

public record FinanceRecurringBillUpsertDto(
    string Name,
    string Category,
    decimal? ExpectedAmount,
    int DueDay,
    int BillingIntervalMonths,
    int StartMonth,
    int SortOrder,
    bool IsActive,
    string? Notes);

public record FinanceRecurringBillPaymentDto(
    bool IsPaid,
    DateTime? PaidDate,
    decimal? AmountPaid,
    string? Notes);

public record FinanceYearSnapshotDto(
    int Id,
    DateTime SnapshotDate,
    decimal TotalDebt,
    decimal TotalSavings,
    decimal Difference,
    bool IsFrozen,
    string? Notes);

public record FinanceYearSnapshotUpsertDto(
    DateTime SnapshotDate,
    decimal TotalDebt,
    decimal TotalSavings,
    decimal Difference,
    bool IsFrozen,
    string? Notes);

public record FinanceDonationDto(
    int Id,
    DateTime DonationDate,
    string Organization,
    decimal Amount,
    string? Method,
    bool HasReceipt,
    string? ReceiptReference,
    string? Notes);

public record FinanceDonationUpsertDto(
    DateTime DonationDate,
    string Organization,
    decimal Amount,
    string? Method,
    bool HasReceipt,
    string? ReceiptReference,
    string? Notes);

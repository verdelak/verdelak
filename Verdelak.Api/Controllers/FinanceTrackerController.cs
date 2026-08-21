using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IO.Compression;
using System.Text;
using Verdelak.Api.Data;
using Verdelak.Api.Dtos;
using Verdelak.Api.Models;

namespace Verdelak.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/finance-tracker")]
public class FinanceTrackerController(VerdelakDbContext context) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<FinanceDashboardDto>> GetDashboard(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var selectedDate = DateTime.Today;
        var selectedYear = year ?? selectedDate.Year;
        var selectedMonth = month ?? selectedDate.Month;

        var accounts = await context.FinanceAccountBalances
            .AsNoTracking()
            .OrderBy(account => account.SortOrder)
            .ThenBy(account => account.Category)
            .ThenBy(account => account.Name)
            .ToListAsync(cancellationToken);

        var payments = await context.FinanceRecurringBillPayments
            .AsNoTracking()
            .Where(payment => payment.Year == selectedYear && payment.Month == selectedMonth)
            .ToDictionaryAsync(payment => payment.RecurringBillId, cancellationToken);

        var bills = await context.FinanceRecurringBills
            .AsNoTracking()
            .OrderBy(bill => bill.DueDay)
            .ThenBy(bill => bill.SortOrder)
            .ThenBy(bill => bill.Name)
            .ToListAsync(cancellationToken);

        var snapshots = await context.FinanceYearSnapshots
            .AsNoTracking()
            .OrderBy(snapshot => snapshot.SnapshotDate)
            .ToListAsync(cancellationToken);

        var donations = await context.FinanceDonations
            .AsNoTracking()
            .Where(donation => donation.DonationDate.Year == selectedYear)
            .OrderByDescending(donation => donation.DonationDate)
            .ThenBy(donation => donation.Organization)
            .ToListAsync(cancellationToken);

        var activeAccounts = accounts.Where(account => account.IsActive).ToList();
        var totalDebt = activeAccounts.Where(account => account.IsDebt).Sum(account => account.Balance);
        var totalSavings = activeAccounts.Where(account => !account.IsDebt).Sum(account => account.Balance);

        return new FinanceDashboardDto(
            accounts.Select(ToDto),
            bills.Select(bill => ToDto(bill, payments.GetValueOrDefault(bill.Id), selectedYear, selectedMonth)),
            snapshots.Select(ToDto),
            donations.Select(ToDto),
            totalDebt,
            totalSavings,
            totalSavings - totalDebt,
            donations.Sum(donation => donation.Amount));
    }

    [HttpPost("accounts")]
    public async Task<ActionResult<FinanceAccountBalanceDto>> CreateAccount(
        FinanceAccountBalanceUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateAccount(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var account = new FinanceAccountBalance();
        Apply(account, dto);
        context.FinanceAccountBalances.Add(account);
        AddAccountHistory(account, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(account);
    }

    [HttpPut("accounts/{id:int}")]
    public async Task<ActionResult<FinanceAccountBalanceDto>> UpdateAccount(
        int id,
        FinanceAccountBalanceUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateAccount(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var account = await context.FinanceAccountBalances.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);
        if (account is null)
        {
            return NotFound();
        }

        Apply(account, dto);
        await UpsertAccountHistory(account, dto, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(account);
    }

    [HttpGet("accounts/{id:int}/history")]
    public async Task<ActionResult<IEnumerable<FinanceAccountBalanceHistoryDto>>> GetAccountHistory(
        int id,
        CancellationToken cancellationToken)
    {
        var accountExists = await context.FinanceAccountBalances.AnyAsync(account => account.Id == id, cancellationToken);
        if (!accountExists)
        {
            return NotFound();
        }

        var history = await context.FinanceAccountBalanceHistory
            .AsNoTracking()
            .Where(item => item.FinanceAccountBalanceId == id)
            .OrderByDescending(item => item.AsOfDate)
            .ThenByDescending(item => item.RecordedAt)
            .ToListAsync(cancellationToken);

        return history.Select(ToDto).ToList();
    }

    [HttpGet("history/net-worth")]
    public async Task<ActionResult<IEnumerable<FinanceNetWorthHistoryDto>>> GetNetWorthHistory(CancellationToken cancellationToken)
    {
        var history = await context.FinanceAccountBalanceHistory
            .AsNoTracking()
            .Include(item => item.FinanceAccountBalance)
            .Where(item => item.FinanceAccountBalance != null && item.FinanceAccountBalance.IsActive)
            .OrderBy(item => item.AsOfDate)
            .ThenBy(item => item.RecordedAt)
            .ToListAsync(cancellationToken);

        var dates = history
            .Select(item => item.AsOfDate.Date)
            .Distinct()
            .OrderBy(date => date)
            .ToList();

        var rows = new List<FinanceNetWorthHistoryDto>();
        decimal? previousDebt = null;
        decimal? previousSavings = null;
        decimal? previousNetWorth = null;

        foreach (var date in dates)
        {
            var latestByAccount = history
                .Where(item => item.AsOfDate.Date <= date)
                .GroupBy(item => item.FinanceAccountBalanceId)
                .Select(group => group
                    .OrderByDescending(item => item.AsOfDate)
                    .ThenByDescending(item => item.RecordedAt)
                    .First())
                .ToList();
            var totalDebt = latestByAccount
                .Where(item => item.FinanceAccountBalance?.IsDebt == true)
                .Sum(item => item.Balance);
            var totalSavings = latestByAccount
                .Where(item => item.FinanceAccountBalance?.IsDebt == false)
                .Sum(item => item.Balance);
            var netWorth = totalSavings - totalDebt;
            var updateCount = history.Count(item => item.AsOfDate.Date == date);

            rows.Add(new FinanceNetWorthHistoryDto(
                date,
                totalDebt,
                totalSavings,
                netWorth,
                previousDebt is null ? null : totalDebt - previousDebt.Value,
                previousSavings is null ? null : totalSavings - previousSavings.Value,
                previousNetWorth is null ? null : netWorth - previousNetWorth.Value,
                updateCount));

            previousDebt = totalDebt;
            previousSavings = totalSavings;
            previousNetWorth = netWorth;
        }

        return rows.OrderByDescending(row => row.AsOfDate).ToList();
    }

    [HttpDelete("accounts/{id:int}")]
    public async Task<IActionResult> DeleteAccount(int id, CancellationToken cancellationToken)
    {
        var account = await context.FinanceAccountBalances.SingleOrDefaultAsync(account => account.Id == id, cancellationToken);
        if (account is null)
        {
            return NotFound();
        }

        context.FinanceAccountBalances.Remove(account);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("bills")]
    public async Task<ActionResult<FinanceRecurringBillDto>> CreateBill(
        FinanceRecurringBillUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateBill(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var bill = new FinanceRecurringBill();
        Apply(bill, dto);
        context.FinanceRecurringBills.Add(bill);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(bill, null, DateTime.Today.Year, DateTime.Today.Month);
    }

    [HttpPut("bills/{id:int}")]
    public async Task<ActionResult<FinanceRecurringBillDto>> UpdateBill(
        int id,
        FinanceRecurringBillUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateBill(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var bill = await context.FinanceRecurringBills.SingleOrDefaultAsync(bill => bill.Id == id, cancellationToken);
        if (bill is null)
        {
            return NotFound();
        }

        Apply(bill, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(bill, null, DateTime.Today.Year, DateTime.Today.Month);
    }

    [HttpPatch("bills/{id:int}/payment")]
    public async Task<ActionResult<FinanceRecurringBillDto>> UpdateBillPayment(
        int id,
        [FromQuery] int year,
        [FromQuery] int month,
        FinanceRecurringBillPaymentDto dto,
        CancellationToken cancellationToken)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            return BadRequest("Year and month are required.");
        }

        var bill = await context.FinanceRecurringBills.SingleOrDefaultAsync(bill => bill.Id == id, cancellationToken);
        if (bill is null)
        {
            return NotFound();
        }
        if (!IsBillDueForMonth(bill, year, month))
        {
            return BadRequest("This bill is not due for the selected month.");
        }

        var payment = await context.FinanceRecurringBillPayments.SingleOrDefaultAsync(
            payment => payment.RecurringBillId == id && payment.Year == year && payment.Month == month,
            cancellationToken);

        if (payment is null)
        {
            payment = new FinanceRecurringBillPayment
            {
                RecurringBillId = id,
                Year = year,
                Month = month
            };
            context.FinanceRecurringBillPayments.Add(payment);
        }

        payment.IsPaid = dto.IsPaid;
        payment.PaidDate = dto.IsPaid ? dto.PaidDate ?? DateTime.UtcNow.Date : null;
        payment.AmountPaid = dto.IsPaid ? dto.AmountPaid ?? bill.ExpectedAmount : null;
        payment.Notes = Clean(dto.Notes);
        await context.SaveChangesAsync(cancellationToken);

        return ToDto(bill, payment, year, month);
    }

    [HttpPost("bills/payments/copy-prior-month")]
    public async Task<ActionResult<FinanceBillBatchResultDto>> CopyPriorMonthBillPayments(
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            return BadRequest("Year and month are required.");
        }

        var selectedMonth = new DateTime(year, month, 1);
        var priorMonth = selectedMonth.AddMonths(-1);
        var bills = await context.FinanceRecurringBills
            .Include(bill => bill.Payments)
            .Where(bill => bill.IsActive)
            .ToListAsync(cancellationToken);

        var updated = 0;
        var skipped = 0;
        foreach (var bill in bills.Where(bill => IsBillDueForMonth(bill, year, month)))
        {
            var priorPayment = bill.Payments.FirstOrDefault(payment =>
                payment.Year == priorMonth.Year &&
                payment.Month == priorMonth.Month &&
                payment.IsPaid);
            var currentPayment = bill.Payments.FirstOrDefault(payment =>
                payment.Year == year &&
                payment.Month == month);

            if (priorPayment is null || currentPayment?.IsPaid == true)
            {
                skipped++;
                continue;
            }

            currentPayment ??= AddBillPayment(bill, year, month);
            currentPayment.IsPaid = true;
            currentPayment.AmountPaid = priorPayment.AmountPaid ?? bill.ExpectedAmount;
            currentPayment.PaidDate = ShiftPaymentDate(priorPayment.PaidDate, year, month, bill.DueDay);
            currentPayment.Notes = priorPayment.Notes;
            updated++;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new FinanceBillBatchResultDto(updated, skipped, $"Copied {updated} prior-month bill payments.");
    }

    [HttpPost("bills/payments/mark-expected-paid")]
    public async Task<ActionResult<FinanceBillBatchResultDto>> MarkExpectedBillsPaid(
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        if (year < 2000 || month is < 1 or > 12)
        {
            return BadRequest("Year and month are required.");
        }

        var bills = await context.FinanceRecurringBills
            .Include(bill => bill.Payments)
            .Where(bill => bill.IsActive)
            .ToListAsync(cancellationToken);

        var updated = 0;
        var skipped = 0;
        foreach (var bill in bills.Where(bill => IsBillDueForMonth(bill, year, month)))
        {
            var payment = bill.Payments.FirstOrDefault(payment => payment.Year == year && payment.Month == month);
            if (payment?.IsPaid == true)
            {
                skipped++;
                continue;
            }

            payment ??= AddBillPayment(bill, year, month);
            payment.IsPaid = true;
            payment.AmountPaid = bill.ExpectedAmount;
            payment.PaidDate = SuggestedPaidDate(year, month, bill.DueDay);
            payment.Notes = payment.Notes;
            updated++;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new FinanceBillBatchResultDto(updated, skipped, $"Marked {updated} expected bills paid.");
    }

    [HttpDelete("bills/{id:int}")]
    public async Task<IActionResult> DeleteBill(int id, CancellationToken cancellationToken)
    {
        var bill = await context.FinanceRecurringBills.SingleOrDefaultAsync(bill => bill.Id == id, cancellationToken);
        if (bill is null)
        {
            return NotFound();
        }

        context.FinanceRecurringBills.Remove(bill);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("bills/report")]
    public async Task<ActionResult<FinanceBillReportDto>> GetBillReport(
        [FromQuery] int? year,
        [FromQuery] int? month,
        CancellationToken cancellationToken)
    {
        var today = DateTime.Today;
        var selectedYear = year ?? today.Year;
        var selectedMonth = month is >= 1 and <= 12 ? month.Value : today.Month;
        if (selectedYear < 2000)
        {
            return BadRequest("Year must be 2000 or later.");
        }

        var bills = await context.FinanceRecurringBills
            .AsNoTracking()
            .Include(bill => bill.Payments)
            .OrderBy(bill => bill.DueDay)
            .ThenBy(bill => bill.Category)
            .ThenBy(bill => bill.Name)
            .ToListAsync(cancellationToken);
        var activeBills = bills.Where(bill => bill.IsActive).ToList();

        var unpaidByMonth = Enumerable.Range(1, 12)
            .Select(reportMonth =>
            {
                var unpaidBills = activeBills
                    .Where(bill => IsBillDueForMonth(bill, selectedYear, reportMonth))
                    .Where(bill => !bill.Payments.Any(payment =>
                        payment.Year == selectedYear &&
                        payment.Month == reportMonth &&
                        payment.IsPaid))
                    .ToList();
                return new FinanceUnpaidBillsByMonthDto(
                    selectedYear,
                    reportMonth,
                    unpaidBills.Count,
                    unpaidBills.Sum(bill => bill.ExpectedAmount ?? 0m));
            })
            .ToList();

        var paymentHistory = bills
            .SelectMany(bill => bill.Payments
                .Where(payment => payment.Year == selectedYear)
                .Select(payment => new FinanceBillPaymentHistoryDto(
                    bill.Id,
                    bill.Name,
                    bill.Category,
                    payment.Year,
                    payment.Month,
                    payment.IsPaid,
                    payment.PaidDate,
                    bill.ExpectedAmount,
                    payment.AmountPaid,
                    payment.Notes)))
            .OrderByDescending(payment => payment.Year)
            .ThenByDescending(payment => payment.Month)
            .ThenBy(payment => payment.BillName)
            .ToList();

        var paidTotalsByCategory = paymentHistory
            .Where(payment => payment.IsPaid)
            .GroupBy(payment => payment.Category)
            .Select(group => new FinancePaidTotalByCategoryDto(
                group.Key,
                group.Sum(payment => payment.AmountPaid ?? payment.ExpectedAmount ?? 0m),
                group.Count()))
            .OrderByDescending(category => category.PaidTotal)
            .ThenBy(category => category.Category)
            .ToList();

        var monthStart = new DateTime(selectedYear, selectedMonth, 1);
        var nextMonth = monthStart.AddMonths(1);
        var upcomingAndOverdue = activeBills
            .Select(bill =>
            {
                var dueDay = Math.Min(bill.DueDay, DateTime.DaysInMonth(selectedYear, selectedMonth));
                var dueDate = new DateTime(selectedYear, selectedMonth, dueDay);
                var payment = bill.Payments.FirstOrDefault(payment => payment.Year == selectedYear && payment.Month == selectedMonth);
                var isPaid = payment?.IsPaid ?? false;
                var status = !IsBillDueForMonth(bill, selectedYear, selectedMonth) ? "Not Due" :
                    isPaid ? "Paid" :
                    dueDate.Date < today.Date ? "Overdue" :
                    dueDate.Date < nextMonth.Date && dueDate.Date >= today.Date ? "Upcoming" :
                    "Open";
                return new FinanceUpcomingBillDto(
                    bill.Id,
                    bill.Name,
                    bill.Category,
                    dueDate,
                    bill.ExpectedAmount,
                    isPaid,
                    payment?.PaidDate,
                    payment?.AmountPaid,
                    status);
            })
            .Where(item => item.Status is "Overdue" or "Upcoming")
            .OrderBy(item => item.DueDate)
            .ThenBy(item => item.BillName)
            .ToList();

        var annualBillSummaries = activeBills
            .Select(bill =>
            {
                var dueMonths = Enumerable.Range(1, 12)
                    .Where(reportMonth => IsBillDueForMonth(bill, selectedYear, reportMonth))
                    .ToList();
                var paidPayments = bill.Payments
                    .Where(payment => payment.Year == selectedYear && dueMonths.Contains(payment.Month) && payment.IsPaid)
                    .ToList();
                var paidTotal = paidPayments.Sum(payment => payment.AmountPaid ?? bill.ExpectedAmount ?? 0m);
                var expectedTotal = dueMonths.Sum(_ => bill.ExpectedAmount ?? 0m);

                return new FinanceBillAnnualSummaryDto(
                    bill.Id,
                    bill.Name,
                    bill.Category,
                    dueMonths.Count,
                    paidPayments.Count,
                    expectedTotal,
                    paidTotal,
                    paidPayments.Count == 0 ? 0m : paidTotal / paidPayments.Count,
                    dueMonths.Count == 0 ? 0m : Math.Round((decimal)paidPayments.Count / dueMonths.Count * 100m, 2),
                    paidPayments
                        .Where(payment => payment.PaidDate.HasValue)
                        .Select(payment => payment.PaidDate)
                        .Max());
            })
            .OrderBy(summary => summary.Category)
            .ThenBy(summary => summary.BillName)
            .ToList();

        var monthlyPaidTotals = Enumerable.Range(1, 12)
            .Select(reportMonth =>
            {
                var paymentsForMonth = paymentHistory
                    .Where(payment => payment.Month == reportMonth && payment.IsPaid)
                    .ToList();
                return new FinanceMonthlyPaidTotalDto(
                    selectedYear,
                    reportMonth,
                    paymentsForMonth.Sum(payment => payment.AmountPaid ?? payment.ExpectedAmount ?? 0m),
                    paymentsForMonth.Count);
            })
            .ToList();

        var frequencySummaries = activeBills
            .GroupBy(BillFrequencyLabel)
            .Select(group => new FinanceBillFrequencySummaryDto(
                group.Key,
                group.Count(),
                group.Sum(bill => ExpectedMonthlyAmount(bill))))
            .OrderByDescending(summary => summary.ExpectedMonthlyTotal)
            .ThenBy(summary => summary.Frequency)
            .ToList();

        var overdueRisks = activeBills
            .Select(bill =>
            {
                var dueMonths = Enumerable.Range(1, 12)
                    .Where(reportMonth => IsBillDueForMonth(bill, selectedYear, reportMonth))
                    .ToList();
                var paidPayments = bill.Payments
                    .Where(payment => payment.Year == selectedYear && dueMonths.Contains(payment.Month) && payment.IsPaid)
                    .ToList();
                var unpaidDueDates = dueMonths
                    .Where(reportMonth => !bill.Payments.Any(payment =>
                        payment.Year == selectedYear &&
                        payment.Month == reportMonth &&
                        payment.IsPaid))
                    .Select(reportMonth => new DateTime(
                        selectedYear,
                        reportMonth,
                        Math.Min(bill.DueDay, DateTime.DaysInMonth(selectedYear, reportMonth))))
                    .ToList();
                var overdueDates = unpaidDueDates
                    .Where(dueDate => dueDate.Date < today.Date)
                    .ToList();

                return new FinanceBillOverdueRiskDto(
                    bill.Id,
                    bill.Name,
                    bill.Category,
                    dueMonths.Count,
                    paidPayments.Count,
                    unpaidDueDates.Count,
                    overdueDates.Count,
                    unpaidDueDates.Count * (bill.ExpectedAmount ?? 0m),
                    unpaidDueDates.Count == 0 ? null : unpaidDueDates.Min(),
                    paidPayments
                        .Where(payment => payment.PaidDate.HasValue)
                        .Select(payment => payment.PaidDate)
                        .Max(),
                    dueMonths.Count == 0 ? 0m : Math.Round((decimal)paidPayments.Count / dueMonths.Count * 100m, 2));
            })
            .Where(row => row.UnpaidCount > 0 || row.PaymentRate < 100m)
            .OrderByDescending(row => row.OverdueCount)
            .ThenByDescending(row => row.UnpaidExpectedTotal)
            .ThenBy(row => row.BillName)
            .ToList();

        var paymentVariances = activeBills
            .Select(bill =>
            {
                var expected = bill.ExpectedAmount ?? 0m;
                var paidPayments = bill.Payments
                    .Where(payment => payment.Year == selectedYear && payment.IsPaid)
                    .Select(payment => payment.AmountPaid ?? expected)
                    .ToList();
                var variances = paidPayments.Select(amount => amount - expected).ToList();

                return new FinanceBillPaymentVarianceDto(
                    bill.Id,
                    bill.Name,
                    bill.Category,
                    paidPayments.Count,
                    expected,
                    paidPayments.Count == 0 ? 0m : Math.Round(paidPayments.Average(), 2),
                    variances.Count == 0 ? 0m : Math.Round(variances.Average(), 2),
                    variances.Count == 0 ? 0m : Math.Max(0m, variances.Max()),
                    variances.Count == 0 ? 0m : Math.Min(0m, variances.Min()));
            })
            .Where(row => row.PaymentCount > 0)
            .OrderByDescending(row => Math.Abs(row.AverageVariance))
            .ThenBy(row => row.BillName)
            .ToList();

        return new FinanceBillReportDto(
            unpaidByMonth,
            paymentHistory,
            paidTotalsByCategory,
            upcomingAndOverdue,
            annualBillSummaries,
            monthlyPaidTotals,
            frequencySummaries,
            overdueRisks,
            paymentVariances);
    }

    [HttpGet("export/xlsx")]
    public async Task<IActionResult> ExportWorkbook(
        [FromQuery] int? year,
        [FromQuery] int? month,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        CancellationToken cancellationToken)
    {
        var selectedDate = DateTime.Today;
        var selectedYear = year ?? selectedDate.Year;
        var selectedMonth = month is >= 1 and <= 12 ? month.Value : selectedDate.Month;
        var rangeStart = (startDate ?? new DateTime(selectedYear, 1, 1)).Date;
        var rangeEnd = (endDate ?? new DateTime(selectedYear, selectedMonth, DateTime.DaysInMonth(selectedYear, selectedMonth))).Date;

        var dashboard = (await GetDashboard(selectedYear, selectedMonth, cancellationToken)).Value;
        var billReport = (await GetBillReport(selectedYear, selectedMonth, cancellationToken)).Value;
        var netWorthHistory = (await GetNetWorthHistory(cancellationToken)).Value ?? [];
        var accountHistory = await context.FinanceAccountBalanceHistory
            .AsNoTracking()
            .Include(history => history.FinanceAccountBalance)
            .Where(history => history.AsOfDate.Date >= rangeStart && history.AsOfDate.Date <= rangeEnd)
            .OrderBy(history => history.AsOfDate)
            .ThenBy(history => history.FinanceAccountBalance != null ? history.FinanceAccountBalance.Category : string.Empty)
            .ThenBy(history => history.FinanceAccountBalance != null ? history.FinanceAccountBalance.Name : string.Empty)
            .ToListAsync(cancellationToken);
        var donationsInRange = await context.FinanceDonations
            .AsNoTracking()
            .Where(donation => donation.DonationDate.Date >= rangeStart && donation.DonationDate.Date <= rangeEnd)
            .OrderBy(donation => donation.DonationDate)
            .ThenBy(donation => donation.Organization)
            .ToListAsync(cancellationToken);
        if (dashboard is null || billReport is null)
        {
            return Problem("Unable to build finance workbook.");
        }

        var sheets = new List<WorkbookSheet>
        {
            new("Summary", [
                ["Metric", "Value"],
                ["Report Range", $"{rangeStart:d} to {rangeEnd:d}"],
                ["Selected Month", $"{selectedYear}-{selectedMonth:00}"],
                ["Total Debt", dashboard.TotalDebt],
                ["Total Savings", dashboard.TotalSavings],
                ["Net Worth", dashboard.NetWorth],
                ["Donation Total", dashboard.CurrentYearDonationTotal]
            ]),
            new("Balances", [
                ["Name", "Category", "Type", "Balance", "As Of", "Active", "Notes"],
                .. dashboard.Accounts
                    .Where(account => account.AsOfDate.Date >= rangeStart && account.AsOfDate.Date <= rangeEnd)
                    .Select(account => new object?[] { account.Name, account.Category, account.IsDebt ? "Debt" : "Asset", account.Balance, account.AsOfDate.Date, account.IsActive ? "Yes" : "No", account.Notes })
            ]),
            new("Net Worth", [
                ["As Of", "Total Debt", "Debt Change", "Total Savings", "Savings Change", "Net Worth", "Net Worth Change", "Updates"],
                .. netWorthHistory
                    .Where(row => row.AsOfDate.Date >= rangeStart && row.AsOfDate.Date <= rangeEnd)
                    .OrderBy(row => row.AsOfDate)
                    .Select(row => new object?[] { row.AsOfDate.Date, row.TotalDebt, row.DebtChange, row.TotalSavings, row.SavingsChange, row.NetWorth, row.NetWorthChange, row.AccountUpdates })
            ]),
            new("Account History", [
                ["As Of", "Account", "Category", "Type", "Balance", "Recorded At", "Notes"],
                .. accountHistory.Select(history => new object?[]
                {
                    history.AsOfDate.Date,
                    history.FinanceAccountBalance?.Name ?? string.Empty,
                    history.FinanceAccountBalance?.Category ?? string.Empty,
                    history.FinanceAccountBalance?.IsDebt == true ? "Debt" : "Asset",
                    history.Balance,
                    history.RecordedAt,
                    history.Notes
                })
            ]),
            new("Bills", [
                ["Due Day", "Name", "Category", "Frequency", "Expected", "Paid", "Paid Date", "Amount Paid", "Active", "Notes"],
                .. dashboard.Bills.Select(bill => new object?[] { bill.DueDay, bill.Name, bill.Category, BillFrequencyLabel(bill.BillingIntervalMonths), bill.ExpectedAmount, bill.IsPaidForSelectedMonth ? "Yes" : "No", bill.PaidDate?.Date, bill.AmountPaid, bill.IsActive ? "Yes" : "No", bill.Notes })
            ]),
            new("Bill Analytics", [
                ["Bill", "Category", "Due Count", "Paid Count", "Expected Total", "Paid Total", "Average Paid", "Payment Rate", "Last Paid"],
                .. billReport.AnnualBillSummaries.Select(row => new object?[] { row.BillName, row.Category, row.DueCount, row.PaidCount, row.ExpectedTotal, row.PaidTotal, row.AveragePaid, row.PaymentRate, row.LastPaidDate?.Date })
            ]),
            new("Monthly Bill Totals", [
                ["Year", "Month", "Paid Total", "Payment Count"],
                .. billReport.MonthlyPaidTotals.Select(row => new object?[] { row.Year, row.Month, row.PaidTotal, row.PaymentCount })
            ]),
            new("Unpaid By Month", [
                ["Year", "Month", "Unpaid Count", "Expected Total"],
                .. billReport.UnpaidByMonth.Select(row => new object?[] { row.Year, row.Month, row.UnpaidCount, row.ExpectedTotal })
            ]),
            new("Upcoming Overdue", [
                ["Due Date", "Bill", "Category", "Expected", "Paid", "Paid Date", "Amount Paid", "Status"],
                .. billReport.UpcomingAndOverdue.Select(row => new object?[] { row.DueDate.Date, row.BillName, row.Category, row.ExpectedAmount, row.IsPaid ? "Yes" : "No", row.PaidDate?.Date, row.AmountPaid, row.Status })
            ]),
            new("Category Bill Totals", [
                ["Category", "Paid Total", "Payment Count"],
                .. billReport.PaidTotalsByCategory.Select(row => new object?[] { row.Category, row.PaidTotal, row.PaymentCount })
            ]),
            new("Bill Frequencies", [
                ["Frequency", "Bill Count", "Expected Monthly Total"],
                .. billReport.FrequencySummaries.Select(row => new object?[] { row.Frequency, row.BillCount, row.ExpectedMonthlyTotal })
            ]),
            new("Overdue Risk", [
                ["Bill", "Category", "Due Count", "Paid Count", "Unpaid Count", "Overdue Count", "Unpaid Expected", "Oldest Unpaid Due", "Last Paid", "Payment Rate"],
                .. billReport.OverdueRisks.Select(row => new object?[] { row.BillName, row.Category, row.DueCount, row.PaidCount, row.UnpaidCount, row.OverdueCount, row.UnpaidExpectedTotal, row.OldestUnpaidDueDate?.Date, row.LastPaidDate?.Date, row.PaymentRate })
            ]),
            new("Payment Variance", [
                ["Bill", "Category", "Payment Count", "Expected", "Average Paid", "Average Variance", "Largest Overage", "Largest Underage"],
                .. billReport.PaymentVariances.Select(row => new object?[] { row.BillName, row.Category, row.PaymentCount, row.ExpectedAmount, row.AveragePaid, row.AverageVariance, row.LargestOverage, row.LargestUnderage })
            ]),
            new("Snapshots", [
                ["Snapshot Date", "Total Debt", "Total Savings", "Difference", "Frozen", "Notes"],
                .. dashboard.YearSnapshots
                    .Where(snapshot => snapshot.SnapshotDate.Date >= rangeStart && snapshot.SnapshotDate.Date <= rangeEnd)
                    .Select(snapshot => new object?[] { snapshot.SnapshotDate.Date, snapshot.TotalDebt, snapshot.TotalSavings, snapshot.Difference, snapshot.IsFrozen ? "Yes" : "No", snapshot.Notes })
            ]),
            new("Donations", [
                ["Date", "Organization", "Amount", "Method", "Receipt", "Receipt Reference", "Notes"],
                .. donationsInRange.Select(donation => new object?[] { donation.DonationDate.Date, donation.Organization, donation.Amount, donation.Method, donation.HasReceipt ? "Yes" : "No", donation.ReceiptReference, donation.Notes })
            ]),
            new("Donation Organizations", [
                ["Organization", "Donation Count", "Total", "Receipted Total", "Missing Receipt Total"],
                .. donationsInRange
                    .GroupBy(donation => donation.Organization)
                    .OrderBy(group => group.Key)
                    .Select(group => new object?[]
                    {
                        group.Key,
                        group.Count(),
                        group.Sum(donation => donation.Amount),
                        group.Where(donation => donation.HasReceipt).Sum(donation => donation.Amount),
                        group.Where(donation => !donation.HasReceipt).Sum(donation => donation.Amount)
                    })
            ]),
            new("Receipts Needed", [
                ["Date", "Organization", "Amount", "Method", "Receipt Reference", "Notes"],
                .. donationsInRange
                    .Where(donation => !donation.HasReceipt)
                    .Select(donation => new object?[] { donation.DonationDate.Date, donation.Organization, donation.Amount, donation.Method, donation.ReceiptReference, donation.Notes })
            ])
        };

        var bytes = BuildXlsx(sheets);
        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"finance-workbook-{rangeStart:yyyyMMdd}-to-{rangeEnd:yyyyMMdd}.xlsx");
    }

    [HttpPost("year-snapshots")]
    public async Task<ActionResult<FinanceYearSnapshotDto>> CreateYearSnapshot(
        FinanceYearSnapshotUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var snapshot = new FinanceYearSnapshot();
        Apply(snapshot, dto);
        context.FinanceYearSnapshots.Add(snapshot);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(snapshot);
    }

    [HttpPut("year-snapshots/{id:int}")]
    public async Task<ActionResult<FinanceYearSnapshotDto>> UpdateYearSnapshot(
        int id,
        FinanceYearSnapshotUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var snapshot = await context.FinanceYearSnapshots.SingleOrDefaultAsync(snapshot => snapshot.Id == id, cancellationToken);
        if (snapshot is null)
        {
            return NotFound();
        }

        Apply(snapshot, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(snapshot);
    }

    [HttpDelete("year-snapshots/{id:int}")]
    public async Task<IActionResult> DeleteYearSnapshot(int id, CancellationToken cancellationToken)
    {
        var snapshot = await context.FinanceYearSnapshots.SingleOrDefaultAsync(snapshot => snapshot.Id == id, cancellationToken);
        if (snapshot is null)
        {
            return NotFound();
        }

        context.FinanceYearSnapshots.Remove(snapshot);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("donations")]
    public async Task<ActionResult<FinanceDonationDto>> CreateDonation(
        FinanceDonationUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateDonation(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var donation = new FinanceDonation();
        Apply(donation, dto);
        context.FinanceDonations.Add(donation);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(donation);
    }

    [HttpPut("donations/{id:int}")]
    public async Task<ActionResult<FinanceDonationDto>> UpdateDonation(
        int id,
        FinanceDonationUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var validation = ValidateDonation(dto);
        if (validation is not null)
        {
            return BadRequest(validation);
        }

        var donation = await context.FinanceDonations.SingleOrDefaultAsync(donation => donation.Id == id, cancellationToken);
        if (donation is null)
        {
            return NotFound();
        }

        Apply(donation, dto);
        await context.SaveChangesAsync(cancellationToken);
        return ToDto(donation);
    }

    [HttpDelete("donations/{id:int}")]
    public async Task<IActionResult> DeleteDonation(int id, CancellationToken cancellationToken)
    {
        var donation = await context.FinanceDonations.SingleOrDefaultAsync(donation => donation.Id == id, cancellationToken);
        if (donation is null)
        {
            return NotFound();
        }

        context.FinanceDonations.Remove(donation);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? ValidateAccount(FinanceAccountBalanceUpsertDto dto) =>
        string.IsNullOrWhiteSpace(dto.Name) ? "Account name is required." :
        string.IsNullOrWhiteSpace(dto.Category) ? "Category is required." :
        null;

    private static string? ValidateBill(FinanceRecurringBillUpsertDto dto) =>
        string.IsNullOrWhiteSpace(dto.Name) ? "Bill name is required." :
        dto.DueDay is < 1 or > 31 ? "Due day must be between 1 and 31." :
        dto.BillingIntervalMonths is < 1 or > 12 ? "Billing interval must be between 1 and 12 months." :
        dto.StartMonth is < 1 or > 12 ? "Start month must be between 1 and 12." :
        null;

    private static string? ValidateDonation(FinanceDonationUpsertDto dto) =>
        string.IsNullOrWhiteSpace(dto.Organization) ? "Organization is required." :
        dto.Amount < 0 ? "Amount cannot be negative." :
        null;

    private static void Apply(FinanceAccountBalance account, FinanceAccountBalanceUpsertDto dto)
    {
        account.Name = dto.Name.Trim();
        account.Category = dto.Category.Trim();
        account.Balance = dto.Balance;
        account.IsDebt = dto.IsDebt;
        account.AsOfDate = dto.AsOfDate?.Date ?? DateTime.UtcNow.Date;
        account.SortOrder = dto.SortOrder;
        account.IsActive = dto.IsActive;
        account.Notes = Clean(dto.Notes);
    }

    private static void AddAccountHistory(FinanceAccountBalance account, FinanceAccountBalanceUpsertDto dto)
    {
        account.History.Add(new FinanceAccountBalanceHistory
        {
            Balance = dto.Balance,
            AsOfDate = dto.AsOfDate?.Date ?? DateTime.UtcNow.Date,
            RecordedAt = DateTime.UtcNow,
            Notes = Clean(dto.Notes)
        });
    }

    private async Task UpsertAccountHistory(
        FinanceAccountBalance account,
        FinanceAccountBalanceUpsertDto dto,
        CancellationToken cancellationToken)
    {
        var asOfDate = dto.AsOfDate?.Date ?? DateTime.UtcNow.Date;
        var history = await context.FinanceAccountBalanceHistory
            .SingleOrDefaultAsync(
                item => item.FinanceAccountBalanceId == account.Id && item.AsOfDate == asOfDate,
                cancellationToken);

        if (history is null)
        {
            history = new FinanceAccountBalanceHistory
            {
                FinanceAccountBalanceId = account.Id,
                AsOfDate = asOfDate
            };
            context.FinanceAccountBalanceHistory.Add(history);
        }

        history.Balance = dto.Balance;
        history.RecordedAt = DateTime.UtcNow;
        history.Notes = Clean(dto.Notes);
    }

    private static void Apply(FinanceRecurringBill bill, FinanceRecurringBillUpsertDto dto)
    {
        bill.Name = dto.Name.Trim();
        bill.Category = string.IsNullOrWhiteSpace(dto.Category) ? "Household" : dto.Category.Trim();
        bill.ExpectedAmount = dto.ExpectedAmount;
        bill.DueDay = dto.DueDay;
        bill.BillingIntervalMonths = Math.Max(1, Math.Min(12, dto.BillingIntervalMonths));
        bill.StartMonth = Math.Max(1, Math.Min(12, dto.StartMonth));
        bill.SortOrder = dto.SortOrder;
        bill.IsActive = dto.IsActive;
        bill.Notes = Clean(dto.Notes);
    }

    private static void Apply(FinanceYearSnapshot snapshot, FinanceYearSnapshotUpsertDto dto)
    {
        snapshot.SnapshotDate = dto.SnapshotDate.Date;
        snapshot.TotalDebt = dto.TotalDebt;
        snapshot.TotalSavings = dto.TotalSavings;
        snapshot.Difference = dto.Difference;
        snapshot.IsFrozen = dto.IsFrozen;
        snapshot.Notes = Clean(dto.Notes);
    }

    private static void Apply(FinanceDonation donation, FinanceDonationUpsertDto dto)
    {
        donation.DonationDate = dto.DonationDate.Date;
        donation.Organization = dto.Organization.Trim();
        donation.Amount = dto.Amount;
        donation.Method = Clean(dto.Method);
        donation.HasReceipt = dto.HasReceipt;
        donation.ReceiptReference = Clean(dto.ReceiptReference);
        donation.Notes = Clean(dto.Notes);
    }

    private static FinanceAccountBalanceDto ToDto(FinanceAccountBalance account) =>
        new(account.Id, account.Name, account.Category, account.Balance, account.IsDebt, account.AsOfDate, account.SortOrder, account.IsActive, account.Notes);

    private static FinanceAccountBalanceHistoryDto ToDto(FinanceAccountBalanceHistory history) =>
        new(history.Id, history.FinanceAccountBalanceId, history.Balance, history.AsOfDate, history.RecordedAt, history.Notes);

    private static FinanceRecurringBillDto ToDto(FinanceRecurringBill bill, FinanceRecurringBillPayment? payment, int selectedYear, int selectedMonth) =>
        new(
            bill.Id,
            bill.Name,
            bill.Category,
            bill.ExpectedAmount,
            bill.DueDay,
            bill.BillingIntervalMonths,
            bill.StartMonth,
            IsBillDueForMonth(bill, selectedYear, selectedMonth),
            bill.SortOrder,
            bill.IsActive,
            bill.Notes,
            payment?.IsPaid ?? false,
            payment?.PaidDate,
            payment?.AmountPaid,
            payment?.Notes);

    private static FinanceYearSnapshotDto ToDto(FinanceYearSnapshot snapshot) =>
        new(snapshot.Id, snapshot.SnapshotDate, snapshot.TotalDebt, snapshot.TotalSavings, snapshot.Difference, snapshot.IsFrozen, snapshot.Notes);

    private static FinanceDonationDto ToDto(FinanceDonation donation) =>
        new(donation.Id, donation.DonationDate, donation.Organization, donation.Amount, donation.Method, donation.HasReceipt, donation.ReceiptReference, donation.Notes);

    private static bool IsBillDueForMonth(FinanceRecurringBill bill, int year, int month)
    {
        _ = year;
        var interval = Math.Max(1, bill.BillingIntervalMonths);
        var startMonth = Math.Max(1, Math.Min(12, bill.StartMonth));
        var monthOffset = month - startMonth;
        return ((monthOffset % interval) + interval) % interval == 0;
    }

    private static string BillFrequencyLabel(FinanceRecurringBill bill) => BillFrequencyLabel(bill.BillingIntervalMonths);

    private static string BillFrequencyLabel(int billingIntervalMonths) =>
        Math.Max(1, billingIntervalMonths) switch
        {
            1 => "Monthly",
            2 => "Every 2 months",
            3 => "Quarterly",
            6 => "Twice yearly",
            12 => "Yearly",
            var months => $"Every {months} months"
        };

    private static decimal ExpectedMonthlyAmount(FinanceRecurringBill bill)
    {
        var interval = Math.Max(1, bill.BillingIntervalMonths);
        return (bill.ExpectedAmount ?? 0m) / interval;
    }

    private FinanceRecurringBillPayment AddBillPayment(FinanceRecurringBill bill, int year, int month)
    {
        var payment = new FinanceRecurringBillPayment
        {
            RecurringBillId = bill.Id,
            Year = year,
            Month = month
        };
        bill.Payments.Add(payment);
        context.FinanceRecurringBillPayments.Add(payment);
        return payment;
    }

    private static DateTime SuggestedPaidDate(int year, int month, int dueDay)
    {
        var selectedMonth = new DateTime(year, month, 1);
        var dueDate = selectedMonth.AddDays(Math.Min(dueDay, DateTime.DaysInMonth(year, month)) - 1);
        return selectedMonth.Year == DateTime.Today.Year && selectedMonth.Month == DateTime.Today.Month
            ? DateTime.Today.Date
            : dueDate;
    }

    private static DateTime ShiftPaymentDate(DateTime? priorPaidDate, int year, int month, int dueDay)
    {
        var day = priorPaidDate?.Day ?? dueDay;
        return new DateTime(year, month, Math.Min(day, DateTime.DaysInMonth(year, month)));
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static byte[] BuildXlsx(IReadOnlyList<WorkbookSheet> sheets)
    {
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteZipEntry(archive, "[Content_Types].xml", ContentTypesXml(sheets.Count));
            WriteZipEntry(archive, "_rels/.rels", RootRelationshipsXml());
            WriteZipEntry(archive, "xl/workbook.xml", WorkbookXml(sheets));
            WriteZipEntry(archive, "xl/_rels/workbook.xml.rels", WorkbookRelationshipsXml(sheets.Count));
            WriteZipEntry(archive, "xl/styles.xml", StylesXml());

            for (var i = 0; i < sheets.Count; i++)
            {
                WriteZipEntry(archive, $"xl/worksheets/sheet{i + 1}.xml", WorksheetXml(sheets[i]));
            }
        }

        return stream.ToArray();
    }

    private static void WriteZipEntry(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Optimal);
        using var writer = new StreamWriter(entry.Open(), new UTF8Encoding(false));
        writer.Write(content);
    }

    private static string ContentTypesXml(int sheetCount)
    {
        var sheetOverrides = string.Join("", Enumerable.Range(1, sheetCount)
            .Select(index => $"<Override PartName=\"/xl/worksheets/sheet{index}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>"));

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
            "<Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>" +
            "<Default Extension=\"xml\" ContentType=\"application/xml\"/>" +
            "<Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>" +
            "<Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>" +
            sheetOverrides +
            "</Types>";
    }

    private static string RootRelationshipsXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
        "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
        "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>" +
        "</Relationships>";

    private static string WorkbookXml(IReadOnlyList<WorkbookSheet> sheets)
    {
        var sheetXml = string.Join("", sheets.Select((sheet, index) =>
            $"<sheet name=\"{Xml(sheet.Name)}\" sheetId=\"{index + 1}\" r:id=\"rId{index + 1}\"/>"));

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">" +
            $"<sheets>{sheetXml}</sheets>" +
            "</workbook>";
    }

    private static string WorkbookRelationshipsXml(int sheetCount)
    {
        var relationships = string.Join("", Enumerable.Range(1, sheetCount)
            .Select(index => $"<Relationship Id=\"rId{index}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{index}.xml\"/>"));

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
            relationships +
            $"<Relationship Id=\"rId{sheetCount + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>" +
            "</Relationships>";
    }

    private static string StylesXml() =>
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
        "<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
        "<fonts count=\"2\"><font><sz val=\"11\"/><name val=\"Calibri\"/></font><font><b/><sz val=\"11\"/><name val=\"Calibri\"/></font></fonts>" +
        "<fills count=\"2\"><fill><patternFill patternType=\"none\"/></fill><fill><patternFill patternType=\"gray125\"/></fill></fills>" +
        "<borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>" +
        "<cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>" +
        "<cellXfs count=\"3\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/><xf numFmtId=\"14\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/></cellXfs>" +
        "<cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>" +
        "</styleSheet>";

    private static string WorksheetXml(WorkbookSheet sheet)
    {
        var rows = string.Join("", sheet.Rows.Select((row, rowIndex) =>
        {
            var cells = string.Join("", row.Select((value, columnIndex) => CellXml(value, rowIndex == 0, columnIndex + 1, rowIndex + 1)));
            return $"<row r=\"{rowIndex + 1}\">{cells}</row>";
        }));

        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
            "<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">" +
            $"<sheetData>{rows}</sheetData>" +
            "</worksheet>";
    }

    private static string CellXml(object? value, bool isHeader, int column, int row)
    {
        var reference = $"{ColumnName(column)}{row}";
        var style = isHeader ? " s=\"1\"" : value is DateTime ? " s=\"2\"" : string.Empty;

        if (value is null)
        {
            return $"<c r=\"{reference}\"{style}/>";
        }

        if (value is DateTime date)
        {
            return $"<c r=\"{reference}\"{style}><v>{date.ToOADate()}</v></c>";
        }

        if (value is decimal or double or float or int or long or short)
        {
            return $"<c r=\"{reference}\"{style}><v>{Convert.ToString(value, System.Globalization.CultureInfo.InvariantCulture)}</v></c>";
        }

        return $"<c r=\"{reference}\" t=\"inlineStr\"{style}><is><t>{Xml(Convert.ToString(value) ?? string.Empty)}</t></is></c>";
    }

    private static string ColumnName(int column)
    {
        var name = string.Empty;
        while (column > 0)
        {
            column--;
            name = (char)('A' + column % 26) + name;
            column /= 26;
        }

        return name;
    }

    private static string Xml(string value) =>
        value
            .Replace("&", "&amp;")
            .Replace("<", "&lt;")
            .Replace(">", "&gt;")
            .Replace("\"", "&quot;");

    private sealed record WorkbookSheet(string Name, IReadOnlyList<object?[]> Rows);
}


namespace Verdelak.Api.Models;

public class FinanceAccountBalance
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Savings";
    public decimal Balance { get; set; }
    public bool IsDebt { get; set; }
    public DateTime AsOfDate { get; set; } = DateTime.UtcNow.Date;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public List<FinanceAccountBalanceHistory> History { get; set; } = [];
}

public class FinanceAccountBalanceHistory
{
    public int Id { get; set; }
    public int FinanceAccountBalanceId { get; set; }
    public decimal Balance { get; set; }
    public DateTime AsOfDate { get; set; } = DateTime.UtcNow.Date;
    public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }

    public FinanceAccountBalance? FinanceAccountBalance { get; set; }
}

public class FinanceRecurringBill
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Household";
    public decimal? ExpectedAmount { get; set; }
    public int DueDay { get; set; } = 1;
    public int BillingIntervalMonths { get; set; } = 1;
    public int StartMonth { get; set; } = 1;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public List<FinanceRecurringBillPayment> Payments { get; set; } = [];
}

public class FinanceRecurringBillPayment
{
    public int Id { get; set; }
    public int RecurringBillId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal? AmountPaid { get; set; }
    public DateTime? PaidDate { get; set; }
    public bool IsPaid { get; set; }
    public string? Notes { get; set; }

    public FinanceRecurringBill? RecurringBill { get; set; }
}

public class FinanceYearSnapshot
{
    public int Id { get; set; }
    public DateTime SnapshotDate { get; set; }
    public decimal TotalDebt { get; set; }
    public decimal TotalSavings { get; set; }
    public decimal Difference { get; set; }
    public bool IsFrozen { get; set; } = true;
    public string? Notes { get; set; }
}

public class FinanceDonation
{
    public int Id { get; set; }
    public DateTime DonationDate { get; set; } = DateTime.UtcNow.Date;
    public string Organization { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Method { get; set; }
    public bool HasReceipt { get; set; }
    public string? ReceiptReference { get; set; }
    public string? Notes { get; set; }
}

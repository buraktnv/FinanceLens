"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { dashboardApi, incomesApi, expensesApi } from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function StatusPage() {
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => dashboardApi.getOverview(),
  });

  const { data: incomeSummary } = useQuery({
    queryKey: ["incomes", "summary"],
    queryFn: () => incomesApi.getSummary(),
  });

  const { data: expenseSummary } = useQuery({
    queryKey: ["expenses", "summary"],
    queryFn: () => expensesApi.getSummary(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">
          {error instanceof Error ? error.message : "Error loading data"}
        </p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  const netWorth = overview.netWorth;
  const totalAssets = overview.totalAssets;
  const totalLiabilities = overview.totalDebt;
  const monthlyExpenses = overview.monthly.expenses;
  const monthlyIncome = overview.monthly.income;
  const monthlySavings = overview.monthly.savings;
  const savingsRate = Number(overview.monthly.savingsRate) || 0;

  // Derived metrics
  const monthsOfSavings = monthlyExpenses > 0 ? Math.floor(netWorth / monthlyExpenses) : 0;
  const investmentsValue =
    overview.breakdown.stocks.value +
    overview.breakdown.etfs.value +
    overview.breakdown.eurobonds.value;
  const cashAndMetalsValue =
    overview.breakdown.cash.value +
    overview.breakdown.gold.value +
    overview.breakdown.silver.value;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="text-xl sm:text-2xl font-bold">FinanceLens</span>
              </div>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold">Financial Status Summary</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Net Worth Summary */}
        <Card className="mb-6 sm:mb-8">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-base sm:text-lg text-muted-foreground">Net Worth</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Net Worth Amount */}
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-3">
                {formatCurrency(netWorth)}
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Assets: </span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalAssets)}</span>
                </div>
                <span className="hidden sm:inline text-muted-foreground">•</span>
                <div>
                  <span className="text-muted-foreground">Debt: </span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalLiabilities)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Key Financial Metrics */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Savings Last</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{monthsOfSavings} Months</p>
                <p className="text-xs text-muted-foreground">At {formatCurrency(monthlyExpenses)}/mo expenses</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Monthly Savings</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(monthlySavings)}</p>
                <p className="text-xs text-muted-foreground">{formatPercent(savingsRate)} of income</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Save Rate</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{formatPercent(savingsRate)}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(monthlyIncome)}/mo income</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Breakdown */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3 mb-6 sm:mb-8">
          {/* Investments */}
          <AssetCard
            icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Investments"
            value={formatCurrency(investmentsValue)}
            items={[
              { label: "Stocks", value: formatCurrency(overview.breakdown.stocks.value), extra: `${overview.breakdown.stocks.count} positions` },
              { label: "ETFs", value: formatCurrency(overview.breakdown.etfs.value), extra: `${overview.breakdown.etfs.count} funds` },
              { label: "Eurobonds", value: formatCurrency(overview.breakdown.eurobonds.value), extra: `${overview.breakdown.eurobonds.count} bonds` },
            ]}
          />

          {/* Cash & Precious Metals */}
          <AssetCard
            icon={<Wallet className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Cash & Metals"
            value={formatCurrency(cashAndMetalsValue)}
            items={[
              { label: "Cash Accounts", value: formatCurrency(overview.breakdown.cash.value), extra: `${overview.breakdown.cash.count} accounts` },
              { label: "Gold Holdings", value: formatCurrency(overview.breakdown.gold.value), extra: `${overview.breakdown.gold.count} holdings` },
              { label: "Silver Holdings", value: formatCurrency(overview.breakdown.silver.value), extra: `${overview.breakdown.silver.count} holdings` },
            ]}
          />

          {/* Liabilities */}
          <LiabilityCard
            icon={<CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />}
            title="Liabilities"
            value={formatCurrency(totalLiabilities)}
            items={[
              { label: "Loans", value: formatCurrency(overview.breakdown.loans.balance), extra: `${overview.breakdown.loans.count} active loan${overview.breakdown.loans.count !== 1 ? "s" : ""}` },
            ]}
          />
        </div>

        {/* Monthly Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Monthly Cash Flow</CardTitle>
            <CardDescription className="text-sm">Current month income and expenses breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              <SummaryItem label="Income" value={formatCurrency(monthlyIncome)} type="income" />
              <SummaryItem label="Expenses" value={formatCurrency(monthlyExpenses)} type="expense" />
              <SummaryItem label="Savings" value={formatCurrency(monthlySavings)} type="savings" />
              <SummaryItem label="Save Rate" value={formatPercent(savingsRate)} type="rate" />
            </div>

            {/* Detailed Breakdown */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              {/* Income Sources */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Income Sources</h3>
                <div className="space-y-2">
                  {incomeSummary && Object.entries(incomeSummary.byType).length > 0 ? (
                    Object.entries(incomeSummary.byType).map(([label, amount]) => {
                      const pct = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
                      return (
                        <CashFlowItem
                          key={label}
                          label={label}
                          value={formatCurrency(amount)}
                          percentage={pct}
                          color="bg-green-500"
                        />
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No income data</p>
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">Expense Categories</h3>
                <div className="space-y-2">
                  {expenseSummary && Object.entries(expenseSummary.byCategory).length > 0 ? (
                    Object.entries(expenseSummary.byCategory).map(([label, amount]) => {
                      const pct = monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0;
                      return (
                        <CashFlowItem
                          key={label}
                          label={label}
                          value={formatCurrency(amount)}
                          percentage={pct}
                          color="bg-red-500"
                        />
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground">No expense data</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function AssetCard({
  icon,
  title,
  value,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  items: { label: string; value: string; extra?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
        </div>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
              <div className="min-w-0 flex-1">
                <span className="truncate block">{item.label}</span>
                {item.extra && <p className="text-xs text-muted-foreground truncate">{item.extra}</p>}
              </div>
              <span className="font-medium ml-2 shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LiabilityCard({
  icon,
  title,
  value,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  items: { label: string; value: string; extra?: string }[];
}) {
  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg text-red-600">{icon}</div>
          <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{value}</p>
          <Badge variant="destructive" className="text-xs">Debt</Badge>
        </div>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-start text-xs sm:text-sm">
              <div className="min-w-0 flex-1">
                <span className="truncate block">{item.label}</span>
                {item.extra && <p className="text-xs text-muted-foreground truncate">{item.extra}</p>}
              </div>
              <span className="font-medium text-red-600 ml-2 shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: "income" | "expense" | "savings" | "rate";
}) {
  const colors = {
    income: "text-green-600",
    expense: "text-red-600",
    savings: "text-blue-600",
    rate: "text-purple-600",
  };

  return (
    <div className="text-center p-3 sm:p-4 bg-gray-100 rounded-lg">
      <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
      <p className={`text-lg sm:text-2xl font-bold ${colors[type]}`}>{value}</p>
    </div>
  );
}

function CashFlowItem({
  label,
  value,
  percentage,
  color,
}: {
  label: string;
  value: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
        </div>
        <span className="text-xs text-muted-foreground w-10 text-right">{formatPercent(percentage)}</span>
      </div>
    </div>
  );
}

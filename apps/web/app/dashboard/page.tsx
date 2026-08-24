"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Plus } from "lucide-react";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
} from "@/components/shared";
import { dashboardApi } from "@/lib/api";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

export default function DashboardPage() {
  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => dashboardApi.getOverview(),
  });

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["dashboard", "transactions"],
    queryFn: () => dashboardApi.getRecentTransactions(5),
  });

  const isLoading = overviewLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 md:h-9" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (overviewError) {
    return (
      <ErrorState
        message={
          overviewError instanceof Error ? overviewError.message : undefined
        }
        onRetry={() => refetchOverview()}
      />
    );
  }

  const netWorth = overview?.netWorth ?? 0;
  const totalAssets = overview?.totalAssets ?? 0;
  const monthlyIncome = overview?.monthly?.income ?? 0;
  const monthlyExpenses = overview?.monthly?.expenses ?? 0;
  const monthlySavings = overview?.monthly?.savings ?? 0;
  const savingsRate = overview?.monthly?.savingsRate ?? 0;

  // Calculate how long savings will last (runway: net worth / monthly expenses)
  const monthsOfSavings = monthlyExpenses > 0 ? Math.floor(netWorth / monthlyExpenses) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <PageHeader title="Overview" description="Your financial summary" />

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          icon={Wallet}
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Monthly Expenses"
          value={formatCurrency(monthlyExpenses)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(monthlySavings)}
          icon={PiggyBank}
          tone={monthlySavings >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Add Cash"
          description="Add new cash account"
          href="/dashboard/cash"
        />
        <QuickActionCard
          title="Add Gold"
          description="Add gold holdings"
          href="/dashboard/gold"
        />
        <QuickActionCard
          title="Add Silver"
          description="Add silver holdings"
          href="/dashboard/silver"
        />
        <QuickActionCard
          title="Add Stock"
          description="Add stock position"
          href="/dashboard/stocks"
        />
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Asset Allocation</CardTitle>
            <CardDescription className="text-sm">Distribution of your assets by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {overview?.breakdown && (
                <>
                  <PortfolioItem
                    label="Cash"
                    value={formatCurrency(overview.breakdown.cash?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.cash?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-emerald-500"
                  />
                  <PortfolioItem
                    label="Gold"
                    value={formatCurrency(overview.breakdown.gold?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.gold?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-amber-500"
                  />
                  <PortfolioItem
                    label="Silver"
                    value={formatCurrency(overview.breakdown.silver?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.silver?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-slate-400"
                  />
                  <PortfolioItem
                    label="Stocks"
                    value={formatCurrency(overview.breakdown.stocks?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.stocks?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-blue-500"
                  />
                  <PortfolioItem
                    label="ETFs"
                    value={formatCurrency(overview.breakdown.etfs?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.etfs?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-green-500"
                  />
                  <PortfolioItem
                    label="Eurobonds"
                    value={formatCurrency(overview.breakdown.eurobonds?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.eurobonds?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-yellow-500"
                  />
                </>
              )}
              {(!overview?.breakdown || (
                (overview.breakdown.cash?.value ?? 0) === 0 &&
                (overview.breakdown.gold?.value ?? 0) === 0 &&
                (overview.breakdown.silver?.value ?? 0) === 0 &&
                (overview.breakdown.stocks?.value ?? 0) === 0 &&
                (overview.breakdown.etfs?.value ?? 0) === 0 &&
                (overview.breakdown.eurobonds?.value ?? 0) === 0
              )) && (
                <EmptyState title="No investments added yet" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Recent Transactions</CardTitle>
            <CardDescription className="text-sm">Latest financial transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {transactionsError ? (
                <ErrorState
                  message={
                    transactionsError instanceof Error
                      ? transactionsError.message
                      : undefined
                  }
                  onRetry={() => refetchTransactions()}
                />
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    title={tx.description || tx.category}
                    date={formatDate(tx.date)}
                    amount={`${tx.type === "income" ? "+" : "-"}${formatCurrency(tx.amount, tx.currency)}`}
                    type={tx.type === "income" ? "income" : "expense"}
                  />
                ))
              ) : (
                <EmptyState title="No transactions yet" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Savings Projection</CardTitle>
          <CardDescription className="text-sm">Future estimate based on current savings rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">How Long Will Savings Last?</p>
              <p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">{monthsOfSavings} Months</p>
              <p className="text-xs text-muted-foreground">At current expenses</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">Monthly Savings Rate</p>
              <p className={`text-2xl md:text-3xl font-bold tabular-nums ${Number(savingsRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercent(savingsRate)}
              </p>
              <p className="text-xs text-muted-foreground">Of income</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">Total Assets</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 tabular-nums">{formatCurrency(totalAssets)}</p>
              <p className="text-xs text-muted-foreground">Sum of all assets</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
          <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Plus className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm md:text-base font-medium truncate">{title}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function PortfolioItem({
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm">{label}</span>
        <span className="text-xs md:text-sm font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
    </div>
  );
}

function TransactionItem({
  title,
  date,
  amount,
  type,
}: {
  title: string;
  date: string;
  amount: string;
  type: "buy" | "income" | "expense";
}) {
  const colors = {
    buy: "text-blue-600",
    income: "text-green-600",
    expense: "text-red-600",
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm md:text-base font-medium truncate">{title}</p>
        <p className="text-xs md:text-sm text-muted-foreground">{date}</p>
      </div>
      <span className={`text-sm md:text-base font-medium ${colors[type]} shrink-0 tabular-nums`}>{amount}</span>
    </div>
  );
}

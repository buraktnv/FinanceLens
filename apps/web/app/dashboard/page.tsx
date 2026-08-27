"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  X,
  Banknote,
} from "lucide-react";
import Link from "next/link";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  StatCard,
} from "@/components/shared";
import { cashApi, dashboardApi, expensesApi } from "@/lib/api";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { AllocationDonut } from "@/components/charts/allocation-donut";
import { CategoryBar } from "@/components/charts/category-bar";

const CURRENCY_SYMBOLS: Record<string, string> = {
  TRY: "₺",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export default function DashboardPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [dismissedFxSignal, setDismissedFxSignal] = useState<string | null>(
    null
  );

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

  const {
    data: expenseSummary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["expenses", "summary", currentYear, currentMonth],
    queryFn: () => expensesApi.getSummary(currentMonth, currentYear),
  });

  const { data: cashSummary, isLoading: cashSummaryLoading } = useQuery({
    queryKey: ["cash", "summary"],
    queryFn: () => cashApi.getSummary(),
  });

  const isLoading =
    overviewLoading ||
    transactionsLoading ||
    summaryLoading ||
    cashSummaryLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 md:h-9" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-52" />
      </div>
    );
  }

  if (overviewError) {
    return (
      <ErrorState
        message={
          overviewError instanceof Error
            ? overviewError.message
            : "Finansal özet yüklenemedi"
        }
        onRetry={() => refetchOverview()}
        retryLabel="Yenile"
      />
    );
  }

  const fxWarnings = overview?.warnings ?? [];
  // Dismissal is keyed to the current signal so a changed warning set or a
  // new staleness flag resurfaces the banner.
  const fxSignalKey = `${overview?.stale ? "stale" : ""}|${fxWarnings.join("|")}`;
  const showFxBanner =
    (overview?.stale === true || fxWarnings.length > 0) &&
    dismissedFxSignal !== fxSignalKey;

  const netWorth = overview?.netWorth ?? 0;
  const totalAssets = overview?.totalAssets ?? 0;
  const monthlyIncome = overview?.monthly?.income ?? 0;
  const monthlyExpenses = overview?.monthly?.expenses ?? 0;
  const monthlySavings = overview?.monthly?.savings ?? 0;
  const savingsRate = overview?.monthly?.savingsRate ?? 0;

  // Calculate how long savings will last (runway: net worth / monthly expenses)
  const monthsOfSavings = monthlyExpenses > 0 ? Math.floor(netWorth / monthlyExpenses) : 0;

  // Multi-currency honesty for the cash aggregate: the total mixes balances
  // without conversion, so disclose which currencies are present.
  const cashCurrencies = Object.keys(cashSummary?.byCurrency ?? {});
  const cashHint =
    cashCurrencies.length > 1
      ? `${cashCurrencies.map((c) => CURRENCY_SYMBOLS[c] ?? c).join(", ")} cinsi hesaplar`
      : undefined;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <PageHeader title="Genel Bakış" description="Finansal özetiniz" />

      {/* FX staleness / unsupported-currency warning */}
      {showFxBanner ? (
        <Card className="border-warning/30 bg-warning/15">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-warning-foreground">
                Döviz kurları güncellenemedi — desteklenmeyen para birimleri
                nominal sayıldı
              </p>
              {fxWarnings.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                  {fxWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-warning-foreground"
              aria-label="Uyarıyı kapat"
              onClick={() => setDismissedFxSignal(fxSignalKey)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Varlık"
          value={formatCurrency(totalAssets)}
          icon={Wallet}
        />
        <StatCard
          title="Aylık Gelir"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Aylık Gider"
          value={formatCurrency(monthlyExpenses)}
          icon={TrendingDown}
          tone="danger"
        />
        <StatCard
          title="Aylık Birikim"
          value={formatCurrency(monthlySavings)}
          icon={PiggyBank}
          tone={monthlySavings >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="Nakit"
          value={formatCurrency(cashSummary?.totalBalance)}
          hint={cashHint}
          icon={Banknote}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Nakit Ekle"
          description="Yeni nakit hesabı ekle"
          href="/dashboard/cash"
        />
        <QuickActionCard
          title="Altın Ekle"
          description="Altın varlığı ekle"
          href="/dashboard/gold"
        />
        <QuickActionCard
          title="Gümüş Ekle"
          description="Gümüş varlığı ekle"
          href="/dashboard/silver"
        />
        <QuickActionCard
          title="Hisse Ekle"
          description="Hisse pozisyonu ekle"
          href="/dashboard/stocks"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Varlık Dağılımı</CardTitle>
            <CardDescription className="text-sm">
              Varlıklarınızın türlere göre dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overview?.breakdown ? (
              <AllocationDonut breakdown={overview.breakdown} />
            ) : (
              <EmptyState title="Henüz yatırım eklenmedi" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Harcama Kategorileri
            </CardTitle>
            <CardDescription className="text-sm">
              Bu ay harcamalarınız nereye gitti?
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summaryError ? (
              <ErrorState
                message={
                  summaryError instanceof Error
                    ? summaryError.message
                    : undefined
                }
                onRetry={() => refetchSummary()}
                retryLabel="Yenile"
              />
            ) : summaryLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <CategoryBar byCategory={expenseSummary?.byCategory ?? {}} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Son İşlemler</CardTitle>
          <CardDescription className="text-sm">
            Son finansal hareketler
          </CardDescription>
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
                retryLabel="Yenile"
              />
            ) : transactions.length > 0 ? (
              transactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  title={tx.description || tx.category}
                  date={formatDate(tx.date)}
                  amount={formatCurrency(tx.amount, tx.currency)}
                  type={tx.type === "income" ? "income" : "expense"}
                />
              ))
            ) : (
              <EmptyState title="Henüz işlem yok" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Savings Projection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Birikim Projeksiyonu
          </CardTitle>
          <CardDescription className="text-sm">
            Mevcut birikim oranına dayalı gelecek tahmini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">
                Paranın yeteceği ay
              </p>
              <p className="text-2xl md:text-3xl font-bold text-primary tabular-nums">
                {monthsOfSavings} ay
              </p>
              <p className="text-xs text-muted-foreground">
                Mevcut giderlerle
              </p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">
                Aylık Birikim Oranı
              </p>
              <p className={`text-2xl md:text-3xl font-bold tabular-nums ${Number(savingsRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatPercent(savingsRate)}
              </p>
              <p className="text-xs text-muted-foreground">Gelirden</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground">
                Toplam Varlık
              </p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 tabular-nums">{formatCurrency(totalAssets)}</p>
              <p className="text-xs text-muted-foreground">
                Tüm varlıkların toplamı
              </p>
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

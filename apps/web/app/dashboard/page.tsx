"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { dashboardApi } from "@/lib/api";

export default function DashboardPage() {
  const { data: overview, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => dashboardApi.getOverview(),
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["dashboard", "transactions"],
    queryFn: () => dashboardApi.getRecentTransactions(5),
  });

  const isLoading = overviewLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (overviewError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">
          {overviewError instanceof Error ? overviewError.message : "Veri yuklenirken hata olustu"}
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: number, currency = "TRY") => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const totalAssets = overview?.totalAssets ?? 0;
  const monthlyIncome = overview?.monthly?.income ?? 0;
  const monthlyExpenses = overview?.monthly?.expenses ?? 0;
  const monthlySavings = overview?.monthly?.savings ?? 0;
  const savingsRate = overview?.monthly?.savingsRate ?? 0;

  // Calculate how long savings will last
  const monthsOfSavings = monthlyExpenses > 0 ? Math.floor(totalAssets / monthlyExpenses) : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Genel Bakis</h1>
        <p className="text-muted-foreground">Finansal durumunuzun ozeti</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Varlik"
          value={formatCurrency(totalAssets)}
          change=""
          trend="up"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Gelir"
          value={formatCurrency(monthlyIncome)}
          change=""
          trend="up"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Gider"
          value={formatCurrency(monthlyExpenses)}
          change=""
          trend="down"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Tasarruf"
          value={formatCurrency(monthlySavings)}
          change=""
          trend={monthlySavings >= 0 ? "up" : "down"}
          icon={<PiggyBank className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Nakit Ekle"
          description="Yeni nakit hesabi ekleyin"
          href="/dashboard/cash"
        />
        <QuickActionCard
          title="Altin Ekle"
          description="Yeni altin ekleyin"
          href="/dashboard/gold"
        />
        <QuickActionCard
          title="Gumus Ekle"
          description="Yeni gumus ekleyin"
          href="/dashboard/silver"
        />
        <QuickActionCard
          title="Hisse Ekle"
          description="Yeni hisse senedi ekleyin"
          href="/dashboard/stocks"
        />
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Yatirim Dagilimi</CardTitle>
            <CardDescription>Varliklarinizin kategorilere gore dagilimi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overview?.breakdown && (
                <>
                  <PortfolioItem
                    label="Nakit"
                    value={formatCurrency(overview.breakdown.cash?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.cash?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-emerald-500"
                  />
                  <PortfolioItem
                    label="Altin"
                    value={formatCurrency(overview.breakdown.gold?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.gold?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-amber-500"
                  />
                  <PortfolioItem
                    label="Gumus"
                    value={formatCurrency(overview.breakdown.silver?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.silver?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-slate-400"
                  />
                  <PortfolioItem
                    label="Hisse Senetleri"
                    value={formatCurrency(overview.breakdown.stocks?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.stocks?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-blue-500"
                  />
                  <PortfolioItem
                    label="ETF'ler"
                    value={formatCurrency(overview.breakdown.etfs?.value ?? 0)}
                    percentage={totalAssets > 0 ? ((overview.breakdown.etfs?.value ?? 0) / totalAssets) * 100 : 0}
                    color="bg-green-500"
                  />
                  <PortfolioItem
                    label="Eurobond"
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
                <p className="text-muted-foreground text-center py-4">Henuz yatirim eklenmedi</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Islemler</CardTitle>
            <CardDescription>Son yapilan islemler</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    title={tx.description || tx.category}
                    date={new Date(tx.date).toLocaleDateString("tr-TR")}
                    amount={`${tx.type === "income" ? "+" : "-"}${formatCurrency(tx.amount, tx.currency)}`}
                    type={tx.type === "income" ? "income" : "expense"}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">Henuz islem yok</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Savings Projection */}
      <Card>
        <CardHeader>
          <CardTitle>Tasarruf Projeksiyonu</CardTitle>
          <CardDescription>Mevcut tasarruf hizinizla gelecek tahmini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Birikimler Ne Kadar Yeter?</p>
              <p className="text-3xl font-bold text-primary">{monthsOfSavings} Ay</p>
              <p className="text-xs text-muted-foreground">Mevcut giderlerinizle</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Aylik Tasarruf Orani</p>
              <p className={`text-3xl font-bold ${Number(savingsRate) >= 0 ? "text-green-600" : "text-red-600"}`}>
                %{typeof savingsRate === "number" ? savingsRate.toFixed(1) : savingsRate}
              </p>
              <p className="text-xs text-muted-foreground">Gelirin %'si</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Toplam Varlik</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalAssets)}</p>
              <p className="text-xs text-muted-foreground">Net deger</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`flex items-center text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {change} gecen aya gore
          </div>
        )}
      </CardContent>
    </Card>
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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
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
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <span className={`font-medium ${colors[type]}`}>{amount}</span>
    </div>
  );
}

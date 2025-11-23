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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
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
          value="₺1,234,567"
          change="+12.5%"
          trend="up"
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Gelir"
          value="₺45,000"
          change="+5.2%"
          trend="up"
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Gider"
          value="₺28,500"
          change="-3.1%"
          trend="down"
          icon={<ArrowUpRight className="h-4 w-4" />}
        />
        <StatCard
          title="Aylik Tasarruf"
          value="₺16,500"
          change="+8.7%"
          trend="up"
          icon={<PiggyBank className="h-4 w-4" />}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Hisse Ekle"
          description="Yeni hisse senedi ekleyin"
          href="/dashboard/stocks"
        />
        <QuickActionCard
          title="ETF Ekle"
          description="Yeni ETF ekleyin"
          href="/dashboard/etfs"
        />
        <QuickActionCard
          title="Gelir Ekle"
          description="Yeni gelir kaydedin"
          href="/dashboard/incomes"
        />
        <QuickActionCard
          title="Gider Ekle"
          description="Yeni gider kaydedin"
          href="/dashboard/expenses"
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
              <PortfolioItem label="Hisse Senetleri" value="₺450,000" percentage={45} color="bg-blue-500" />
              <PortfolioItem label="ETF'ler" value="₺300,000" percentage={30} color="bg-green-500" />
              <PortfolioItem label="Eurobond" value="₺150,000" percentage={15} color="bg-yellow-500" />
              <PortfolioItem label="Gayrimenkul" value="₺100,000" percentage={10} color="bg-purple-500" />
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
              <TransactionItem
                title="THYAO Alis"
                date="23 Ocak 2024"
                amount="+₺15,000"
                type="buy"
              />
              <TransactionItem
                title="Maas"
                date="22 Ocak 2024"
                amount="+₺45,000"
                type="income"
              />
              <TransactionItem
                title="Kira Odemesi"
                date="20 Ocak 2024"
                amount="-₺8,500"
                type="expense"
              />
              <TransactionItem
                title="SPY ETF Alis"
                date="18 Ocak 2024"
                amount="+$2,500"
                type="buy"
              />
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
              <p className="text-3xl font-bold text-primary">43 Ay</p>
              <p className="text-xs text-muted-foreground">Mevcut giderlerinizle</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Aylik Tasarruf Orani</p>
              <p className="text-3xl font-bold text-green-600">%36.7</p>
              <p className="text-xs text-muted-foreground">Gelirin %'si</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Yillik Hedef</p>
              <p className="text-3xl font-bold text-blue-600">₺200,000</p>
              <p className="text-xs text-muted-foreground">Kalan: ₺82,000</p>
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
        <div className={`flex items-center text-xs ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {change} gecen aya gore
        </div>
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
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
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

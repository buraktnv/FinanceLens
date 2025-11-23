import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  TrendingUp,
  Landmark,
  BarChart3,
  Home,
  CreditCard,
  ArrowLeft,
  PiggyBank,
} from "lucide-react";

export default function StatusPage() {
  // Mock data - total financial status
  const netWorth = 2_450_000;
  const totalAssets = 2_850_000;
  const totalLiabilities = 400_000;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Wallet className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">FinanceLens</span>
            </div>
          </div>
          <h1 className="text-xl font-semibold">Finansal Durum Ozeti</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Net Worth Summary */}
        <Card className="mb-8">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-muted-foreground">Net Deger</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-primary mb-4">
              ₺{netWorth.toLocaleString()}
            </div>
            <div className="flex justify-center gap-8">
              <div>
                <p className="text-sm text-muted-foreground">Toplam Varlik</p>
                <p className="text-xl font-semibold text-green-600">₺{totalAssets.toLocaleString()}</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Borc</p>
                <p className="text-xl font-semibold text-red-600">₺{totalLiabilities.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Breakdown */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Stocks */}
          <AssetCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Hisse Senetleri"
            value="₺485,230"
            change="+9.52%"
            items={[
              { label: "THYAO", value: "₺156,200" },
              { label: "AAPL", value: "₺145,500" },
              { label: "GOOGL", value: "₺93,120" },
              { label: "Diger", value: "₺90,410" },
            ]}
          />

          {/* ETFs */}
          <AssetCard
            icon={<BarChart3 className="h-6 w-6" />}
            title="ETF'ler"
            value="$24,850"
            change="+7.8%"
            items={[
              { label: "SPY", value: "$9,570" },
              { label: "QQQ", value: "$6,185" },
              { label: "VTI", value: "$7,167" },
              { label: "ACWI", value: "$5,260" },
            ]}
          />

          {/* Eurobonds */}
          <AssetCard
            icon={<Landmark className="h-6 w-6" />}
            title="Eurobond"
            value="$28,650"
            change="+5.75%"
            subtitle="Yillik Kupon"
            items={[
              { label: "Turkey 2030", value: "$9,550" },
              { label: "Turkey 2034", value: "$13,800" },
              { label: "Turkey 2028", value: "$4,900" },
            ]}
          />

          {/* Real Estate */}
          <AssetCard
            icon={<Home className="h-6 w-6" />}
            title="Gayrimenkul"
            value="₺1,850,000"
            change="+15,000/ay"
            subtitle="Kira Geliri"
            items={[
              { label: "Kadikoy Daire", value: "₺1,200,000", extra: "Kirada: ₺12,000/ay" },
              { label: "Bodrum Yazlik", value: "₺650,000", extra: "Bos" },
            ]}
          />

          {/* Savings */}
          <AssetCard
            icon={<PiggyBank className="h-6 w-6" />}
            title="Nakit & Mevduat"
            value="₺185,000"
            change="+%32 faiz"
            items={[
              { label: "Vadesiz Hesap", value: "₺35,000" },
              { label: "Vadeli Mevduat", value: "₺150,000" },
            ]}
          />

          {/* Loans */}
          <LiabilityCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Krediler"
            value="₺400,000"
            items={[
              { label: "Konut Kredisi", value: "₺380,000", extra: "%1.89 faiz, 84 ay kaldi" },
              { label: "Ihtiyac Kredisi", value: "₺20,000", extra: "%2.49 faiz, 12 ay kaldi" },
            ]}
          />
        </div>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Aylik Ozet</CardTitle>
            <CardDescription>Bu ayki gelir-gider durumu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryItem label="Toplam Gelir" value="₺71,700" type="income" />
              <SummaryItem label="Toplam Gider" value="₺28,500" type="expense" />
              <SummaryItem label="Net Tasarruf" value="₺43,200" type="savings" />
              <SummaryItem label="Tasarruf Orani" value="%60.3" type="rate" />
            </div>

            <Separator className="my-6" />

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Birikimler Ne Kadar Yeter?</p>
                <p className="text-3xl font-bold text-blue-600">86 Ay</p>
                <p className="text-xs text-muted-foreground">~7 yil (mevcut giderlerle)</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Pasif Gelir</p>
                <p className="text-3xl font-bold text-green-600">₺16,500/ay</p>
                <p className="text-xs text-muted-foreground">Kira + Temettu + Faiz</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Finansal Bagimsizlik</p>
                <p className="text-3xl font-bold text-purple-600">%58</p>
                <p className="text-xs text-muted-foreground">Pasif gelir / Gider</p>
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
  change,
  subtitle,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  subtitle?: string;
  items: { label: string; value: string; extra?: string }[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-2xl font-bold">{value}</p>
          <Badge variant="secondary" className="text-green-600">
            {change} {subtitle && <span className="text-muted-foreground ml-1">{subtitle}</span>}
          </Badge>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <div>
                <span>{item.label}</span>
                {item.extra && <p className="text-xs text-muted-foreground">{item.extra}</p>}
              </div>
              <span className="font-medium">{item.value}</span>
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-lg text-red-600">{icon}</div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-2xl font-bold text-red-600">{value}</p>
          <Badge variant="destructive">Borc</Badge>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-start text-sm">
              <div>
                <span>{item.label}</span>
                {item.extra && <p className="text-xs text-muted-foreground">{item.extra}</p>}
              </div>
              <span className="font-medium text-red-600">{item.value}</span>
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
    <div className="text-center p-4 bg-gray-100 rounded-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${colors[type]}`}>{value}</p>
    </div>
  );
}

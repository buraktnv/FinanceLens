"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  PieChart,
  Wallet,
  ArrowRight,
  BarChart3,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Yukleniyor...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FinanceLens</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Giris Yap</Button>
            </Link>
            <Link href="/register">
              <Button>Kayit Ol</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Finansal Durumunuzu
          <span className="text-primary"> Tek Bakista</span> Gorun
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Yatirimlarinizi, gelirlerinizi ve giderlerinizi tek bir platformda
          takip edin. Birikimlerinizin ne kadar surecegini hesaplayin.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Ucretsiz Baslayin
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Giris Yap
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Neler Yapabilirsiniz?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-primary" />}
              title="Yatirim Takibi"
              description="Hisse senetleri, ETF'ler ve Eurobond'larinizi takip edin. Kar/zarar durumunuzu anlik gorun."
            />
            <FeatureCard
              icon={<PieChart className="h-10 w-10 text-primary" />}
              title="Harcama Analizi"
              description="Paranizin nereye gittigini gorun. Kategorilere gore harcamalarinizi analiz edin."
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="Tasarruf Hesaplama"
              description="Birikimleriniz ne kadar sure yeter? Aylik tasarruf hedefinizi belirleyin."
            />
          </div>
        </div>
      </section>

      {/* Investment Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Desteklenen Yatirim Turleri
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InvestmentCard title="Hisse Senetleri" description="BIST & Global" />
            <InvestmentCard title="ETF'ler" description="Temettu takibi" />
            <InvestmentCard title="Eurobond" description="Kupon odemeler" />
            <InvestmentCard title="Gayrimenkul" description="Kira geliri" />
          </div>
        </div>
      </section>

      {/* Tax Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Turkiye'ye Ozel Vergi Hesaplama</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Eurobond, ETF ve hisse senedi vergilerinizi otomatik hesaplayin.
            Stopaj oranlarini takip edin.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Hemen Baslayin</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Finansal ozgurlugunuze giden yolda ilk adimi atin
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Ucretsiz Kayit Ol
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 FinanceLens. Tum haklari saklidir.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function InvestmentCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border text-center hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

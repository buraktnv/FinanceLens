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
  Coins,
  Landmark,
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Wallet className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">FinanceLens</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your Finances
          <span className="text-primary"> at a Glance</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Track your investments, income, and expenses all in one place.
          See how long your savings will last.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<TrendingUp className="h-10 w-10 text-primary" />}
              title="Investment Tracking"
              description="Track stocks, ETFs, and eurobonds. Monitor your profit and loss in real time with live price data."
            />
            <FeatureCard
              icon={<PieChart className="h-10 w-10 text-primary" />}
              title="Spending Analysis"
              description="See exactly where your money goes. Analyze your spending across categories with visual breakdowns."
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-primary" />}
              title="Savings Calculator"
              description="How long will your savings last? Set monthly savings goals and project your runway."
            />
          </div>
        </div>
      </section>

      {/* Investment Types Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Supported Asset Types
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <InvestmentCard
              icon={<TrendingUp className="h-8 w-8 text-primary" />}
              title="Stocks"
              description="Global markets with live prices"
            />
            <InvestmentCard
              icon={<BarChart3 className="h-8 w-8 text-primary" />}
              title="ETFs"
              description="Distribution & dividend tracking"
            />
            <InvestmentCard
              icon={<Landmark className="h-8 w-8 text-primary" />}
              title="Eurobonds"
              description="Coupon payment tracking"
            />
            <InvestmentCard
              icon={<Coins className="h-8 w-8 text-primary" />}
              title="Gold & Silver"
              description="Precious metals with live rates"
            />
          </div>
        </div>
      </section>

      {/* Tax Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Complete Financial Picture</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From cash accounts to precious metals, every asset in one dashboard.
            Track loans, monitor net worth, and plan your financial future.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Tracking Today</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Take control of your financial future
          </p>
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 FinanceLens. All rights reserved.</p>
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
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function InvestmentCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card p-6 rounded-lg border text-center hover:shadow-md transition-shadow">
      <div className="flex justify-center mb-3">{icon}</div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

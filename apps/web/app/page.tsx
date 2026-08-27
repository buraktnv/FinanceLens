"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { NavBar } from "@/components/landing/nav-bar";
import { Hero } from "@/components/landing/hero";
import { StatsStrip } from "@/components/landing/stats-strip";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaBand } from "@/components/landing/cta-band";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  const { user, loading, signInAsDemo } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleDemoLogin = () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      signInAsDemo();
    } catch {
      // localStorage may throw (private mode / storage disabled) — never
      // leave the button stuck in its loading state.
      toast.error("Demo başlatılamadı");
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Wallet
            className="mx-auto mb-4 size-16 animate-pulse text-primary"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">Yükleniyor…</p>
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
      <NavBar />
      <main>
        <Hero onDemo={handleDemoLogin} demoLoading={demoLoading} />
        <StatsStrip />
        <FeatureGrid />
        <HowItWorks />
        <CtaBand onDemo={handleDemoLogin} demoLoading={demoLoading} />
      </main>
      <SiteFooter />
    </div>
  );
}

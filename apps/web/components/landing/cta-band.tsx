import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoButton } from "@/components/landing/demo-button";

interface CtaBandProps {
  onDemo: () => void;
  demoLoading: boolean;
}

export function CtaBand({ onDemo, demoLoading }: CtaBandProps) {
  return (
    <section className="py-20 md:py-24">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 px-6 py-14 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-primary/20 blur-3xl"
          />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Bugün kaydet, yarın karar ver.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-muted-foreground">
            Ücretsiz hesabını oluştur ya da hazır demo verisiyle otuz saniyede
            gez; karar senin.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">
                Ücretsiz Başla
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <DemoButton
              onDemo={onDemo}
              loading={demoLoading}
              variant="outline"
              className="bg-background/60"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

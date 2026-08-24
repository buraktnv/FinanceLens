import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/landing/logo";

const NAV_LINKS = [
  { href: "#varliklar", label: "Varlık Sınıfları" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Logo />
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Button variant="outline" size="sm" asChild className="rounded-md">
          <Link href="/login">Giriş Yap</Link>
        </Button>
      </div>
    </header>
  );
}

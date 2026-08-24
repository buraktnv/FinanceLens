import Link from "next/link";
import { Logo } from "@/components/landing/logo";

const FOOTER_LINKS = [
  { href: "#varliklar", label: "Varlık Sınıfları" },
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/login", label: "Giriş Yap" },
  { href: "/register", label: "Kayıt Ol" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-10">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Kişisel finans durumu takip uygulaması
          </p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="container mx-auto mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        © {year} FinanceLens — Tüm hakları saklıdır.
      </div>
    </footer>
  );
}

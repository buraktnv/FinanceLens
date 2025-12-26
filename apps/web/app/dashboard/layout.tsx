"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  LayoutDashboard,
  TrendingUp,
  Landmark,
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  LogOut,
  User,
  FileText,
  Coins,
  Gem
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";

const sidebarLinks = [
  {
    title: "Genel Bakis",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Nakit",
    href: "/dashboard/cash",
    icon: Wallet,
  },
  {
    title: "Altin",
    href: "/dashboard/gold",
    icon: Coins,
  },
  {
    title: "Gumus",
    href: "/dashboard/silver",
    icon: Gem,
  },
  {
    title: "Hisse Senetleri",
    href: "/dashboard/stocks",
    icon: TrendingUp,
  },
  {
    title: "Eurobond",
    href: "/dashboard/eurobonds",
    icon: Landmark,
  },
  {
    title: "ETF'ler",
    href: "/dashboard/etfs",
    icon: BarChart3,
  },
  {
    title: "Gelirler",
    href: "/dashboard/incomes",
    icon: ArrowDownCircle,
  },
  {
    title: "Giderler",
    href: "/dashboard/expenses",
    icon: ArrowUpCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Get user display name and email
  const userEmail = user?.email || "user@example.com";
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Kullanici";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FinanceLens</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span>{link.title}</span>
              </Link>
            ))}

            <Separator className="my-4" />

            <Link
              href="/status"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Finansal Durum</span>
            </Link>
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 mt-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Cikis Yap
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

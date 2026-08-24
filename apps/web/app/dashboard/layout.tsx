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
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const sidebarLinks = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cash",
    href: "/dashboard/cash",
    icon: Wallet,
  },
  {
    title: "Gold",
    href: "/dashboard/gold",
    icon: Coins,
  },
  {
    title: "Silver",
    href: "/dashboard/silver",
    icon: Gem,
  },
  {
    title: "Stocks",
    href: "/dashboard/stocks",
    icon: TrendingUp,
  },
  {
    title: "Eurobonds",
    href: "/dashboard/eurobonds",
    icon: Landmark,
  },
  {
    title: "ETFs",
    href: "/dashboard/etfs",
    icon: BarChart3,
  },
  {
    title: "Income",
    href: "/dashboard/incomes",
    icon: ArrowDownCircle,
  },
  {
    title: "Expenses",
    href: "/dashboard/expenses",
    icon: ArrowUpCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, signOut, isDemo } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Get user display name and email
  const userEmail = user?.email || "user@example.com";
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-screen lg:w-64 lg:border-r lg:bg-background lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">FinanceLens</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
              >
                <link.icon className="h-5 w-5" />
                <span>{link.title}</span>
              </Link>
            ))}

            <Separator className="my-4" />

            <Link
              href="/status"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              <FileText className="h-5 w-5" />
              <span>Financial Status</span>
            </Link>
          </nav>

          {/* User section */}
          <div className="border-t p-4">
            {isDemo && (
              <div className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                Demo Mode — Changes are not saved
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 mb-2"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
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
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b h-16 flex items-center px-4">
        <Wallet className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-bold">FinanceLens</span>
        {isDemo && (
          <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Demo
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="h-9 w-9"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation — horizontal scrollable strip exposing every route */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t">
        <div className="flex gap-1 p-2 overflow-x-auto">
          {[...sidebarLinks, { title: "Status", href: "/status", icon: FileText }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center gap-1 shrink-0 min-w-[4rem] rounded-lg px-2 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
            >
              <link.icon className="h-5 w-5" />
              <span className="text-xs whitespace-nowrap">{link.title}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

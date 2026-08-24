export interface ExpenseCategoryInfo {
  label: string;
  color: string;
}

export const expenseCategories: Record<string, ExpenseCategoryInfo> = {
  RENT: { label: "Kira", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  MORTGAGE_PAYMENT: { label: "Konut Kredisi", color: "bg-red-500/15 text-red-600 dark:text-red-400" },
  UTILITIES: { label: "Faturalar", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  INTERNET: { label: "Internet", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  PHONE: { label: "Telefon", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  MAINTENANCE: { label: "Bakim", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  INSURANCE: { label: "Sigorta", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  HOA_FEE: { label: "Aidat", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  PROPERTY_TAX: { label: "Emlak Vergisi", color: "bg-orange-500/15 text-orange-600 dark:text-orange-400" },
  GROCERIES: { label: "Market", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  TRANSPORTATION: { label: "Ulasim", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  FUEL: { label: "Yakit", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_PAYMENT: { label: "Arac Kredisi", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_INSURANCE: { label: "Arac Sigortasi", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  CAR_MAINTENANCE: { label: "Arac Bakimi", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  PARKING: { label: "Otopark", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  DINING: { label: "Lokanta", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  COFFEE: { label: "Kafe", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  ENTERTAINMENT: { label: "Eglence", color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
  HEALTHCARE: { label: "Saglik", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  EDUCATION: { label: "Egitim", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  SHOPPING: { label: "Alisveris", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  CLOTHING: { label: "Giyim", color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  PERSONAL_CARE: { label: "Kisisel Bakim", color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  GYM: { label: "Spor Salonu", color: "bg-lime-500/15 text-lime-600 dark:text-lime-400" },
  SUBSCRIPTIONS: { label: "Abonelikler", color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400" },
  TRAVEL: { label: "Seyahat", color: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  GIFTS: { label: "Hediye", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  DONATIONS: { label: "Bagis", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  TAXES: { label: "Vergiler", color: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  FEES: { label: "Ucretler", color: "bg-slate-500/15 text-slate-600 dark:text-slate-400" },
  OTHER: { label: "Diger", color: "bg-muted text-muted-foreground" },
};

export function getExpenseCategoryLabel(category: string): string {
  return expenseCategories[category]?.label ?? "Diger";
}

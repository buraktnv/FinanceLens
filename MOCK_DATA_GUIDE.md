# Mock Data Guide for FinanceLens

## Overview

Your FinanceLens application now supports **two modes**:
1. **Mock Data Mode** (for portfolio/demo purposes) - Currently ACTIVE
2. **Real API Mode** (for production use with real backend)

All data is now in **English** and the UI is fully **mobile-responsive**.

## How to Switch Between Modes

### To Use Mock Data (Portfolio/Demo Mode)

Open `apps/web/lib/api-mock.ts` and set:

```typescript
export const USE_MOCK_DATA = true;
```

### To Use Real API (Production Mode)

Open `apps/web/lib/api-mock.ts` and set:

```typescript
export const USE_MOCK_DATA = false;
```

That's it! No other changes needed.

## What's Been Changed

### 1. Mock Data Files Created

- **`apps/web/lib/mock-data.ts`** - Contains all mock data in English:
  - Dashboard overview with realistic financial data
  - 5 stock positions (AAPL, MSFT, GOOGL, TSLA, NVDA)
  - 3 ETF holdings (VOO, VTI, VXUS)
  - 2 Eurobond positions (Turkey 2028, Poland 2030)
  - 4 cash accounts (Checking, Savings, Money Market, Euro Account)
  - 2 gold holdings (Gold Eagles, PAMP Suisse bars)
  - 1 silver holding (Silver Eagles)
  - Recent transactions
  - Income and expense data

- **`apps/web/lib/api-mock.ts`** - Mock API functions that simulate real API calls:
  - All CRUD operations for each asset type
  - Simulated network delay (300ms) for realistic feel
  - Yahoo Finance mock quotes
  - Precious metals price data

### 2. Updated API Integration

- **`apps/web/lib/api.ts`** - Now switches between mock and real APIs based on `USE_MOCK_DATA` flag
- All existing API calls work exactly the same
- No changes needed in your React components

### 3. UI Updates - English Language

**ALL pages have been converted from Turkish to English:**

**Navigation:**
- Genel Bakis → Overview
- Nakit → Cash
- Altin → Gold
- Gumus → Silver
- Hisse Senetleri → Stocks
- Eurobond → Eurobonds
- ETF'ler → ETFs
- Gelirler → Income
- Giderler → Expenses
- Finansal Durum → Financial Status
- Cikis Yap → Sign Out

**All 10 Pages Converted:**
1. ✅ Dashboard (Overview)
2. ✅ Cash Accounts
3. ✅ Gold Holdings
4. ✅ Silver Holdings
5. ✅ Stocks
6. ✅ Eurobonds
7. ✅ ETFs
8. ✅ Income
9. ✅ Expenses
10. ✅ Financial Status (Summary page)

**Common Translations Applied:**
- "Yeni Ekle" → "Add New"
- "Ara" → "Search"
- "Düzenle" → "Edit"
- "Sil" → "Delete"
- "Emin misiniz?" → "Are you sure?"
- "İptal" → "Cancel"
- "Hata" → "Error"
- "Bilinmeyen hata" → "Unknown error"
- "Toplam" → "Total"
- All table headers, form labels, and messages

**Formatting Changes:**
- Currency format: Turkish Lira (₺) → US Dollar ($)
- Locale: tr-TR → en-US
- Date format: DD.MM.YYYY → MM/DD/YYYY

### 4. Mobile Responsiveness

**Desktop (lg breakpoint and up):**
- Full sidebar navigation on the left
- User profile and sign out in sidebar footer
- Wide layout with spacious padding

**Mobile (below lg breakpoint):**
- Fixed top header with logo and sign out button
- Fixed bottom navigation bar with 5 most important links
- Compact layout optimized for small screens
- Responsive grid layouts:
  - Stats cards: 2 columns on mobile, 4 on desktop
  - Charts/cards: 1 column on mobile, 2 on desktop
- Smaller text sizes and padding on mobile
- Truncated text to prevent overflow

**Responsive Features:**
- Touch-friendly tap targets
- Optimized font sizes (text-xs/text-sm on mobile)
- Flexible spacing (p-4 on mobile, p-8 on desktop)
- Bottom navigation with key pages easily accessible
- No horizontal scrolling on any screen size

## Mock Data Details

### Portfolio Summary (Mock Data)
- **Total Assets**: $145,000
- **Net Worth**: $125,000
- **Monthly Income**: $12,000
- **Monthly Expenses**: $7,500
- **Monthly Savings**: $4,500
- **Savings Rate**: 37.5%

### Asset Breakdown
- Cash: $35,000 (4 accounts)
- Stocks: $45,000 (5 positions)
- ETFs: $25,000 (3 funds)
- Gold: $18,000 (2 holdings)
- Silver: $7,000 (1 holding)
- Eurobonds: $15,000 (2 bonds)

## Testing on Mobile

### Using Browser DevTools
1. Open Chrome/Edge DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select a mobile device (iPhone 12, Pixel 5, etc.)
4. Navigate to http://localhost:3000/dashboard

### Mobile-Specific Features to Test
- Bottom navigation bar (5 quick links)
- Top header with sign out button
- Responsive card layouts
- Text truncation on small screens
- Touch-friendly buttons and links

## File Structure

```
apps/web/
├── lib/
│   ├── api.ts              # Main API file (switches between mock/real)
│   ├── api-mock.ts         # Mock API implementations + USE_MOCK_DATA flag
│   └── mock-data.ts        # All mock data in English
├── app/
│   └── dashboard/
│       ├── layout.tsx      # Mobile-responsive layout with bottom nav
│       └── page.tsx        # Dashboard with English text & mobile styles
```

## For Your Portfolio

The current setup is **perfect for showcasing** because:

1. ✅ **Realistic Data**: Professional-looking financial data in English
2. ✅ **No Backend Required**: Works standalone without API/database
3. ✅ **Mobile-First**: Looks great on phones, tablets, and desktops
4. ✅ **Professional UI**: Clean, modern design with ShadcnUI components
5. ✅ **Fast Loading**: No real API calls, instant responses

## Switching Back to Real Data Later

When you're ready to use the real backend:

1. Change `USE_MOCK_DATA` to `false` in `apps/web/lib/api-mock.ts`
2. Make sure your API backend is running
3. Update `.env.local` with correct `NEXT_PUBLIC_API_URL`
4. All functionality will work with real data

## Notes

- Mock data includes realistic stock symbols and company names
- All forms will still work (they create/update mock data in memory)
- Changes are not persisted (refresh page to reset to default mock data)
- Yahoo Finance quotes are mocked but look realistic
- All calculations (savings rate, months of savings, etc.) use real math

---

**Ready for your portfolio!** 🚀

The app now displays professional financial data in English with full mobile support, perfect for demonstrating your full-stack development skills.

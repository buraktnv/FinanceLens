"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { yahooFinanceApi, YahooSearchResult } from "@/lib/api";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SymbolSearchProps {
  onSelect: (result: YahooSearchResult & { price?: number }) => void;
  label?: string;
  placeholder?: string;
}

export function SymbolSearch({ onSelect, label = "Sembol Ara", placeholder = "AAPL, GOOGL, SPY..." }: SymbolSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["symbolSearch", debouncedQuery],
    queryFn: () => yahooFinanceApi.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const handleSelect = async (result: YahooSearchResult) => {
    try {
      // Fetch current price
      const quote = await yahooFinanceApi.getQuote(result.symbol);
      onSelect({
        ...result,
        price: quote.regularMarketPrice,
      });
      setQuery(result.symbol);
      setShowResults(false);
    } catch (error) {
      // If quote fetch fails, just return the symbol info
      onSelect(result);
      setQuery(result.symbol);
      setShowResults(false);
    }
  };

  return (
    <div className="relative">
      <Label>{label}</Label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="pl-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && debouncedQuery.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg">
          {results.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.symbol}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0",
                    "focus:outline-none focus:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{result.symbol}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.name}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-muted-foreground">{result.exchange}</p>
                      <p className="text-xs text-muted-foreground">{result.type}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
              Sonuc bulunamadi
            </div>
          )}
        </div>
      )}
    </div>
  );
}

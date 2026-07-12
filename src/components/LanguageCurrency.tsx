import React from 'react';
import { CURRENCIES, TRANSLATIONS } from '../data/mockData';
import { Globe, Coins } from 'lucide-react';

interface LanguageCurrencyProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  setLanguage: (lang: 'pt' | 'en' | 'es' | 'fr') => void;
  currency: string;
  setCurrency: (curr: string) => void;
}

export const LanguageCurrencySelector: React.FC<LanguageCurrencyProps> = ({
  language,
  setLanguage,
  currency,
  setCurrency
}) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm" id="lang-curr-selector">
      {/* Language Selector */}
      <div className="flex items-center gap-2 text-slate-500">
        <Globe className="w-4 h-4 text-blue-600" id="globe-icon" />
        <span className="text-xs font-medium hidden sm:inline">{t.select_language}:</span>
        <select
          id="lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'pt' | 'en' | 'es' | 'fr')}
          className="bg-white text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 px-2 py-1 outline-none transition-all cursor-pointer"
        >
          <option value="pt">Português</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <div className="w-px h-5 bg-slate-200" id="separator" />

      {/* Currency Selector */}
      <div className="flex items-center gap-2 text-slate-500">
        <Coins className="w-4 h-4 text-blue-600" id="coins-icon" />
        <span className="text-xs font-medium hidden sm:inline">Moeda:</span>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="bg-white text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 px-2 py-1 outline-none transition-all cursor-pointer"
        >
          {CURRENCIES.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.code} ({curr.symbol})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// Global format currency helper
export function formatCurrencyValue(value: number, currencyCode: string): string {
  const found = CURRENCIES.find((c) => c.code === currencyCode);
  if (!found) return `€${value.toFixed(2)}`;
  
  // Calculate value based on exchange rate
  const converted = value * found.rate;
  
  if (currencyCode === 'GBP') return `${found.symbol}${converted.toFixed(2)}`;
  if (currencyCode === 'USD') return `${found.symbol}${converted.toFixed(2)}`;
  return `${converted.toFixed(2)} ${found.symbol}`;
}

export function getExchangeRate(currencyCode: string): number {
  const found = CURRENCIES.find((c) => c.code === currencyCode);
  return found ? found.rate : 1.0;
}

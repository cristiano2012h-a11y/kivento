import React, { useState, useEffect } from 'react';
import { RegionReport } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { formatCurrencyValue } from './LanguageCurrency';
import { BarChart3, TrendingUp, DollarSign, Package, Compass, Ship } from 'lucide-react';

interface AnalyticsPanelProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  refreshTrigger: number;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ language, refreshTrigger }) => {
  const t = TRANSLATIONS[language];
  const [reports, setReports] = useState<RegionReport[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setReports(data.regionalPerformance);
        setTotalRevenue(data.totalRevenue);
        setTotalOrders(data.totalOrders);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [refreshTrigger]);

  const maxSales = Math.max(...reports.map((r) => r.sales), 1);

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* Performance reports title card */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm" id="analytics-title-card">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {t.performance_reports}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitorização de volume de faturamento, custo médio de trânsito internacional e tempo de trânsito nas principais regiões da UE.
        </p>
      </div>

      {/* Bento Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="analytics-stats-bento">
        {/* Total revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-slate-300 transition-all" id="bento-revenue">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Volume Total de Negócios</span>
            <h3 className="text-lg font-mono font-bold text-slate-900 mt-1">
              {formatCurrencyValue(totalRevenue, 'EUR')}
            </h3>
          </div>
        </div>

        {/* Total orders */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-slate-300 transition-all" id="bento-orders">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Volume de Encomendas</span>
            <h3 className="text-lg font-mono font-bold text-slate-900 mt-1">
              {totalOrders} <span className="text-xs text-slate-400">pedidos</span>
            </h3>
          </div>
        </div>

        {/* Average transit cost */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:border-slate-300 transition-all" id="bento-shipping">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Custo de Frete Médio</span>
            <h3 className="text-lg font-mono font-bold text-slate-900 mt-1">
              {formatCurrencyValue(12.45, 'EUR')}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-and-table">
        {/* Custom SVG Bar Chart (Left/Mid Columns) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm" id="sales-by-country-card">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            {t.region_sales}
          </h4>

          {/* SVG Chart Body */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative" id="svg-chart-container">
            <div className="h-64 flex items-end gap-6 pt-4" id="svg-bars-wrapper">
              {reports.map((r) => {
                const heightPercentage = Math.max(12, (r.sales / maxSales) * 100);

                return (
                  <div key={r.countryCode} className="flex-1 flex flex-col items-center gap-3 h-full justify-end group" id={`chart-bar-${r.countryCode}`}>
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-mono font-semibold transition-all absolute -translate-y-16 pointer-events-none z-20">
                      {formatCurrencyValue(r.sales, 'EUR')}
                    </div>

                    {/* Colored vertical bar */}
                    <div
                      className="w-full bg-blue-500/10 border-t-2 border-blue-600 rounded-t-lg group-hover:bg-blue-500/20 transition-all relative flex flex-col justify-end"
                      style={{ height: `${heightPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/0 to-blue-600/10 rounded-t-lg" />
                    </div>

                    <div className="text-center" id={`chart-bar-labels-${r.countryCode}`}>
                      <span className="text-xs font-bold text-slate-800 block">
                        {r.countryCode}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {r.orderCount} ped.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Carrier Distribution Widget (Right Column) */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between" id="carrier-distribution-card">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-blue-600" />
              Quota das Transportadoras
            </h4>

            {/* Simulated pie ratios */}
            <div className="space-y-3 pt-2" id="carrier-shares-list">
              {[
                { name: 'DHL Express EU', share: 38, color: 'bg-blue-600' },
                { name: 'DPD Group Standard', share: 29, color: 'bg-indigo-500' },
                { name: 'CTT Expresso Europa', share: 21, color: 'bg-amber-500' },
                { name: 'SEUR International', share: 12, color: 'bg-purple-500' }
              ].map((carrier) => (
                <div key={carrier.name} className="space-y-1" id={`carrier-share-${carrier.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium">{carrier.name}</span>
                    <span className="font-mono font-bold text-slate-500">{carrier.share}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${carrier.color}`} style={{ width: `${carrier.share}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3 mt-4">
            * Dados de faturamento e volumes agregados do sistema de logística transfronteiriço europeu actualizados em tempo real de acordo com as transações confirmadas.
          </p>
        </div>
      </div>
    </div>
  );
};

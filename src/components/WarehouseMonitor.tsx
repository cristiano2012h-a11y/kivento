import React, { useState, useEffect } from 'react';
import { Product, Warehouse } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { Box, Plus, Layers, MapPin, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface WarehouseMonitorProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  refreshTrigger: number;
  onRestockSuccess: () => void;
}

interface WarehouseMetric {
  warehouseId: string;
  name: string;
  city: string;
  activeStock: number;
  capacity: number;
  occupancyRate: number;
}

export const WarehouseMonitor: React.FC<WarehouseMonitorProps> = ({
  language,
  refreshTrigger,
  onRestockSuccess
}) => {
  const t = TRANSLATIONS[language];
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<WarehouseMetric[]>([]);
  const [loading, setLoading] = useState(false);

  // Restock Form State
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('wh-lis');
  const [restockQty, setRestockQty] = useState(50);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const whRes = await fetch('/api/warehouses');
      const prodRes = await fetch('/api/products');
      const analRes = await fetch('/api/analytics');

      if (whRes.ok && prodRes.ok && analRes.ok) {
        const whData = await whRes.json();
        const prodData = await prodRes.json();
        const analData = await analRes.json();

        setWarehouses(whData);
        setProducts(prodData);
        setMetrics(analData.warehouseMetrics);

        // Auto select first product if not set
        if (prodData.length > 0 && !selectedProduct) {
          setSelectedProduct(prodData[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching warehouse monitor data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse || restockQty <= 0) return;

    setLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const response = await fetch('/api/products/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct,
          warehouseId: selectedWarehouse,
          quantity: restockQty
        })
      });

      if (response.ok) {
        setFormSuccess(true);
        setRestockQty(50);
        fetchData();
        onRestockSuccess();
        setTimeout(() => setFormSuccess(false), 4000);
      } else {
        const errData = await response.json();
        setFormError(errData.error || 'Erro ao realizar abastecimento.');
      }
    } catch (err) {
      setFormError('Erro de conexão ao servidor de armazéns.');
    } finally {
      setLoading(false);
    }
  };  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="warehouse-monitor">
      {/* Warehouses list & capacity (Left & Mid Columns) */}
      <div className="lg:col-span-2 space-y-6" id="warehouse-list-section">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm" id="warehouse-title-box">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            {t.centralized_inventory}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestão operacional em tempo real da capacidade física de armazenamento em nós logísticos europeus.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="warehouses-cards-grid">
          {metrics.map((metric) => {
            const whInfo = warehouses.find((w) => w.id === metric.warehouseId);
            if (!whInfo) return null;

            const isHighOccupancy = metric.occupancyRate > 75;

            return (
              <div
                key={metric.warehouseId}
                id={`warehouse-card-${metric.warehouseId}`}
                className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-slate-300 hover:shadow-md shadow-sm transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5" id={`warehouse-info-${metric.warehouseId}`}>
                  <div className="flex items-start justify-between" id={`warehouse-top-${metric.warehouseId}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold border border-slate-100">
                        📦
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{whInfo.name}</h4>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {whInfo.city}, {whInfo.country}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-extrabold text-[10px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                      {whInfo.code}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2" id={`warehouse-stats-${metric.warehouseId}`}>
                    <div className="flex justify-between text-xs" id={`wh-stock-row-${metric.warehouseId}`}>
                      <span className="text-slate-500 font-medium">Estoque Actual:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {metric.activeStock} <span className="text-[10px] text-slate-400">un</span>
                      </span>
                    </div>

                    <div className="flex justify-between text-xs" id={`wh-capacity-row-${metric.warehouseId}`}>
                      <span className="text-slate-500 font-medium">Capacidade Física:</span>
                      <span className="font-mono text-slate-500">
                        {metric.capacity} <span className="text-[10px] text-slate-400">un</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2" id={`warehouse-bar-${metric.warehouseId}`}>
                  <div className="flex justify-between items-center text-[10px]" id={`wh-rate-row-${metric.warehouseId}`}>
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Taxa de Ocupação</span>
                    <span className={`font-mono font-bold ${isHighOccupancy ? 'text-amber-600 animate-pulse' : 'text-blue-600'}`}>
                      {metric.occupancyRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden" id={`wh-bar-wrapper-${metric.warehouseId}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        isHighOccupancy ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, metric.occupancyRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Restock Admin Form (Right Column) */}
      <div className="space-y-6" id="restock-section">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm" id="restock-card">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-blue-600" />
            Aprovisionamento Rápido
          </h3>

          <form onSubmit={handleRestockSubmit} className="space-y-4" id="restock-form">
            <div className="space-y-1" id="restock-product-field">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Produto:</label>
              <select
                id="restock-product-select"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-white text-xs text-slate-700 rounded-xl border border-slate-200 p-2.5 outline-none cursor-pointer focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
              >
                {products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} (Base €{prod.price})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1" id="restock-warehouse-field">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Armazém de Destino:</label>
              <select
                id="restock-warehouse-select"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="w-full bg-white text-xs text-slate-700 rounded-xl border border-slate-200 p-2.5 outline-none cursor-pointer focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30"
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.city} - {wh.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1" id="restock-qty-field">
              <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Quantidade a Abastecer:</label>
              <input
                type="number"
                min="10"
                max="1000"
                id="restock-quantity-input"
                value={restockQty}
                onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full bg-white text-xs text-slate-700 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 font-mono"
              />
            </div>

            {formError && (
              <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg flex items-center gap-1.5" id="restock-error-alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-center gap-1.5" id="restock-success-alert">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>Abastecimento realizado! A carregar novas métricas.</span>
              </div>
            )}

            <button
              type="submit"
              id="restock-submit-btn"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A processar abastecimento...</span>
                </>
              ) : (
                <>
                  <Box className="w-4 h-4" />
                  <span>Abastecer Armazém</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Product, Carrier, PromoBanner } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { formatCurrencyValue } from './LanguageCurrency';
import { 
  Search, ShoppingBag, Truck, MapPin, Calculator, ShoppingCart, Trash2, ArrowRight,
  Flame, Sparkles, ShieldCheck, Zap, Percent, Clock, ChevronLeft, ChevronRight, Gift, Star
} from 'lucide-react';

interface StorefrontProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  currency: string;
  cart: { product: Product; quantity: number }[];
  addToCart: (p: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  onCheckout: (shippingDetails: {
    countryCode: string;
    postalCode: string;
    carrierId: string;
    shippingCost: number;
    warehouseId: string;
    warehouseName: string;
    warehouseCity: string;
    distanceKm: number;
  }) => void;
}

interface ShippingRate {
  carrierId: string;
  carrierName: string;
  cost: number;
  transitDays: { min: number; max: number };
  warehouseId: string;
  warehouseName: string;
  warehouseCity: string;
  distanceKm: number;
}

export const Storefront: React.FC<StorefrontProps> = ({
  language,
  currency,
  cart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  onCheckout
}) => {
  const t = TRANSLATIONS[language];

  const [products, setProducts] = useState<Product[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // High impact slideshow index
  const [currentSlide, setCurrentSlide] = useState(0);

  // AliExpress-style flash countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 48 });

  // Shipping cost calculator state
  const [destCountry, setDestCountry] = useState('PT');
  const [postalCode, setPostalCode] = useState('');
  const [shippingCalculated, setShippingCalculated] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [shippingError, setShippingError] = useState('');
  
  // Calculated carrier rates
  const [optimalWarehouse, setOptimalWarehouse] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState('');

  // Countdown timer clock tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 5, minutes: 0, seconds: 0 }; // Loop back to 5 hrs
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeBanners = promoBanners.filter(b => b.isActive);

  // Slide autoplay effect
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, [activeBanners.length]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      if (response.ok) {
        const data = await response.json();
        setPromoBanners(data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBanners();
  }, []);

  // Filter products by search query and category
  const categories: string[] = ['All', ...Array.from(new Set(products.map((p) => p.category)) as Set<string>)];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description[language] && p.description[language].toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

  const handleCalculateShipping = async () => {
    if (cart.length === 0) return;
    setCalculating(true);
    setShippingError('');
    setShippingCalculated(false);

    try {
      const payload = {
        countryCode: destCountry,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setOptimalWarehouse(data.optimalWarehouse);
        setDistanceKm(data.distanceKm);
        setTotalWeight(data.totalWeight);
        setRates(data.rates);
        // Default select cheapest rate
        if (data.rates.length > 0) {
          setSelectedRateId(data.rates[0].carrierId);
        }
        setShippingCalculated(true);
      } else {
        const errData = await response.json();
        setShippingError(errData.error || 'Erro ao calcular frete.');
      }
    } catch (err) {
      setShippingError('Falha ao conectar com servidor de logística.');
    } finally {
      setCalculating(false);
    }
  };

  // Re-calculate shipping if cart items or country changes
  useEffect(() => {
    if (shippingCalculated && cart.length > 0) {
      handleCalculateShipping();
    } else if (cart.length === 0) {
      setShippingCalculated(false);
    }
  }, [cart.length, destCountry]);

  const selectedRate = rates.find((r) => r.carrierId === selectedRateId);

  const handleCheckoutClick = () => {
    if (!selectedRate) {
      alert(t.carrier_not_selected || 'Selecione uma transportadora para continuar.');
      return;
    }
    onCheckout({
      countryCode: destCountry,
      postalCode,
      carrierId: selectedRate.carrierId,
      shippingCost: selectedRate.cost,
      warehouseId: selectedRate.warehouseId,
      warehouseName: selectedRate.warehouseName,
      warehouseCity: selectedRate.warehouseCity,
      distanceKm: selectedRate.distanceKm
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="storefront">
      {/* Products Catalog (Left & Mid Columns) */}
      <div className="lg:col-span-2 space-y-6" id="catalog-section">
        
        {/* Eye-catching Temu/AliExpress Style Promotional Slideshow */}
        {activeBanners.length > 0 ? (
          <div 
            className={`relative overflow-hidden rounded-3xl shadow-md border border-amber-100 bg-gradient-to-r ${activeBanners[currentSlide]?.gradientFrom || 'from-orange-550'} ${activeBanners[currentSlide]?.gradientVia || ''} ${activeBanners[currentSlide]?.gradientTo || 'to-amber-500'} text-white min-h-[220px] flex flex-col justify-between p-6 md:p-8 animate-fade-in`} 
            id="promo-banner-carousel"
          >
            {/* Subtle background glow pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-300/20 via-transparent to-black/30 pointer-events-none" />
            
            <div className="space-y-3 relative z-10 animate-fade-in" key={currentSlide} id={`slide-${currentSlide}`}>
              <div className="flex items-center gap-2">
                <span className={`${activeBanners[currentSlide]?.badgeBg || 'bg-yellow-400 text-slate-900'} font-extrabold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm`}>
                  {activeBanners[currentSlide]?.badgeText}
                </span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Kivento.pt
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-none whitespace-pre-line">
                {activeBanners[currentSlide]?.title}
              </h2>
              <p className="text-xs text-white/95 max-w-md font-medium leading-relaxed">
                {activeBanners[currentSlide]?.subtitle}
              </p>
            </div>

            {/* Dots and Navigation Controls */}
            <div className="flex items-center justify-between mt-4 border-t border-white/20 pt-4 relative z-10" id="banner-controls">
              <div className="flex gap-1.5" id="carousel-dots">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Micro Live Countdown Tag */}
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10" id="banner-countdown">
                <Clock className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-100">Termina em:</span>
                <span className="font-mono text-xs font-bold text-yellow-300">
                  {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-pulse bg-slate-200 rounded-3xl min-h-[220px]" />
        )}

        {/* Quick Trust Badges Grid - Inspired by Temu / AliExpress Europe */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm" id="store-trust-badges">
          <div className="flex items-center gap-2 text-left" id="trust-badge-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-800">Preços Diretos</h4>
              <p className="text-[9px] text-slate-400 font-medium">Melhor margem da fábrica</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left" id="trust-badge-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-800">Envio Grátis</h4>
              <p className="text-[9px] text-slate-400 font-medium">Nas compras europeias</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left" id="trust-badge-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-800">Compra 100% Segura</h4>
              <p className="text-[9px] text-slate-400 font-medium">Reembolso em 30 dias</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left" id="trust-badge-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-slate-800">Armazéns Locais</h4>
              <p className="text-[9px] text-slate-400 font-medium">Entrega em PT, ES e FR</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Header */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm animate-fade-in" id="search-container">
          <div className="relative" id="search-input-wrapper">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-450" />
            <input
              type="text"
              id="product-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-blue-600 rounded-xl text-sm text-slate-800 outline-none transition-all placeholder-slate-400 focus:ring-1 focus:ring-blue-600/30 font-medium"
            />
          </div>

          {/* Category List */}
          <div className="flex flex-wrap gap-2 pt-1" id="categories-wrapper">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 text-slate-600 border border-transparent hover:text-slate-800 hover:bg-slate-200'
                }`}
              >
                {cat === 'All' ? t.all_categories : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 font-medium" id="no-products-found">
              Nenhum produto encontrado na região de estoque europeu.
            </div>
          ) : (
            filteredProducts.map((p) => {
              // Calculate total stock
              const totalStock = (Object.values(p.stock) as number[]).reduce((a: number, b: number) => a + b, 0);
              
              // Simulate a beautiful discount badge (e.g. 45% - 70%) for Temu look
              const simulatedDiscount = p.isDropshipped ? 65 : 45;
              const originalComparePrice = p.price * (1 + simulatedDiscount / 100);

              return (
                <div
                  key={p.id}
                  id={`product-card-${p.id}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-250 transition-all flex flex-col group hover:shadow-md animate-fade-in relative"
                >
                  {/* High conversion discount pill */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1" id={`promo-pills-${p.id}`}>
                    <span className="bg-red-600 text-white font-extrabold text-[10px] tracking-wide px-2 py-0.5 rounded-lg shadow-sm">
                      -{simulatedDiscount}% OFF
                    </span>
                    {p.isDropshipped && (
                      <span className="bg-orange-500 text-white font-bold text-[9px] tracking-wide px-1.5 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5 text-white animate-bounce" /> Fábrica
                      </span>
                    )}
                  </div>

                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-slate-50" id={`product-img-wrapper-${p.id}`}>
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span 
                      className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-blue-600 font-mono text-[10px] font-bold px-2 py-1 rounded-full border border-slate-200/50"
                      id={`product-category-tag-${p.id}`}
                    >
                      {p.category}
                    </span>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between" id={`product-details-${p.id}`}>
                    <div className="space-y-2">
                      {/* Star Rating Simulating High Reviews */}
                      <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold" id={`product-rating-${p.id}`}>
                        <div className="flex text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <Star className="w-3 h-3 fill-amber-400" />
                          <Star className="w-3 h-3 fill-amber-400" />
                          <Star className="w-3 h-3 fill-amber-400" />
                          <Star className="w-3 h-3 fill-amber-450" />
                        </div>
                        <span>4.9 (184+ vendidos)</span>
                      </div>

                      <div className="flex items-start justify-between gap-1" id={`product-title-row-${p.id}`}>
                        <h3 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug truncate-2-lines">{p.name}</h3>
                      </div>

                      <div className="flex items-baseline gap-1.5 pt-0.5" id={`product-price-row-${p.id}`}>
                        <span className="font-mono font-extrabold text-red-600 text-lg">
                          {formatCurrencyValue(p.price, currency)}
                        </span>
                        <span className="font-mono text-xs text-slate-400 line-through">
                          {formatCurrencyValue(originalComparePrice, currency)}
                        </span>
                      </div>

                      <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-2" id={`product-desc-${p.id}`}>
                        {p.description[language] || p.description.en}
                      </p>
                    </div>

                    <div className="mt-4 space-y-3" id={`product-footer-${p.id}`}>
                      {/* Active Stocks per EU warehouse */}
                      <div className="border-t border-slate-100 pt-3" id={`product-stock-container-${p.id}`}>
                        <div className="flex items-center justify-between mb-1.5" id="stock-header-row">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-450 block">
                            Distribuição Armazéns EU:
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 py-0.5 rounded">
                            ✓ Pronta Entrega
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5" id={`product-warehouses-grid-${p.id}`}>
                          {(Object.entries(p.stock) as [string, number][]).map(([whId, qty]) => (
                            <div
                              key={whId}
                              className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px]"
                              id={`product-${p.id}-stock-${whId}`}
                            >
                              <span className="text-slate-500 font-medium">{whId.replace('wh-', '').toUpperCase()}:</span>
                              <span className={`font-mono font-bold ${qty > 10 ? 'text-slate-600' : qty > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                                {qty} un
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        id={`add-to-cart-btn-${p.id}`}
                        onClick={() => addToCart(p)}
                        disabled={totalStock <= 0}
                        className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          totalStock > 0
                            ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {totalStock > 0 ? t.add_to_cart : 'Esgotado'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Shopping Cart & Logistics panel (Right Column) */}
      <div className="space-y-6" id="cart-section">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-fade-in" id="cart-card">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            {t.cart}
            {cart.length > 0 && (
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </h3>

          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-450 text-xs font-medium" id="empty-cart-view">
              {t.empty_cart}
            </div>
          ) : (
            <div className="space-y-4" id="cart-content-wrapper">
              {/* Cart List */}
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1" id="cart-items-list">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center gap-3 animate-fade-in" id={`cart-item-${item.product.id}`}>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-lg bg-slate-50"
                    />
                    <div className="flex-1 min-w-0" id={`cart-item-info-${item.product.id}`}>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-450 font-mono mt-0.5 font-medium">
                        {formatCurrencyValue(item.product.price, currency)} / {item.product.weight} kg
                      </p>
                    </div>
                    <div className="flex items-center gap-2" id={`cart-item-qty-${item.product.id}`}>
                      <input
                        type="number"
                        min="1"
                        id={`cart-qty-input-${item.product.id}`}
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 text-center py-0.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-800 outline-none font-medium"
                      />
                      <button
                        id={`remove-cart-item-btn-${item.product.id}`}
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Logistics Calculator */}
              <div className="border-t border-slate-100 pt-4 space-y-4" id="shipping-calculator-container">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  {t.shipping_calc}
                </h4>

                <div className="grid grid-cols-2 gap-3" id="shipping-address-fields">
                  <div className="space-y-1" id="field-country">
                    <label className="text-[10px] text-slate-500 font-medium">{t.country}:</label>
                    <select
                      id="shipping-country-select"
                      value={destCountry}
                      onChange={(e) => setDestCountry(e.target.value)}
                      className="w-full bg-white text-xs text-slate-700 rounded-lg border border-slate-200 p-2 outline-none cursor-pointer focus:border-blue-600 font-medium"
                    >
                      <option value="PT">Portugal (PT)</option>
                      <option value="ES">Espanha (ES)</option>
                      <option value="FR">França (FR)</option>
                      <option value="DE">Alemanha (DE)</option>
                      <option value="IT">Itália (IT)</option>
                      <option value="NL">Países Baixos (NL)</option>
                      <option value="BE">Bélgica (BE)</option>
                      <option value="PL">Polónia (PL)</option>
                    </select>
                  </div>

                  <div className="space-y-1" id="field-postal">
                    <label className="text-[10px] text-slate-500 font-medium">{t.postal_code}:</label>
                    <input
                      type="text"
                      id="shipping-postal-input"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1000-001"
                      className="w-full bg-white text-xs text-slate-800 rounded-lg border border-slate-200 p-2 outline-none focus:border-blue-600 placeholder-slate-400 font-mono font-medium"
                    />
                  </div>
                </div>

                <button
                  id="calc-shipping-btn"
                  onClick={handleCalculateShipping}
                  disabled={calculating}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-blue-600 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  {calculating ? 'A processar logística...' : t.calculate}
                </button>

                {shippingError && (
                  <div className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-lg font-medium" id="shipping-err-msg">
                    {shippingError}
                  </div>
                )}

                {/* Routing & Carrier options */}
                {shippingCalculated && (
                  <div className="space-y-3 bg-slate-50 border border-slate-100 p-3.5 rounded-xl animate-fade-in" id="calc-results">
                    {/* Routing Meta */}
                    <div className="text-[10px] text-slate-500 space-y-1 font-medium" id="routing-meta">
                      <div className="flex items-center justify-between" id="routing-origin">
                        <span className="text-slate-400">Origem:</span>
                        <span className="font-semibold flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-blue-600" />
                          {optimalWarehouse?.name} ({optimalWarehouse?.city})
                        </span>
                      </div>
                      <div className="flex items-center justify-between" id="routing-distance">
                        <span className="text-slate-400">Distância calculada:</span>
                        <span className="font-mono text-slate-700 font-semibold">
                          {distanceKm} {t.km}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" id="routing-weight">
                        <span className="text-slate-400">Peso Total:</span>
                        <span className="font-mono text-slate-700 font-semibold">{totalWeight} kg</span>
                      </div>
                    </div>

                    {/* Carrier Selector */}
                    <div className="space-y-2 border-t border-slate-200/60 pt-3" id="carrier-options-list">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-450 block">
                        {t.shipping_options}:
                      </span>
                      {rates.map((rate) => (
                        <label
                          key={rate.carrierId}
                          id={`carrier-rate-label-${rate.carrierId}`}
                          className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                            selectedRateId === rate.carrierId
                              ? 'bg-blue-50/50 border-blue-600/60 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2" id={`carrier-rate-info-${rate.carrierId}`}>
                            <input
                              type="radio"
                              name="carrier-rate"
                              id={`carrier-radio-${rate.carrierId}`}
                              value={rate.carrierId}
                              checked={selectedRateId === rate.carrierId}
                              onChange={() => setSelectedRateId(rate.carrierId)}
                              className="accent-blue-600 cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{rate.carrierName}</span>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                Est. {rate.transitDays.min}-{rate.transitDays.max} dias úteis
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-blue-600">
                            {formatCurrencyValue(rate.cost, currency)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Pricing summary */}
              <div className="border-t border-slate-100 pt-4 space-y-2 text-xs" id="cart-summary-pricing">
                <div className="flex justify-between text-slate-500 font-medium" id="row-subtotal">
                  <span>{t.subtotal}:</span>
                  <span className="font-mono">{formatCurrencyValue(cartSubtotal, currency)}</span>
                </div>
                {shippingCalculated && selectedRate && (
                  <div className="flex justify-between text-slate-500 font-medium" id="row-shipping">
                    <span>{t.shipping} ({selectedRate.carrierName}):</span>
                    <span className="font-mono">{formatCurrencyValue(selectedRate.cost, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-bold border-t border-slate-150 pt-2 text-sm" id="row-total">
                  <span>{t.total}:</span>
                  <span className="font-mono text-blue-600 font-bold">
                    {formatCurrencyValue(cartSubtotal + (selectedRate ? selectedRate.cost : 0), currency)}
                  </span>
                </div>
              </div>

              {/* Checkout Trigger */}
              <button
                id="proceed-checkout-btn"
                onClick={handleCheckoutClick}
                disabled={cart.length === 0 || !shippingCalculated}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  cart.length > 0 && shippingCalculated
                    ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>{t.checkout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Product } from './types';
import { TRANSLATIONS } from './data/mockData';
import { LanguageCurrencySelector } from './components/LanguageCurrency';
import { NotificationCenter } from './components/NotificationCenter';
import { Storefront } from './components/Storefront';
import { CheckoutModal } from './components/CheckoutModal';
import { MapTracker } from './components/MapTracker';
import { WarehouseMonitor } from './components/WarehouseMonitor';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { KiventoAdmin } from './components/KiventoAdmin';
import { KiventoLogo } from './components/KiventoLogo';
import { ShoppingBag, Navigation, Settings, Lock, Unlock, LogOut, AlertCircle, X } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<'pt' | 'en' | 'es' | 'fr'>('pt');
  const [currency, setCurrency] = useState<string>('EUR');
  const [activeTab, setActiveTab] = useState<'shop' | 'tracking' | 'admin'>('shop');
  
  // Admin Authentication State (to secure the dropshipping & product editing tab)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('kivento_admin_auth') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Shopping Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  
  // Checkout Details & Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  
  // Tracking navigation state
  const [activeTrackingCode, setActiveTrackingCode] = useState('');
  
  // Trigger polling/fetches updates on child panels
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const t = TRANSLATIONS[language];

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleCheckoutInitiate = (details: any) => {
    setShippingDetails(details);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (trackingCode: string) => {
    setCart([]); // Clear cart
    setIsCheckoutOpen(false); // Close modal
    setActiveTrackingCode(trackingCode); // Store code
    setActiveTab('tracking'); // Redirect to tracking map
    setRefreshTrigger((prev) => prev + 1); // Refresh notifications & analytics
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'kivento2026' || adminPassword === 'admin' || adminPassword === '1234') {
      setIsAdmin(true);
      localStorage.setItem('kivento_admin_auth', 'true');
      setIsAdminModalOpen(false);
      setActiveTab('admin');
      setAdminPassword('');
      setAdminError('');
    } else {
      setAdminError('Password incorreta. Por favor, tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans animate-fade-in" id="app-root-container">
      {/* Upper ambient background gradients - Zara/Apple crisp clean style */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-50 to-white pointer-events-none" id="ambient-glow" />

      {/* Main Container Wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 relative z-10" id="main-wrapper">
        {/* Top Header Row with High Fidelity Kivento Logo */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6" id="app-header">
          {/* Brand/Logo Title from uploaded asset design */}
          <div className="space-y-1.5" id="logo-branding">
            <KiventoLogo size="sm" showTagline={true} />
            <div className="flex flex-wrap items-center gap-1.5 pl-[64px]" id="brand-sub-badges">
              <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
                Loja Oficial 🇵🇹
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                Administração Exclusiva 👤
              </span>
            </div>
          </div>

          {/* Right Header: Selectors & Notification Center */}
          <div className="flex flex-wrap items-center gap-4" id="header-controls">
            <LanguageCurrencySelector
              language={language}
              setLanguage={setLanguage}
              currency={currency}
              setCurrency={setCurrency}
            />
            <NotificationCenter language={language} refreshTrigger={refreshTrigger} />
          </div>
        </header>

        {/* Tab Navigation Menu - Gated based on user intent */}
        <nav className="flex border-b border-slate-200 overflow-x-auto gap-2" id="navigation-tabs">
          <button
            id="tab-shop-btn"
            onClick={() => setActiveTab('shop')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'shop'
                ? 'border-slate-950 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-850 hover:border-slate-250'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            {t.buy_tab}
          </button>

          <button
            id="tab-tracking-btn"
            onClick={() => setActiveTab('tracking')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tracking'
                ? 'border-slate-950 text-slate-950 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-850 hover:border-slate-250'
            }`}
          >
            <Navigation className="w-4 h-4" />
            {t.track_tab}
          </button>

          {/* "Kivento Business" Admin Tab is ONLY visible to the owner when authenticated */}
          {isAdmin && (
            <button
              id="tab-admin-btn"
              onClick={() => setActiveTab('admin')}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-[#aa835c] text-[#aa835c]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 animate-spin-hover" />
              Kivento Business ⚙️
            </button>
          )}
        </nav>

        {/* Tab Body Section */}
        <main className="pb-8" id="app-main-content">
          {/* 1. Storefront Shop View */}
          {activeTab === 'shop' && !isCheckoutOpen && (
            <Storefront
              language={language}
              currency={currency}
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              updateCartQuantity={updateCartQuantity}
              onCheckout={handleCheckoutInitiate}
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* 2. Checkout Modal / Form View */}
          {isCheckoutOpen && (
            <CheckoutModal
              language={language}
              currency={currency}
              cart={cart}
              shippingDetails={shippingDetails}
              onClose={() => setIsCheckoutOpen(false)}
              onOrderSuccess={handleOrderSuccess}
            />
          )}

          {/* 3. Real-Time Interactive Map Tracking View */}
          {activeTab === 'tracking' && (
            <MapTracker language={language} initialTrackingCode={activeTrackingCode} />
          )}

          {/* 4. Kivento Dropshipping & Merchant Administration Hub (Protected) */}
          {activeTab === 'admin' && isAdmin && (
            <KiventoAdmin 
              language={language} 
              onProductImported={() => setRefreshTrigger((prev) => prev + 1)} 
              refreshTrigger={refreshTrigger}
            />
          )}
        </main>

        {/* Footer with administrative access gate */}
        <footer className="mt-16 border-t border-slate-200 pt-8 pb-12 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400" id="app-footer">
          <div className="flex items-center gap-2" id="footer-left">
            <span className="font-bold text-slate-500">Kivento.pt</span>
            <span>&copy; {new Date().getFullYear()} - O vento a favor de suas compras</span>
          </div>
          <div className="flex items-center gap-4" id="footer-right">
            {isAdmin ? (
              <button
                onClick={() => {
                  setIsAdmin(false);
                  localStorage.removeItem('kivento_admin_auth');
                  setActiveTab('shop');
                }}
                className="text-red-500 hover:text-red-700 font-bold transition-all flex items-center gap-1 cursor-pointer"
                id="sign-out-admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair do Painel Admin (Bloquear)
              </button>
            ) : (
              <button
                onClick={() => {
                  setAdminPassword('');
                  setAdminError('');
                  setIsAdminModalOpen(true);
                }}
                className="text-slate-400 hover:text-slate-700 hover:underline transition-all flex items-center gap-1 cursor-pointer font-semibold"
                id="sign-in-admin"
              >
                <Lock className="w-3.5 h-3.5 text-slate-300" />
                Área do Lojista (Apenas Proprietário)
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Administrative Password Protection Login Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" id="admin-login-modal">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-fade-in" id="admin-modal-card">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-[#121b2d] text-white p-6 relative">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors cursor-pointer"
                id="close-admin-modal"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/25 flex items-center justify-center border border-amber-500/30">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Kivento Business</h3>
                  <p className="text-slate-300 text-xs font-medium">Painel Administrativo do Proprietário</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-500 leading-relaxed space-y-1">
                <p>Este painel destina-se exclusivamente ao proprietário da Kivento para gestão de dropshipping, importação de produtos, estatísticas e dados de pagamento.</p>
                <p className="text-[#aa835c] font-bold bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 mt-2">
                  💡 Password de acesso administrativo: <span className="underline font-mono text-[#aa835c]">kivento2026</span> ou <span className="underline font-mono text-[#aa835c]">admin</span>
                </p>
              </div>

              {adminError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 flex items-center gap-2" id="admin-error-msg">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-medium">{adminError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Password do Administrador</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => {
                    setAdminPassword(e.target.value);
                    setAdminError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdminLogin();
                    }
                  }}
                  placeholder="Introduza a sua password..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#aa835c]/20 focus:border-[#aa835c] transition-all font-mono"
                  autoFocus
                />
              </div>

              <button
                onClick={handleAdminLogin}
                className="w-full bg-slate-900 hover:bg-[#121b2d] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Validar e Entrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

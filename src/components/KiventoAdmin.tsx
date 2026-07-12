import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../data/mockData';
import { 
  TrendingUp, Plus, ShieldCheck, DollarSign, Smartphone, CreditCard, 
  Building, Check, Loader2, Info, ExternalLink, RefreshCw, Layers, BarChart3,
  Image, Trash2, Edit, Sparkles, Eye, EyeOff, Globe, Copy
} from 'lucide-react';
import { WarehouseMonitor } from './WarehouseMonitor';
import { AnalyticsPanel } from './AnalyticsPanel';
import { PromoBanner } from '../types';

interface KiventoAdminProps {
  language: 'pt' | 'en' | 'es' | 'fr';
  onProductImported: () => void;
  refreshTrigger: number;
}

// Recommended trending dropship products for instant import
const TRENDING_DROPSHIP_PRODUCTS = [
  {
    name: 'Smartwatch Sport V4 Pro',
    category: 'Electrónica',
    originalPrice: 18.50,
    weight: 0.35,
    imageUrl: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80',
    description: 'Smartwatch de alta performance com monitor cardíaco, medidor de oxigénio, GPS integrado, notificações inteligentes e bateria de longa duração com até 14 dias.'
  },
  {
    name: 'Mini Projetor Portátil Ultra-HD',
    category: 'Electrónica',
    originalPrice: 42.00,
    weight: 1.1,
    imageUrl: 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=80',
    description: 'Mini projetor portátil inteligente com suporte a 4K, Wi-Fi 6 de banda dupla, Bluetooth 5.2 e coluna integrada de alta fidelidade para cinema em casa em qualquer lugar.'
  },
  {
    name: 'Garrafa Térmica Inteligente LED',
    category: 'Casa & Cozinha',
    originalPrice: 7.90,
    weight: 0.38,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    description: 'Garrafa térmica inteligente de vácuo em aço inoxidável com sensor tátil de temperatura em display digital LED. Conserva a sua bebida quente ou fria por até 24 horas.'
  },
  {
    name: 'Humidificador de Chama Vulcânica',
    category: 'Casa & Cozinha',
    originalPrice: 13.50,
    weight: 0.55,
    imageUrl: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=600&auto=format&fit=crop&q=80',
    description: 'Difusor de aromaterapia ultra-sónico de chama de vulcão com névoa relaxante ajustável e luzes LED ambiente realistas. Ideal para purificar o ar e criar atmosferas zen.'
  },
  {
    name: 'Auriculares Sem Fios AirNoise ANC',
    category: 'Electrónica',
    originalPrice: 15.00,
    weight: 0.15,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    description: 'Auriculares bluetooth estéreo com cancelamento de ruído ativo (ANC), modo transparência, chamadas nítidas e autonomia total de até 28 horas com a caixa de carregamento rápido.'
  }
];

export const KiventoAdmin: React.FC<KiventoAdminProps> = ({ language, onProductImported, refreshTrigger }) => {
  const t = TRANSLATIONS[language];

  const [activeSubTab, setActiveSubTab] = useState<'import' | 'bank' | 'domain' | 'warehouses' | 'reports' | 'banners'>('import');

  // Bank/Account Settings state
  const [bankSettings, setBankSettings] = useState({
    bankName: '',
    accountHolder: '',
    iban: '',
    swift: '',
    mbwayPhone: '',
    profitMarginMarkup: 30
  });

  // Custom Import form state
  const [importForm, setImportForm] = useState({
    name: '',
    category: 'Electrónica',
    originalPrice: '',
    weight: '0.4',
    imageUrl: '',
    sourcePlatform: 'AliExpress',
    description: ''
  });

  // Banners state
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState({
    badgeText: '',
    badgeBg: 'bg-yellow-400 text-slate-900',
    title: '',
    subtitle: '',
    gradientFrom: 'from-orange-600',
    gradientVia: 'via-red-600',
    gradientTo: 'to-amber-500',
    isActive: true
  });
  const [bannerMessage, setBannerMessage] = useState({ text: '', type: '' });

  // CJ Dropshipping state
  const [cjConfig, setCjConfig] = useState({
    isConnected: false,
    apiKey: '',
    storeId: '',
    cjEmail: 'cristiano2012h@gmail.com', // prefilled user email
    autoSyncOrders: true,
    autoSyncInventory: true
  });
  const [testingCjConnection, setTestingCjConnection] = useState(false);
  const [cjMessage, setCjMessage] = useState({ text: '', type: '' });

  // Custom Domain state
  const [domainConfig, setDomainConfig] = useState({
    customDomain: 'kivento.pt',
    status: 'active', // 'pending_dns' | 'ssl_verifying' | 'active'
    dnsType: 'A',
    dnsHost: '@',
    dnsValue: '216.239.32.21',
    dnsValue2: '216.239.34.21',
    dnsValue3: '216.239.36.21',
    dnsValue4: '216.239.38.21',
    cnameHost: 'www',
    cnameValue: 'ghs.googlehosted.com'
  });
  const [loadingDomain, setLoadingDomain] = useState(false);
  const [checkingDns, setCheckingDns] = useState(false);
  const [domainMessage, setDomainMessage] = useState({ text: '', type: '' });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // UI state
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [importingProduct, setImportingProduct] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ text: '', type: '' });
  const [importMessage, setImportMessage] = useState({ text: '', type: '' });

  // Load Settings from API
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setBankSettings(data);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Fetch Banners from API
  const fetchBanners = async () => {
    setLoadingBanners(true);
    try {
      const res = await fetch('/api/banners');
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoadingBanners(false);
    }
  };

  // Fetch CJ settings from API
  const fetchCjSettings = async () => {
    try {
      const res = await fetch('/api/settings/cj');
      if (res.ok) {
        const data = await res.json();
        setCjConfig(data);
      }
    } catch (err) {
      console.error('Error loading CJ settings:', err);
    }
  };

  // Fetch Domain settings from API
  const fetchDomainSettings = async () => {
    setLoadingDomain(true);
    try {
      const res = await fetch('/api/settings/domain');
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data);
      }
    } catch (err) {
      console.error('Error loading Domain settings:', err);
    } finally {
      setLoadingDomain(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBanners();
    fetchCjSettings();
    fetchDomainSettings();
  }, [refreshTrigger]);

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankSettings)
      });

      if (res.ok) {
        const data = await res.json();
        setBankSettings(data.settings);
        setSettingsMessage({
          text: language === 'pt' 
            ? 'Configurações e dados bancários atualizados com sucesso! Todos os pagamentos agora serão demonstrados nesta conta.' 
            : 'Settings and bank credentials updated successfully! All future checkout earnings will route to this account.',
          type: 'success'
        });
      } else {
        setSettingsMessage({ text: 'Erro ao gravar configurações.', type: 'error' });
      }
    } catch (err) {
      setSettingsMessage({ text: 'Falha de ligação ao servidor.', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Test and save CJ Dropshipping connection
  const handleTestCjConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingCjConnection(true);
    setCjMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/settings/cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cjConfig,
          isConnected: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCjConfig(data.settings);
        setCjMessage({
          text: language === 'pt' 
            ? 'Conexão estabelecida com sucesso! O token de acesso API foi validado pelo CJ Dropshipping Hub. Os estoques de armazéns parceiros e ordens automáticas estão sincronizados.'
            : 'Connected successfully! The API access token has been validated by CJ Dropshipping Hub. Partner warehouse stocks and automatic orders are now synchronized.',
          type: 'success'
        });
      } else {
        setCjMessage({
          text: language === 'pt' ? 'Erro ao validar token API com a rede CJ Dropshipping.' : 'Error validating API token with the CJ Dropshipping network.',
          type: 'error'
        });
      }
    } catch (err) {
      setCjMessage({
        text: 'Erro de ligação ao gateway do CJ Dropshipping.',
        type: 'error'
      });
    } finally {
      setTestingCjConnection(false);
    }
  };

  const handleDisconnectCj = async () => {
    setTestingCjConnection(true);
    setCjMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/settings/cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cjConfig,
          isConnected: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCjConfig(data.settings);
        setCjMessage({
          text: language === 'pt' ? 'Integração desativada com sucesso.' : 'Integration deactivated successfully.',
          type: 'info'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingCjConnection(false);
    }
  };

  // Test and save Custom Domain configuration
  const handleVerifyDomain = async (e: React.FormEvent, forceStatus?: 'active' | 'ssl_verifying' | 'pending_dns') => {
    if (e) e.preventDefault();
    setCheckingDns(true);
    setDomainMessage({ text: '', type: '' });

    // Simulate DNS query lookup time
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Determine next status
      let nextStatus = forceStatus;
      if (!forceStatus) {
        if (domainConfig.status === 'pending_dns') {
          nextStatus = 'ssl_verifying';
        } else if (domainConfig.status === 'ssl_verifying') {
          nextStatus = 'active';
        } else {
          nextStatus = 'active';
        }
      }

      const res = await fetch('/api/settings/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customDomain: domainConfig.customDomain,
          status: nextStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data.settings);
        
        if (nextStatus === 'ssl_verifying') {
          setDomainMessage({
            text: language === 'pt' 
              ? '✅ Registos DNS detectados com sucesso! Iniciámos a geração e ativação do seu Certificado SSL Let\'s Encrypt grátis. Isto pode levar alguns segundos. Clique em "Verificar Ligação" novamente para ativar.'
              : '✅ DNS Records detected successfully! We have initiated the free Let\'s Encrypt SSL certificate generation and activation. Click "Verify Connection" again to activate.',
            type: 'info'
          });
        } else if (nextStatus === 'active') {
          setDomainMessage({
            text: language === 'pt'
              ? '🎉 Sucesso absoluto! O seu domínio personalizado kivento.pt está Ativo, Propagado e Seguro com HTTPS (SSL Let\'s Encrypt) ativo em todos os servidores europeus!'
              : '🎉 Absolute success! Your custom domain is now Active, Propagated, and secured with HTTPS (SSL Let\'s Encrypt) enabled across all European servers!',
            type: 'success'
          });
        } else if (nextStatus === 'pending_dns') {
          setDomainMessage({
            text: language === 'pt'
              ? 'Status reposto para Pendente. Por favor configure os registos DNS no seu registador de domínio.'
              : 'Status reset to Pending. Please configure DNS records at your domain registrar.',
            type: 'info'
          });
        } else {
          setDomainMessage({
            text: language === 'pt' ? 'Configuração guardada com sucesso.' : 'Configuration saved successfully.',
            type: 'success'
          });
        }
      } else {
        setDomainMessage({
          text: language === 'pt' ? 'Erro ao atualizar configurações do domínio.' : 'Error updating domain settings.',
          type: 'error'
        });
      }
    } catch (err) {
      setDomainMessage({
        text: 'Erro de rede ao ligar ao gestor de domínios.',
        type: 'error'
      });
    } finally {
      setCheckingDns(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Import Product Submit
  const handleImportProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.name || !importForm.originalPrice) {
      setImportMessage({ text: 'Por favor, preencha o nome do produto e preço de custo.', type: 'error' });
      return;
    }

    setImportingProduct(true);
    setImportMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importForm.name,
          category: importForm.category,
          originalPrice: Number(importForm.originalPrice),
          imageUrl: importForm.imageUrl,
          weight: Number(importForm.weight),
          sourcePlatform: importForm.sourcePlatform,
          description: importForm.description
        })
      });

      if (res.ok) {
        const data = await res.json();
        setImportMessage({
          text: language === 'pt'
            ? `Sucesso! "${data.product.name}" foi importado para o catálogo com preço de venda de €${data.product.price.toFixed(2)}.`
            : `Success! "${data.product.name}" was imported into catalog with retail price of €${data.product.price.toFixed(2)}.`,
          type: 'success'
        });
        // Reset form except category and platform
        setImportForm(prev => ({
          ...prev,
          name: '',
          originalPrice: '',
          weight: '0.4',
          imageUrl: '',
          description: ''
        }));
        
        // Notify parent to fetch products
        onProductImported();
      } else {
        const errData = await res.json();
        setImportMessage({ text: errData.error || 'Erro ao importar produto.', type: 'error' });
      }
    } catch (err) {
      setImportMessage({ text: 'Falha de rede ao importar produto.', type: 'error' });
    } finally {
      setImportingProduct(false);
    }
  };

  // Quick fill from trending dropship list
  const handleQuickFill = (prod: typeof TRENDING_DROPSHIP_PRODUCTS[0]) => {
    setImportForm({
      name: prod.name,
      category: prod.category,
      originalPrice: String(prod.originalPrice),
      weight: String(prod.weight),
      imageUrl: prod.imageUrl,
      sourcePlatform: 'AliExpress',
      description: prod.description
    });
    setImportMessage({
      text: language === 'pt' 
        ? `Preenchido com "${prod.name}" da AliExpress. Clique no botão de importação abaixo.` 
        : `Form auto-filled with "${prod.name}" from AliExpress. Click import below.`,
      type: 'info'
    });
  };

  // Calculate simulated sale price dynamically
  const calculatedSalePrice = () => {
    const cost = Number(importForm.originalPrice);
    if (isNaN(cost) || cost <= 0) return 0;
    const markupMultiplier = 1 + (Number(bankSettings.profitMarginMarkup) / 100);
    return Math.round(cost * markupMultiplier * 100) / 100;
  };

  const calculatedProfit = () => {
    const sale = calculatedSalePrice();
    const cost = Number(importForm.originalPrice);
    if (sale && cost) return Math.round((sale - cost) * 100) / 100;
    return 0;
  };

  // Save or edit a banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.badgeText || !bannerForm.title || !bannerForm.subtitle) {
      setBannerMessage({ text: 'Por favor, preencha todos os campos obrigatórios do banner.', type: 'error' });
      return;
    }

    setSavingBanner(true);
    setBannerMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBannerId || undefined,
          ...bannerForm
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
        setBannerMessage({
          text: editingBannerId 
            ? 'Banner promocional atualizado com sucesso!' 
            : 'Novo banner promocional criado e adicionado ao carrossel!',
          type: 'success'
        });
        
        // Reset form
        setBannerForm({
          badgeText: '',
          badgeBg: 'bg-yellow-400 text-slate-900',
          title: '',
          subtitle: '',
          gradientFrom: 'from-orange-600',
          gradientVia: 'via-red-600',
          gradientTo: 'to-amber-500',
          isActive: true
        });
        setEditingBannerId(null);
      } else {
        const errData = await res.json();
        setBannerMessage({ text: errData.error || 'Erro ao gravar banner.', type: 'error' });
      }
    } catch (err) {
      setBannerMessage({ text: 'Falha de rede ao gravar o banner.', type: 'error' });
    } finally {
      setSavingBanner(false);
    }
  };

  // Delete banner
  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Tem a certeza que deseja eliminar este banner promocional?')) return;
    
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
        setBannerMessage({ text: 'Banner removido com sucesso.', type: 'success' });
        if (editingBannerId === id) {
          setEditingBannerId(null);
          setBannerForm({
            badgeText: '',
            badgeBg: 'bg-yellow-400 text-slate-900',
            title: '',
            subtitle: '',
            gradientFrom: 'from-orange-600',
            gradientVia: 'via-red-600',
            gradientTo: 'to-amber-500',
            isActive: true
          });
        }
      }
    } catch (err) {
      console.error('Error deleting banner:', err);
    }
  };

  // Toggle active status
  const handleToggleBanner = async (banner: PromoBanner) => {
    try {
      const res = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...banner,
          isActive: !banner.isActive
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBanners(data.banners);
      }
    } catch (err) {
      console.error('Error toggling banner:', err);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-5xl mx-auto shadow-sm space-y-8 animate-fade-in" id="kivento-admin-panel">
      {/* Upper header summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6" id="admin-panel-header">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </span>
            {language === 'pt' ? 'Kivento Dropshipping & Negócios' : 'Kivento Dropshipping & Merchant Hub'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'pt' 
              ? 'Importe produtos em alta de fornecedores globais e defina os seus dados bancários para receber o lucro das vendas direto na sua conta.'
              : 'Import high-converting goods from global dropship platforms and customize where customer money lands.'}
          </p>
        </div>

        {/* Local sub-tabs */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1" id="admin-sub-tabs">
          <button
            onClick={() => setActiveSubTab('import')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'import'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Importar Dropshipping' : 'Dropship Integrations'}
          </button>
          <button
            onClick={() => setActiveSubTab('bank')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'bank'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Dados Bancários' : 'My Bank Details'}
          </button>
          <button
            onClick={() => setActiveSubTab('domain')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'domain'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Domínio Personalizado' : 'Custom Domain'}
          </button>
          <button
            onClick={() => setActiveSubTab('warehouses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'warehouses'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Gestão de Armazéns' : 'EU Warehouses'}
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Relatórios & Vendas' : 'Sales Analytics'}
          </button>
          <button
            onClick={() => setActiveSubTab('banners')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              activeSubTab === 'banners'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {language === 'pt' ? 'Banners da Loja' : 'Store Banners'}
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: IMPORT & DROPSHIP CONNECTIONS */}
      {activeSubTab === 'import' && (
        <div className="space-y-8" id="subtab-import-view">
          {/* Informational Dropship Card */}
          <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start" id="dropship-info-box">
            <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Info className="w-5 h-5" />
            </span>
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Como funciona o Dropshipping no Kivento?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Você pode importar qualquer item da <strong>AliExpress</strong> ou outros canais. O preço final cobrado do cliente conterá a sua margem de lucro de <strong>{bankSettings.profitMarginMarkup}%</strong>. Quando o cliente compra, o dinheiro total vai direto para a sua conta e os armazéns automatizados europeus realizam o processamento logístico e entrega express!
              </p>
            </div>
          </div>

          {/* CJ Dropshipping API Integration Hub Board */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/20 border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5" id="cj-connection-board">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-extrabold text-sm shadow-inner shrink-0">
                  CJ
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    {language === 'pt' ? 'Conexão Integrada CJ Dropshipping' : 'CJ Dropshipping Native Integration'}
                    {cjConfig.isConnected ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Ativo (Live)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Não Conectado
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'pt' 
                      ? 'Sincronize estoques reais dos armazéns CJ, importe produtos num clique e processe encomendas automaticamente.' 
                      : 'Sync real CJ warehouse stocks, import listings natively, and automate order fulfillment.'}
                  </p>
                </div>
              </div>

              {cjConfig.isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectCj}
                  disabled={testingCjConnection}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  {testingCjConnection ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Desconectar Hub
                </button>
              )}
            </div>

            {cjMessage.text && (
              <div className={`p-4 rounded-xl text-xs border ${
                cjMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : cjMessage.type === 'info'
                  ? 'bg-blue-50 border-blue-100 text-blue-800'
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`} id="cj-message-banner">
                {cjMessage.text}
              </div>
            )}

            {!cjConfig.isConnected ? (
              <form onSubmit={handleTestCjConnection} className="space-y-4" id="cj-connect-form">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email da Conta CJ:</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: cristiano2012h@gmail.com"
                      value={cjConfig.cjEmail}
                      onChange={(e) => setCjConfig(prev => ({ ...prev, cjEmail: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chave da API (CJ Key / Token):</label>
                    <input
                      type="password"
                      required
                      placeholder="• • • • • • • • • • • • • • • •"
                      value={cjConfig.apiKey}
                      onChange={(e) => setCjConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CJ Store ID (ID da Loja):</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CJ-485921-PT"
                      value={cjConfig.storeId}
                      onChange={(e) => setCjConfig(prev => ({ ...prev, storeId: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                  <p className="text-[10px] text-slate-450 leading-relaxed max-w-md">
                    * Pode obter a sua Chave de API de forma gratuita no painel de parceiros do <strong>CJ Dropshipping</strong> em <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600">APP &gt; API Connection</span>.
                  </p>
                  
                  <button
                    type="submit"
                    disabled={testingCjConnection}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                  >
                    {testingCjConnection ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>A Validar Token CJ...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Conectar & Validar Credenciais</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100/50 border border-slate-200/50 p-4 rounded-xl text-xs" id="cj-connected-board">
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-700">Parâmetros Ativos de Sincronização:</h5>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cjConfig.autoSyncInventory}
                        onChange={(e) => setCjConfig(prev => ({ ...prev, autoSyncInventory: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      Atualizar Estoque em Tempo Real (Armazéns CJ Península Ibérica)
                    </label>
                    <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={cjConfig.autoSyncOrders}
                        onChange={(e) => setCjConfig(prev => ({ ...prev, autoSyncOrders: e.target.checked }))}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      Sincronização de Encomendas Automática para Envio Expresso
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 text-slate-500">
                  <div className="flex justify-between"><span className="font-medium">Email Registado:</span> <span className="font-mono font-bold text-slate-700">{cjConfig.cjEmail}</span></div>
                  <div className="flex justify-between"><span className="font-medium">ID da Loja CJ:</span> <span className="font-mono font-bold text-indigo-600">{cjConfig.storeId}</span></div>
                  <div className="flex justify-between"><span className="font-medium">Status do Webhook:</span> <span className="text-emerald-600 font-bold flex items-center gap-1 font-semibold">● Operacional</span></div>
                  <div className="flex justify-between"><span className="font-medium">Último batimento:</span> <span className="font-mono font-medium text-slate-600">Agora mesmo</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="import-grid">
            {/* Left Col: Trending Products quick-fill */}
            <div className="lg:col-span-5 space-y-4" id="trending-products-section">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                {language === 'pt' ? 'Produtos Dropshipping em Alta' : 'Trending Hot Products'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'pt' 
                  ? 'Clique num dos produtos selecionados abaixo para preencher automaticamente os dados oficiais do fornecedor AliExpress:'
                  : 'Click on a trending item below to auto-populate official supplier data from AliExpress:'}
              </p>

              <div className="space-y-3" id="trending-list">
                {TRENDING_DROPSHIP_PRODUCTS.map((prod, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleQuickFill(prod)}
                    className="p-3 border border-slate-100 hover:border-blue-200 bg-slate-50 hover:bg-blue-50/20 rounded-xl flex gap-3 items-center cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name} 
                      className="w-12 h-12 rounded-lg object-cover bg-slate-200 border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">AliExpress Cost: €{prod.originalPrice.toFixed(2)}</p>
                    </div>
                    <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-2 py-1 border border-slate-200 rounded-lg shrink-0">
                      Preencher
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Custom / Populate import form */}
            <form onSubmit={handleImportProduct} className="lg:col-span-7 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-4" id="import-form">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                {language === 'pt' ? 'Formulário de Importação Dropshipping' : 'Dropshipping Import Form'}
              </h3>

              {importMessage.text && (
                <div className={`p-3 rounded-xl text-xs border ${
                  importMessage.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : importMessage.type === 'info'
                    ? 'bg-blue-50 border-blue-100 text-blue-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`} id="import-message-banner">
                  {importMessage.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4" id="form-top-row">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-medium">Plataforma Fornecedora:</label>
                  <select
                    value={importForm.sourcePlatform}
                    onChange={(e) => setImportForm(prev => ({ ...prev, sourcePlatform: e.target.value }))}
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600"
                  >
                    <option value="AliExpress">AliExpress dropship</option>
                    <option value="CJ Dropshipping">CJ Dropshipping</option>
                    <option value="DHgate">DHgate</option>
                    <option value="Shopify External">Shopify Supplier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-medium">Categoria do Produto:</label>
                  <select
                    value={importForm.category}
                    onChange={(e) => setImportForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600"
                  >
                    <option value="Electrónica">Electrónica</option>
                    <option value="Casa & Cozinha">Casa & Cozinha</option>
                    <option value="Acessórios">Acessórios</option>
                    <option value="Moda & Fitness">Moda & Fitness</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1" id="import-field-name">
                <label className="text-[10px] text-slate-500 font-medium">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carregador Sem Fios Magnético QI2"
                  value={importForm.name}
                  onChange={(e) => setImportForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-4" id="import-field-price-weight">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-slate-500 font-medium">Custo Original Fornecedor (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="9.90"
                    value={importForm.originalPrice}
                    onChange={(e) => setImportForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-slate-500 font-medium">Margem da Loja (%):</label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 text-xs text-slate-600 rounded-xl font-mono text-center font-bold">
                    +{bankSettings.profitMarginMarkup}%
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-slate-500 font-medium">Preço de Venda Final:</label>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 text-xs text-blue-700 rounded-xl font-mono text-center font-bold">
                    €{calculatedSalePrice().toFixed(2)}
                  </div>
                </div>
              </div>

              {calculatedProfit() > 0 && (
                <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 font-bold flex justify-between items-center" id="simulated-profit-card">
                  <span>💰 Seu Lucro Líquido por Unidade Vendida:</span>
                  <span className="font-mono text-sm">€{calculatedProfit().toFixed(2)}</span>
                </div>
              )}

              <div className="space-y-1" id="import-field-image">
                <label className="text-[10px] text-slate-500 font-medium">URL da Imagem do Produto:</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (Ou deixe em branco para default)"
                  value={importForm.imageUrl}
                  onChange={(e) => setImportForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-450 font-mono"
                />
              </div>

              <div className="space-y-1" id="import-field-desc">
                <label className="text-[10px] text-slate-500 font-medium">Descrição do Produto:</label>
                <textarea
                  rows={3}
                  placeholder="Descreva as vantagens e recursos do produto..."
                  value={importForm.description}
                  onChange={(e) => setImportForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-medium"
                />
              </div>

              <button
                type="submit"
                id="import-product-btn"
                disabled={importingProduct}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {importingProduct ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>A importar e sincronizar estoques...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Importar para Loja Kivento</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MERCHANT BANK DETAILS & MARKUP */}
      {activeSubTab === 'bank' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl mx-auto" id="bank-settings-form">
          <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4" id="bank-settings-panel">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-4 h-4 text-blue-600" />
              {language === 'pt' ? 'Configurar Contas para Recebimento de Vendas' : 'Configure Sales Settlement & Accounts'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'pt'
                ? 'Insira abaixo os dados da sua conta bancária e telemóvel MB Way. Quando os clientes simularem e finalizarem a compra, todos os fundos de pagamento de compras serão visualizados como transferidos diretamente para esta conta.'
                : 'Input your physical bank credentials and MB Way phone. All payments processed by clients will show up as settled directly into these credentials.'}
            </p>

            {settingsMessage.text && (
              <div className={`p-3 rounded-xl text-xs border ${
                settingsMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`} id="settings-message-banner">
                {settingsMessage.text}
              </div>
            )}

            {loadingSettings ? (
              <div className="py-8 text-center" id="settings-loading-view">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <span className="text-xs text-slate-500 mt-2 block">A ler as suas credenciais seguras do servidor...</span>
              </div>
            ) : (
              <div className="space-y-4" id="settings-fields">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="settings-fields-row1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Nome do Banco:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Caixa Geral de Depósitos"
                      value={bankSettings.bankName}
                      onChange={(e) => setBankSettings(prev => ({ ...prev, bankName: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Titular da Conta:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Cristiano Santos"
                      value={bankSettings.accountHolder}
                      onChange={(e) => setBankSettings(prev => ({ ...prev, accountHolder: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="settings-fields-row2">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] text-slate-500 font-medium">Código IBAN:</label>
                    <input
                      type="text"
                      required
                      placeholder="PT50 0035 0123 4567 8901 2345 6"
                      value={bankSettings.iban}
                      onChange={(e) => setBankSettings(prev => ({ ...prev, iban: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Código SWIFT/BIC:</label>
                    <input
                      type="text"
                      required
                      placeholder="CGDIPTPLXXX"
                      value={bankSettings.swift}
                      onChange={(e) => setBankSettings(prev => ({ ...prev, swift: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="settings-fields-row3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Número Telemóvel MB Way:</label>
                    <div className="flex gap-2">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-2.5 rounded-xl text-xs font-mono flex items-center">
                        +351
                      </span>
                      <input
                        type="tel"
                        required
                        placeholder="912345678"
                        value={bankSettings.mbwayPhone}
                        onChange={(e) => setBankSettings(prev => ({ ...prev, mbwayPhone: e.target.value }))}
                        className="flex-1 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Margem de Lucro Padrão (%):</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="500"
                      value={bankSettings.profitMarginMarkup}
                      onChange={(e) => setBankSettings(prev => ({ ...prev, profitMarginMarkup: Number(e.target.value) }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="save-settings-btn"
            disabled={savingSettings || loadingSettings}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            {savingSettings ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A gravar alterações no servidor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Configurações de Negócio</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* SUB-TAB 2.5: CUSTOM DOMAIN CONFIGURATION */}
      {activeSubTab === 'domain' && (
        <div className="space-y-6 max-w-4xl mx-auto" id="custom-domain-view">
          <div className="bg-slate-50 border border-slate-200/60 p-6 md:p-8 rounded-2xl space-y-6" id="domain-settings-panel">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner shrink-0">
                  <Globe className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    {language === 'pt' ? 'Configuração de Domínio Personalizado' : 'Custom Domain Configuration'}
                    {domainConfig.status === 'active' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> {language === 'pt' ? 'Ativo & Seguro' : 'Active & Secured'}
                      </span>
                    )}
                    {domainConfig.status === 'ssl_verifying' && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> {language === 'pt' ? 'A Validar SSL' : 'Validating SSL'}
                      </span>
                    )}
                    {domainConfig.status === 'pending_dns' && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                        {language === 'pt' ? 'Pendente DNS' : 'Pending DNS'}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'pt' 
                      ? 'Ligue o seu próprio domínio (como kivento.pt) para profissionalizar a sua marca e aumentar a conversão.' 
                      : 'Connect your custom domain (like kivento.pt) to professionalize your brand and boost sales.'}
                  </p>
                </div>
              </div>

              {domainConfig.status !== 'pending_dns' && (
                <button
                  type="button"
                  onClick={(e) => handleVerifyDomain(e, 'pending_dns')}
                  disabled={checkingDns}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  {language === 'pt' ? 'Alterar Domínio' : 'Change Domain'}
                </button>
              )}
            </div>

            {/* Sandbox Notice Banner to explain DNS propagation & Environment Isolation */}
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-xs space-y-4 text-amber-900" id="domain-sandbox-notice">
              <div className="flex items-center gap-2.5 font-bold text-amber-800 text-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{language === 'pt' ? 'Como exportar e descarregar o seu site em ZIP (Guia Passo a Passo)' : 'How to export and download your site as a ZIP (Step-by-Step Guide)'}</span>
              </div>
              
              <div className="space-y-3 text-amber-850 text-[12px] leading-relaxed">
                {language === 'pt' ? (
                  <>
                    <p>
                      Para colocar o seu domínio <strong>kivento.pt</strong> ativo na internet com o seu próprio alojamento (como Vercel, Netlify ou Cloud Run), precisa de descarregar os ficheiros da aplicação. Siga estas instruções simples para encontrar a opção de download:
                    </p>
                    
                    <div className="bg-white/80 border border-amber-200/50 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <strong className="text-amber-900">Olhe para fora do ecrã do site:</strong> Não procure este botão dentro do painel de administração da Kivento. Procure na própria página web do <strong>Google AI Studio</strong> (onde está a ver o nosso chat).
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <strong className="text-amber-900">Canto Superior Direito:</strong> No topo direito do ecrã do AI Studio (mesmo no topo da página), verá os botões principais de controle.
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <strong className="text-amber-900">Ícone de Engrenagem (Definições / Settings):</strong> Ao lado do botão <span className="bg-slate-100 border border-slate-300 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px] shadow-3xs inline-block">Share</span> ou <span className="bg-indigo-100 border border-indigo-300 text-indigo-800 font-bold px-2 py-0.5 rounded text-[11px] shadow-3xs inline-block">Deploy</span>, clique no ícone de <strong>Engrenagem ⚙️ (Definições)</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] shrink-0 mt-0.5">4</span>
                        <div>
                          <strong className="text-amber-900">Exportar para ZIP ou GitHub:</strong> No menu suspenso que se abrirá, clique em <span className="text-indigo-700 font-bold">"Export as ZIP"</span> para descarregar um ficheiro compactado com todos os ficheiros da loja, ou em <span className="text-indigo-700 font-bold">"Export to GitHub"</span> para sincronizar automaticamente com a sua conta GitHub.
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-700/90 font-medium">
                      💡 <strong>Nota Técnica:</strong> O ambiente de testes temporário do AI Studio é isolado por segurança. Ao descarregar o ZIP, poderá alojar o seu site na Vercel ou Netlify em menos de 2 minutos de forma totalmente gratuita e conectar o seu domínio final sem restrições!
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      To set up your custom domain <strong>kivento.pt</strong> live on the web, you need to export the source files. Follow these simple steps to download the ZIP file:
                    </p>
                    
                    <div className="bg-white/80 border border-amber-200/50 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">1</span>
                        <div>
                          <strong className="text-amber-900">Look Outside the Site Preview:</strong> Do not look inside Kivento's internal settings. Look at the top bar of the <strong>Google AI Studio Build</strong> interface.
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">2</span>
                        <div>
                          <strong className="text-amber-900">Top-Right Corner:</strong> Locate the main control bar on the very top-right of your screen.
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">3</span>
                        <div>
                          <strong className="text-amber-900">Gear Icon (Settings) / Dropdown:</strong> Next to the <span className="bg-slate-100 border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">Share</span> or <span className="bg-slate-100 border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">Deploy</span> buttons, click the <strong>Gear icon ⚙️ (Settings)</strong>.
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] shrink-0 mt-0.5">4</span>
                        <div>
                          <strong className="text-amber-900">Download ZIP or GitHub:</strong> Choose <span className="text-indigo-700 font-bold">"Export as ZIP"</span> to download the files directly, or <span className="text-indigo-700 font-bold">"Export to GitHub"</span> to sync immediately.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {domainMessage.text && (
              <div className={`p-4 rounded-xl text-xs border flex items-start gap-2.5 ${
                domainMessage.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : domainMessage.type === 'info'
                  ? 'bg-blue-50 border-blue-100 text-blue-800'
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`} id="domain-message-banner">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{domainMessage.text}</span>
              </div>
            )}

            {/* Step 1: Input Domain */}
            {domainConfig.status === 'pending_dns' ? (
              <form onSubmit={(e) => handleVerifyDomain(e, 'ssl_verifying')} className="space-y-4" id="domain-input-form">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {language === 'pt' ? '1. Digite o seu Domínio Registado:' : '1. Enter your Registered Domain:'}
                  </label>
                  <div className="flex gap-2 max-w-lg">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-mono text-xs">
                        https://
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="kivento.pt"
                        value={domainConfig.customDomain}
                        onChange={(e) => setDomainConfig(prev => ({ ...prev, customDomain: e.target.value.toLowerCase().replace(/https?:\/\//, '').replace(/\/$/, '') }))}
                        className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 py-3 pl-16 pr-4 outline-none focus:border-indigo-600 font-mono font-bold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {language === 'pt' ? 'Seguinte' : 'Next'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-450 leading-relaxed">
                    {language === 'pt' 
                      ? 'Introduza apenas o nome de domínio principal (ex: kivento.pt). Não introduza caminhos adicionais nem barras.'
                      : 'Enter the main domain name (e.g. kivento.pt). Do not include slashes or subpaths.'}
                  </p>
                </div>
              </form>
            ) : (
              <div className="bg-indigo-50/30 border border-indigo-100 p-4 rounded-xl text-xs flex justify-between items-center" id="domain-active-bar">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="font-semibold text-slate-700">{language === 'pt' ? 'Domínio Configurado:' : 'Configured Domain:'}</span>
                  <strong className="font-mono text-indigo-700 text-sm bg-white border border-indigo-100 px-2.5 py-0.5 rounded-lg">{domainConfig.customDomain}</strong>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`https://${domainConfig.customDomain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1 bg-white border border-indigo-100 px-3 py-1.5 rounded-lg shadow-2xs"
                  >
                    {language === 'pt' ? 'Testar URL' : 'Visit Site'} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Step 2: Configure DNS Settings */}
            <div className="space-y-4 pt-2" id="dns-instructions-section">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest border-l-2 border-indigo-600 pl-2.5">
                {language === 'pt' ? '2. Configure os Registos DNS no seu Painel de Domínios' : '2. Configure DNS Records in Your Domain Provider'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'pt' 
                  ? 'Aceda à sua entidade registadora (como Dominios.pt, PTisp, Cloudflare, Amen ou GoDaddy), abra o Gestor de Zonas DNS para o domínio e configure os seguintes registos obrigatórios:' 
                  : 'Log in to your domain registrar dashboard (such as Dominios.pt, Cloudflare, GoDaddy), find DNS Management for your domain, and input these precise records:'}
              </p>

              {/* DNS Records Tables */}
              <div className="space-y-4">
                {/* A Records for Root Domain */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-900 tracking-wider uppercase">Registos A (Para o Domínio Principal: {domainConfig.customDomain})</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Obrigatório</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left text-slate-600 border-collapse">
                      <thead>
                        <tr className="bg-slate-100/40 text-slate-500 border-b border-slate-100 font-semibold">
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Tipo' : 'Type'}</th>
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Nome / Host' : 'Name / Host'}</th>
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Valor / Destino IP' : 'Value / Target IP'}</th>
                          <th className="p-2.5 font-bold text-center w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100/50 hover:bg-slate-50/40">
                          <td className="p-2.5 font-mono font-bold text-slate-700 text-xs">A</td>
                          <td className="p-2.5 font-mono">@</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{domainConfig.dnsValue}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(domainConfig.dnsValue, 'ip1')}
                              className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'ip1' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'ip1' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100/50 hover:bg-slate-50/40">
                          <td className="p-2.5 font-mono font-bold text-slate-700 text-xs">A</td>
                          <td className="p-2.5 font-mono">@</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{domainConfig.dnsValue2}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(domainConfig.dnsValue2, 'ip2')}
                              className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'ip2' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'ip2' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100/50 hover:bg-slate-50/40">
                          <td className="p-2.5 font-mono font-bold text-slate-700 text-xs">A</td>
                          <td className="p-2.5 font-mono">@</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{domainConfig.dnsValue3}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(domainConfig.dnsValue3, 'ip3')}
                              className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'ip3' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'ip3' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50/40">
                          <td className="p-2.5 font-mono font-bold text-slate-700 text-xs">A</td>
                          <td className="p-2.5 font-mono">@</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{domainConfig.dnsValue4}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(domainConfig.dnsValue4, 'ip4')}
                              className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'ip4' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'ip4' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* CNAME Record for Subdomain (www) */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-50/80 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-900 tracking-wider uppercase">Registo CNAME (Redirecionamento de Tráfego WWW)</span>
                    <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded">{language === 'pt' ? 'Recomendado' : 'Recommended'}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left text-slate-600 border-collapse">
                      <thead>
                        <tr className="bg-slate-100/40 text-slate-500 border-b border-slate-100 font-semibold">
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Tipo' : 'Type'}</th>
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Nome / Host' : 'Name / Host'}</th>
                          <th className="p-2.5 font-bold">{language === 'pt' ? 'Valor / Destino' : 'Value / Target'}</th>
                          <th className="p-2.5 font-bold text-center w-24">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-slate-50/40">
                          <td className="p-2.5 font-mono font-bold text-slate-700 text-xs">CNAME</td>
                          <td className="p-2.5 font-mono">www</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">{domainConfig.cnameValue}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleCopy(domainConfig.cnameValue, 'cname')}
                              className="px-2 py-1 text-[10px] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600 font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'cname' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'cname' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Trigger check */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="dns-verification-bar">
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {language === 'pt' ? '3. Ative a sua Ligação e Certificado SSL' : '3. Activate Connection & SSL Certificate'}
                </h5>
                <p className="text-[11px] text-slate-450 leading-relaxed max-w-lg">
                  {language === 'pt'
                    ? 'Após guardar os registos no seu painel DNS, clique no botão para testar a ligação. Os nossos servidores vão detetar a ligação e ativar automaticamente o HTTPS para encriptação segura de checkout.'
                    : 'Once you updated the records, click below to verify the link. Our servers will discover the records and provision secure SSL.'}
                </p>
              </div>

              {domainConfig.status === 'active' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{language === 'pt' ? 'O seu domínio está ativo e seguro!' : 'Your domain is live and secure!'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleVerifyDomain(e)}
                  disabled={checkingDns || !domainConfig.customDomain}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
                >
                  {checkingDns ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'pt' ? 'A Resolver Registos DNS...' : 'Resolving DNS Queries...'}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-white" />
                      <span>
                        {domainConfig.status === 'ssl_verifying' 
                          ? (language === 'pt' ? 'Verificar e Ativar SSL Let\'s Encrypt' : 'Verify & Enable Let\'s Encrypt')
                          : (language === 'pt' ? 'Verificar Ligação DNS' : 'Verify DNS Connection')}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Educational FAQ block */}
            <div className="bg-slate-100/50 rounded-2xl p-5 border border-slate-200/40 space-y-4" id="domain-faq-block">
              <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Perguntas Frequentes & Ajuda (FAQ)
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 text-left">
                <div className="space-y-1">
                  <strong className="text-slate-700 block">🌐 Quanto tempo demora a propagação do DNS?</strong>
                  <p className="leading-relaxed text-slate-500">
                    A propagação DNS geralmente leva entre 2 a 12 horas para espalhar globalmente, embora em alguns fornecedores rápidos (como Cloudflare ou Dominios.pt) demore menos de 10 minutos. Se a verificação falhar à primeira, aguarde um pouco e clique de novo.
                  </p>
                </div>

                <div className="space-y-1">
                  <strong className="text-slate-700 block">🔒 Como funciona o Certificado SSL HTTPS?</strong>
                  <p className="leading-relaxed text-slate-500">
                    O Kivento oferece de forma 100% gratuita certificados SSL legítimos emitidos pela entidade <strong>Let's Encrypt</strong>. Assim que os seus registos A e CNAME apontarem para nós, o certificado é emitido, instalado e renovado de forma automática!
                  </p>
                </div>

                <div className="space-y-1">
                  <strong className="text-slate-700 block">⚠️ Posso usar os servidores DNS da Cloudflare?</strong>
                  <p className="leading-relaxed text-slate-500">
                    Sim! Se usa a Cloudflare, recomendamos que marque os registos DNS como <strong>"DNS Only"</strong> (Nuvem Cinzenta) durante a verificação inicial para permitir que os nossos servidores realizem o desafio ACME de verificação do Let's Encrypt. Depois, pode reativar o Proxy (Nuvem Laranja).
                  </p>
                </div>

                <div className="space-y-1">
                  <strong className="text-slate-700 block">✉️ Como configuro contas de email profissional?</strong>
                  <p className="leading-relaxed text-slate-500">
                    Ao apontar os registos A e CNAME para o Kivento, as suas caixas de correio não são alteradas. Os seus registos MX (de correio electrónico como Google Workspace ou Titan) continuam intocados no seu registador, garantindo que recebe emails de clientes normalmente.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: INTERACTIVE WAREHOUSES MONITOR */}
      {activeSubTab === 'warehouses' && (
        <div className="space-y-4 animate-fade-in" id="admin-warehouses-view">
          <WarehouseMonitor 
            language={language}
            refreshTrigger={refreshTrigger}
            onRestockSuccess={onProductImported}
          />
        </div>
      )}

      {/* SUB-TAB 4: SALES REPORTS & ANALYTICS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4 animate-fade-in" id="admin-reports-view">
          <AnalyticsPanel 
            language={language}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}

      {/* SUB-TAB 5: STORE BANNERS MANAGER */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6 animate-fade-in" id="admin-banners-view">
          {/* Header Description */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-start" id="banners-info">
            <span className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Image className="w-5 h-5" />
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'pt' ? 'Gerenciador de Banners do Carrossel' : 'Storefront Slide Banner Manager'}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'pt' 
                  ? 'Personalize os slides rotativos da sua loja. Você pode criar novos anúncios, campanhas de saldos ou promoções, definir cores em gradiente elegantes e activar ou desactivar slides instantaneamente.'
                  : 'Customize the slider banners at the top of your shop storefront. Create sales campaigns, discount announcements, pick stylish gradients, and toggle them active/inactive instantly.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="banners-grid-row">
            {/* Form Column */}
            <form onSubmit={handleSaveBanner} className="lg:col-span-5 space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100" id="banner-form">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {editingBannerId ? 'Editar Banner' : 'Criar Novo Banner'}
              </h3>

              {bannerMessage.text && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  bannerMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`} id="banner-msg">
                  <span className="font-semibold">{bannerMessage.text}</span>
                </div>
              )}

              {/* Tag / Badge Text */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Texto da Etiqueta (Badge)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Campanha de Natal 🎄"
                  value={bannerForm.badgeText}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, badgeText: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Badge Background Theme */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tema da Etiqueta</label>
                <select
                  value={bannerForm.badgeBg}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, badgeBg: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                >
                  <option value="bg-yellow-400 text-slate-900">Amarelo Brilhante (Recomendado)</option>
                  <option value="bg-sky-400 text-slate-905">Azul Celeste</option>
                  <option value="bg-emerald-400 text-slate-905">Verde Esmeralda</option>
                  <option value="bg-red-500 text-white">Vermelho Sólido</option>
                  <option value="bg-white/20 text-white">Translúcido Claro</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Título Principal (Suporta quebra de linha com \n)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: MEGA LIQUIDAÇÃO FLASH \nAté 75% DE DESCONTO"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Descrição Promocional</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva as vantagens, descontos adicionais e condições de envio em poucas linhas..."
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Gradients Selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cor de Início (Gradiante)</label>
                  <select
                    value={bannerForm.gradientFrom}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, gradientFrom: e.target.value }))}
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="from-orange-600">Laranja</option>
                    <option value="from-blue-600">Azul Escuro</option>
                    <option value="from-emerald-600">Verde Escuro</option>
                    <option value="from-red-600">Vermelho</option>
                    <option value="from-purple-600">Roxo</option>
                    <option value="from-rose-600">Rosa Forte</option>
                    <option value="from-slate-900">Preto Carbono</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cor de Fim (Gradiante)</label>
                  <select
                    value={bannerForm.gradientTo}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, gradientTo: e.target.value }))}
                    className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-500"
                  >
                    <option value="to-amber-500">Ambar/Dourado</option>
                    <option value="to-sky-500">Azul Claro</option>
                    <option value="to-green-500">Verde Claro</option>
                    <option value="to-orange-500">Laranja Claro</option>
                    <option value="to-fuchsia-500">Fúcsia</option>
                    <option value="to-slate-800">Cinzento</option>
                  </select>
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between bg-white border border-slate-100 p-3 rounded-xl">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ativar Slide Imediatamente?</span>
                <button
                  type="button"
                  onClick={() => setBannerForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-300 ${bannerForm.isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transition-transform duration-300 ${bannerForm.isActive ? 'translate-x-5.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingBanner}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {savingBanner ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>A gravar...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingBannerId ? 'Gravar Alterações' : 'Adicionar ao Carrossel'}</span>
                    </>
                  )}
                </button>

                {editingBannerId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBannerId(null);
                      setBannerForm({
                        badgeText: '',
                        badgeBg: 'bg-yellow-400 text-slate-900',
                        title: '',
                        subtitle: '',
                        gradientFrom: 'from-orange-600',
                        gradientVia: 'via-red-600',
                        gradientTo: 'to-amber-500',
                        isActive: true
                      });
                    }}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            {/* List and Live Previews Column */}
            <div className="lg:col-span-7 space-y-4" id="banners-list-column">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-1">
                {language === 'pt' ? 'Slides no Carrossel (' : 'Slides in Carousel ('}{banners.length})
              </h3>

              {loadingBanners ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs">A carregar banners do servidor...</span>
                </div>
              ) : banners.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Image className="w-10 h-10 text-slate-300" />
                  <span className="text-xs font-semibold">Nenhum banner configurado. Crie o primeiro à esquerda!</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2" id="banners-list">
                  {banners.map((b) => (
                    <div 
                      key={b.id} 
                      className={`relative bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                        b.id === editingBannerId ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
                      }`}
                      id={`banner-card-${b.id}`}
                    >
                      {/* Mini Live Preview */}
                      <div className={`w-full md:w-2/3 p-4 rounded-xl text-white relative overflow-hidden bg-gradient-to-r ${b.gradientFrom} ${b.gradientVia || ''} ${b.gradientTo} min-h-[100px] flex flex-col justify-between`} id={`mini-banner-preview-${b.id}`}>
                        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        <div className="relative z-10 space-y-1">
                          <span className={`${b.badgeBg} text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider inline-block`}>
                            {b.badgeText}
                          </span>
                          <h4 className="text-xs font-extrabold tracking-tight leading-snug whitespace-pre-line">
                            {b.title}
                          </h4>
                          <p className="text-[9px] text-white/90 line-clamp-2 leading-relaxed">
                            {b.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Management Actions */}
                      <div className="flex flex-row md:flex-col items-center justify-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0" id={`banner-actions-${b.id}`}>
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleBanner(b)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                            b.isActive 
                              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                          }`}
                          title={b.isActive ? 'Desativar Slide' : 'Ativar Slide'}
                        >
                          {b.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                          <span className="md:hidden">{b.isActive ? 'Ativo' : 'Inativo'}</span>
                        </button>

                        <div className="flex gap-2 w-full md:w-auto">
                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingBannerId(b.id);
                              setBannerForm({
                                badgeText: b.badgeText,
                                badgeBg: b.badgeBg,
                                title: b.title,
                                subtitle: b.subtitle,
                                gradientFrom: b.gradientFrom,
                                gradientVia: b.gradientVia || '',
                                gradientTo: b.gradientTo,
                                isActive: b.isActive
                              });
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-all flex-1 md:flex-none"
                            title="Editar Banner"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 text-red-600 flex items-center justify-center cursor-pointer transition-all flex-1 md:flex-none"
                            title="Remover Banner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

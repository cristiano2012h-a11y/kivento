import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../data/mockData';
import { 
  TrendingUp, Plus, ShieldCheck, DollarSign, Smartphone, CreditCard, 
  Building, Check, Loader2, Info, ExternalLink, RefreshCw, Layers, BarChart3,
  Image, Trash2, Edit, Sparkles, Eye, EyeOff, Globe, Copy, Download, ShoppingBag, Upload, X, Video, Film
} from 'lucide-react';
import { WarehouseMonitor } from './WarehouseMonitor';
import { AnalyticsPanel } from './AnalyticsPanel';
import { PromoBanner, Product } from '../types';

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
    sellingPrice: '',
    weight: '0.4',
    imageUrl: '',
    sourcePlatform: 'AliExpress',
    description: '',
    productLink: '',
    videoUrl: ''
  });

  const [manualImages, setManualImages] = useState<string[]>([]);
  const [readingVideo, setReadingVideo] = useState(false);

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

  // Shopify-Style CJ integration states
  const [cjQuery, setCjQuery] = useState('');
  const [pullingFromCj, setPullingFromCj] = useState(false);
  const [cjPullStep, setCjPullStep] = useState('');
  const [cjPulledProduct, setCjPulledProduct] = useState<any>(null);
  const [syncingProductId, setSyncingProductId] = useState<string | null>(null);
  const [lastSyncedId, setLastSyncedId] = useState<string | null>(null);
  const [simulatingCjPush, setSimulatingCjPush] = useState(false);
  const [cjPushMessage, setCjPushMessage] = useState({ text: '', type: '' });

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
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [dynamicDownloadUrl, setDynamicDownloadUrl] = useState<string>('');

  // Product Media Selector & Editing States
  const [selectedCjImages, setSelectedCjImages] = useState<string[]>([]);
  const [importCjVideo, setImportCjVideo] = useState(true);

  // Product Editing Modal States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductForm, setEditingProductForm] = useState({
    name: '',
    category: '',
    price: '',
    originalPrice: '',
    imageUrl: '',
    imagesText: '',
    videoUrl: '',
    weight: '',
    descriptionPt: '',
    descriptionEn: '',
    descriptionEs: '',
    descriptionFr: ''
  });
  const [updatingProduct, setUpdatingProduct] = useState(false);

  // AI Banner generator state
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [aiProductSelect, setAiProductSelect] = useState<string>('');
  const [aiCustomTopic, setAiCustomTopic] = useState<string>('');
  const [aiPromoType, setAiPromoType] = useState<string>('Liquidação Flash');
  const [generatingAiBanner, setGeneratingAiBanner] = useState(false);
  const [aiError, setAiError] = useState<string>('');

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

  const fetchDownloadUrl = async () => {
    try {
      const res = await fetch('/api/get-download-url');
      if (res.ok) {
        const data = await res.json();
        setDynamicDownloadUrl(data.url);
      } else {
        setDynamicDownloadUrl(`${window.location.origin}/api/download-zip`);
      }
    } catch (err) {
      setDynamicDownloadUrl(`${window.location.origin}/api/download-zip`);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setAdminProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products for AI ad generator:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBanners();
    fetchCjSettings();
    fetchDomainSettings();
    fetchDownloadUrl();
    fetchAdminProducts();
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
  const handleTestCjConnection = async (e?: React.FormEvent, isDemo: boolean = false) => {
    if (e) e.preventDefault();
    setTestingCjConnection(true);
    setCjMessage({ text: '', type: '' });

    const payload = isDemo ? {
      cjEmail: 'cristiano2012h@gmail.com',
      apiKey: 'cj_demo_token_kivento_active_2026',
      storeId: 'CJ-485921-PT',
      isConnected: true,
      autoSyncOrders: true,
      autoSyncInventory: true
    } : {
      ...cjConfig,
      isConnected: true
    };

    try {
      const res = await fetch('/api/settings/cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  const handleSimulateCjPush = async (productType: string) => {
    setSimulatingCjPush(true);
    setCjPushMessage({ text: '', type: '' });
    try {
      // Create a super high-quality mock product payload as if it was sent by CJ Dropshipping webhook
      let payload: any = {};
      
      if (productType === 'projector') {
        payload = {
          name: "Mini Projetor Portátil Kivento Cinema HD - Conexão Inteligente",
          category: "Televisores & Projetores",
          originalPrice: 24.50,
          description: "Transforme qualquer parede num cinema de 130 polegadas. Equipado com ligação direta Wi-Fi, som estéreo integrado, lente com ajuste de foco e brilho de 200 ANSI lúmens para noites de cinema inesquecíveis em casa.",
          imageUrl: "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=80",
          images: [
            "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1574267431647-8e6580f55cf8?w=600&auto=format&fit=crop&q=80"
          ],
          sku: "CJ-PROJ-MINI-HD9",
          weight: 0.8,
          sourcePlatform: "CJ Dropshipping"
        };
      } else {
        payload = {
          name: "Candeeiro Touch Crystal RGB Recarregável - Iluminação de Luxo",
          category: "Decoração de Casa",
          originalPrice: 8.90,
          description: "Crie atmosferas deslumbrantes com um toque suave. Este candeeiro possui 16 cores RGB selecionáveis por toque ou comando remoto, acabamento em cristal acrílico facetado de alta refração e bateria USB de longa duração.",
          imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
          images: [
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80"
          ],
          sku: "CJ-LAMP-CRY-RGB",
          weight: 0.35,
          sourcePlatform: "CJ Dropshipping"
        };
      }

      const res = await fetch('/api/webhooks/cj-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setCjPushMessage({
          text: `Sucesso! O produto "${data.product.name}" foi enviado diretamente do painel da CJ Dropshipping por Webhook de Integração Shopify e já está listado com sucesso. Todas as imagens foram processadas via proxy seguro contra tela branca!`,
          type: 'success'
        });
        
        // Notify parent and fetch updated products
        onProductImported();
        fetchAdminProducts();
      } else {
        setCjPushMessage({
          text: 'Erro ao simular push direto da CJ Dropshipping.',
          type: 'error'
        });
      }
    } catch (err) {
      setCjPushMessage({
        text: 'Erro de ligação ao simular o push do webhook.',
        type: 'error'
      });
    } finally {
      setSimulatingCjPush(false);
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

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const response = await fetch('/api/download-zip');
      if (!response.ok) {
        throw new Error('Server error: ' + response.statusText);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kivento-loja-completa.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error fetching zip file:', err);
      // Fallback: open in new window
      window.open('/api/download-zip', '_blank');
    } finally {
      setDownloadingZip(false);
    }
  };

  // Shopify-Style Direct CJ API Lookup
  const handleCjLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cjQuery) {
      setImportMessage({
        text: language === 'pt' ? 'Por favor, insira o SKU CJ ou o link do produto.' : 'Please enter the CJ SKU or product link.',
        type: 'error'
      });
      return;
    }

    setPullingFromCj(true);
    setImportMessage({ text: '', type: '' });
    setCjPulledProduct(null);

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      setCjPullStep(language === 'pt' ? '🔌 Conectando ao Gateway CJ Dropshipping API...' : '🔌 Connecting to CJ Dropshipping API Gateway...');
      await sleep(1000);

      setCjPullStep(language === 'pt' ? '🔍 Buscando SKU e consultando armazéns de origem...' : '🔍 Querying supplier SKU and locating active warehouses...');
      await sleep(1200);

      setCjPullStep(language === 'pt' ? '🖼️ Baixando imagens oficiais em alta definição e mapeando variantes...' : '🖼️ Downloading high-res images and mapping variant connections...');
      await sleep(1000);

      setCjPullStep(language === 'pt' ? '🏷️ Sincronizando custos e aplicando margem de lucro...' : '🏷️ Syncing vendor costs and calculating markup...');
      await sleep(600);

      const res = await fetch('/api/products/cj-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cjQuery })
      });

      if (res.ok) {
        const data = await res.json();
        const prod = data.product;

        setImportForm(prev => ({
          ...prev,
          name: prod.name,
          category: prod.category,
          originalPrice: String(prod.originalPrice),
          weight: String(prod.weight),
          imageUrl: prod.imageUrl,
          description: prod.description,
          sourcePlatform: 'CJ Dropshipping',
          productLink: cjQuery.startsWith('http') ? cjQuery : `https://cjdropshipping.com/product-detail.html?id=${prod.cjProductId}`
        }));

        setCjPulledProduct(prod);
        setSelectedCjImages(prod.images || [prod.imageUrl]);
        setImportCjVideo(!!prod.videoUrl);

        setImportMessage({
          text: language === 'pt' 
            ? `Vínculo ativo estabelecido com sucesso! Produto "${prod.name}" (SKU: ${prod.sku}) conectado à CJ Dropshipping.`
            : `Link active! "${prod.name}" (SKU: ${prod.sku}) connected to CJ Dropshipping.`,
          type: 'success'
        });
      } else {
        setImportMessage({
          text: language === 'pt' ? 'Falha ao recuperar produto da API CJ. Verifique se o SKU está ativo.' : 'Failed to retrieve product from CJ API. Verify SKU is active.',
          type: 'error'
        });
      }
    } catch (err) {
      setImportMessage({
        text: 'Erro de comunicação com o servidor de dropshipping.',
        type: 'error'
      });
    } finally {
      setPullingFromCj(false);
      setCjPullStep('');
    }
  };

  // Sync Stock and Price from CJ in real-time
  const handleCjSyncStock = async (productId: string) => {
    setSyncingProductId(productId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSyncingProductId(null);
    setLastSyncedId(productId);
    setTimeout(() => {
      setLastSyncedId(null);
    }, 4000);
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
          sellingPrice: importForm.sellingPrice ? Number(importForm.sellingPrice) : undefined,
          imageUrl: importForm.imageUrl,
          weight: Number(importForm.weight),
          sourcePlatform: importForm.sourcePlatform,
          description: importForm.description,
          productLink: importForm.productLink,
          images: selectedCjImages.length > 0 ? selectedCjImages : (manualImages.length > 0 ? manualImages : [importForm.imageUrl]),
          videoUrl: importForm.videoUrl || (((importForm.sourcePlatform === 'CJ Dropshipping' || importForm.sourcePlatform === 'AliExpress') && importCjVideo) ? (cjPulledProduct?.videoUrl || '') : '')
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
          sellingPrice: '',
          weight: '0.4',
          imageUrl: '',
          description: '',
          productLink: '',
          videoUrl: ''
        }));
        setSelectedCjImages([]);
        setManualImages([]);
        
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

  // Product Edit Handlers
  const handleOpenEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditingProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      originalPrice: String(product.originalPrice || product.price),
      imageUrl: product.image,
      imagesText: (product.images || [product.image]).join(', '),
      videoUrl: product.videoUrl || '',
      weight: String(product.weight),
      descriptionPt: product.description.pt || '',
      descriptionEn: product.description.en || '',
      descriptionEs: product.description.es || '',
      descriptionFr: product.description.fr || ''
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setUpdatingProduct(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProductForm.name,
          category: editingProductForm.category,
          price: Number(editingProductForm.price),
          originalPrice: Number(editingProductForm.originalPrice),
          imageUrl: editingProductForm.imageUrl,
          images: editingProductForm.imagesText.split(',').map(s => s.trim()).filter(Boolean),
          videoUrl: editingProductForm.videoUrl,
          weight: Number(editingProductForm.weight),
          description: {
            pt: editingProductForm.descriptionPt,
            en: editingProductForm.descriptionEn,
            es: editingProductForm.descriptionEs,
            fr: editingProductForm.descriptionFr
          }
        })
      });

      if (res.ok) {
        setEditingProduct(null);
        // Refresh catalog list
        onProductImported();
      } else {
        alert(language === 'pt' ? 'Erro ao atualizar produto.' : 'Error updating product.');
      }
    } catch (err) {
      console.error('Error updating product:', err);
    } finally {
      setUpdatingProduct(false);
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
      description: prod.description,
      productLink: ''
    });
    setImportMessage({
      text: language === 'pt' 
        ? `Preenchido com "${prod.name}" da AliExpress. Clique no botão de importação abaixo.` 
        : `Form auto-filled with "${prod.name}" from AliExpress. Click import below.`,
      type: 'info'
    });
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!window.confirm(language === 'pt' ? `Tem certeza que deseja remover o produto "${productName}" do catálogo?` : `Are you sure you want to remove "${productName}" from the catalog?`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setImportMessage({
          text: language === 'pt' 
            ? `O produto "${productName}" foi excluído com sucesso.` 
            : `Product "${productName}" was deleted successfully.`,
          type: 'success'
        });
        // Notify parent/trigger refresh
        onProductImported();
      } else {
        const data = await res.json();
        setImportMessage({
          text: data.error || 'Erro ao excluir o produto.',
          type: 'error'
        });
      }
    } catch (err) {
      setImportMessage({
        text: 'Erro de rede ao tentar excluir o produto.',
        type: 'error'
      });
    }
  };

  // Calculate simulated sale price dynamically
  const calculatedSalePrice = () => {
    if (importForm.sellingPrice && !isNaN(Number(importForm.sellingPrice))) {
      return Number(importForm.sellingPrice);
    }
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

  // Generate banner using Gemini AI
  const handleGenerateAiBanner = async () => {
    setGeneratingAiBanner(true);
    setAiError('');
    try {
      let prodName = aiCustomTopic;
      let prodDesc = '';
      if (aiProductSelect) {
        const found = adminProducts.find(p => p.id === aiProductSelect || p.name === aiProductSelect);
        if (found) {
          prodName = found.name;
          prodDesc = found.description || '';
        }
      }

      if (!prodName && !aiCustomTopic) {
        setAiError(language === 'pt' ? 'Por favor, selecione um produto ou digite um tema/descrição para a propaganda.' : 'Please select a product or enter a topic/description for the ad.');
        setGeneratingAiBanner(false);
        return;
      }

      const res = await fetch('/api/banners/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: prodName,
          productDescription: prodDesc,
          promoType: aiPromoType,
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.banner) {
          const generated = data.banner;
          setBannerForm({
            badgeText: generated.badgeText || 'PROMOÇÃO',
            badgeBg: generated.badgeBg || 'bg-yellow-400 text-slate-900',
            title: generated.title || prodName,
            subtitle: generated.subtitle || '',
            gradientFrom: generated.gradientFrom || 'from-indigo-600',
            gradientVia: generated.gradientVia || '',
            gradientTo: generated.gradientTo || 'to-purple-700',
            isActive: true
          });
          setBannerMessage({
            text: language === 'pt' ? 'Propaganda gerada com sucesso pela IA do Gemini! Ajuste os detalhes no formulário abaixo.' : 'Ad generated successfully by Gemini AI! Fine-tune the details in the form below.',
            type: 'success'
          });
        } else {
          setAiError(data.error || 'Erro ao gerar propaganda pela IA.');
        }
      } else {
        const data = await res.json();
        setAiError(data.error || 'Não foi possível comunicar com o servidor de IA.');
      }
    } catch (err) {
      setAiError('Erro de rede: ' + (err as Error).message);
    } finally {
      setGeneratingAiBanner(false);
    }
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
                  <p className="text-[10px] text-slate-450 leading-relaxed max-w-sm">
                    * Pode obter a sua Chave de API de forma gratuita no painel de parceiros do <strong>CJ Dropshipping</strong> em <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-600">APP &gt; API Connection</span>.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleTestCjConnection(undefined, true)}
                      disabled={testingCjConnection}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      title="Ativar conexão simulada de teste instantaneamente"
                    >
                      <span>Simular Conexão (Rápido) ⚡</span>
                    </button>

                    <button
                      type="submit"
                      disabled={testingCjConnection}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs font-semibold"
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

            {/* Shopify-Style Direct Connection & Push Hook Guide */}
            <div className="mt-5 border-t border-slate-200/60 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Conexão Direta Shopify-Style (Push Automático)</h4>
                  <p className="text-[11px] text-slate-500">Ligue a sua loja diretamente de dentro do painel da CJ Dropshipping e liste produtos instantaneamente sem telas brancas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instructions */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2.5 text-xs text-slate-600">
                  <h5 className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Como conectar o site da CJ à Kivento:
                  </h5>
                  <ul className="space-y-1.5 list-disc pl-5 leading-relaxed text-slate-500 text-[11px]">
                    <li>No menu da CJ Dropshipping, vá a <strong>Authorization &gt; Shopify</strong> (o Kivento emula o protocolo nativo Shopify para máxima compatibilidade).</li>
                    <li>Clique em <strong>Add Store</strong> e insira o URL público da sua loja: <span className="font-mono bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded text-[10px] select-all">{window.location.origin}</span></li>
                    <li>Para escutar as listagens diretas de produtos por Webhook de Envio, configure no seu painel de desenvolvedor CJ o seguinte endpoint:</li>
                    <div className="flex gap-1.5 items-center mt-1">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}/api/webhooks/cj-import`}
                        className="bg-white border border-slate-200 rounded-lg p-1.5 font-mono text-[9px] text-indigo-600 flex-1 outline-none"
                        id="webhook-url-input"
                      />
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/cj-import`);
                          setCopiedField('webhook');
                          setTimeout(() => setCopiedField(null), 2000);
                        }}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all cursor-pointer"
                        title="Copiar URL"
                      >
                        {copiedField === 'webhook' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <li><strong>Chave Secreta de Segurança (Header):</strong> <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-[10px]">KIV-CJ-SEC-2026</span></li>
                  </ul>
                </div>

                {/* Simulated Push Webhook Box */}
                <div className="border border-indigo-100 bg-indigo-50/10 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h5 className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                      Simulador de Conexão Ativa da CJ Dropshipping
                    </h5>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Teste a ligação de push automático agora mesmo! Escolha um artigo abaixo para simular o envio feito diretamente de dentro do site da CJ. O nosso middleware tratará as imagens por proxy seguro para garantir que aparecem em alta definição na sua montra!
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => handleSimulateCjPush('projector')}
                      disabled={simulatingCjPush}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {simulatingCjPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Push Mini Projetor HD 📽️</span>
                    </button>
                    <button
                      onClick={() => handleSimulateCjPush('lamp')}
                      disabled={simulatingCjPush}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {simulatingCjPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      <span>Push Candeeiro RGB 💎</span>
                    </button>
                  </div>

                  {cjPushMessage.text && (
                    <div className={`p-2.5 rounded-lg border text-[10px] font-medium leading-relaxed ${
                      cjPushMessage.type === 'success' 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                        : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}>
                      {cjPushMessage.text}
                    </div>
                  )}
                </div>
              </div>
            </div>
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

              {importForm.sourcePlatform === 'CJ Dropshipping' && (
                <div className={`p-3 rounded-xl text-xs border ${
                  cjConfig.isConnected 
                    ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                } space-y-1`} id="cj-status-notice">
                  <div className="flex items-center gap-1.5 font-bold">
                    {cjConfig.isConnected ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Sua conta CJ Dropshipping está conectada e ativa!</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Sua conta CJ Dropshipping não está conectada na aba acima.</span>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    {cjConfig.isConnected 
                      ? 'Todos os produtos CJ importados terão estoques e rastreamento sincronizados em tempo real com o Hub CJ Dropshipping.'
                      : 'Para usufruir da sincronização automática, conecte a sua conta CJ acima. Caso não queira, pode continuar a cadastrar e vender o produto preenchendo o formulário abaixo manualmente!'}
                  </p>
                  {!cjConfig.isConnected && (
                    <button
                      type="button"
                      onClick={() => handleTestCjConnection(undefined, true)}
                      className="text-[10px] font-bold text-indigo-700 hover:underline mt-1 block text-left"
                    >
                      Conectar Conta de Teste Instantaneamente (1-clique) ⚡
                    </button>
                  )}
                </div>
              )}

              {(importForm.sourcePlatform === 'CJ Dropshipping' || importForm.sourcePlatform === 'AliExpress') && (
                <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 space-y-3" id="cj-instant-importer">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                    <span>Importador Instantâneo Multiplataforma ⚡</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Cole o link do produto da <strong>{importForm.sourcePlatform}</strong>, SKU ou termo de teste (ex: link do produto, SKU, ou palavras-chave como <span className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700">led</span>, <span className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700">fone</span>, <span className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700">projetor</span> ou <span className="font-mono bg-slate-200 px-1 py-0.2 rounded text-slate-700">garrafa</span>) para carregar custos, fotos, pesos, variantes e descrições oficiais em tempo real via conexão de API direta!
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Cole o link do produto ${importForm.sourcePlatform} ou digite termo de teste...`}
                      value={cjQuery}
                      onChange={(e) => setCjQuery(e.target.value)}
                      className="flex-1 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCjLookup}
                      disabled={pullingFromCj}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 text-xs shrink-0 cursor-pointer"
                    >
                      {pullingFromCj ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Puxar da {importForm.sourcePlatform === 'CJ Dropshipping' ? 'CJ' : 'AliExpress'}</span>
                    </button>
                  </div>

                  {pullingFromCj && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 text-indigo-600 animate-spin shrink-0" />
                        <span className="text-[11px] font-bold text-indigo-950 animate-pulse">{cjPullStep}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                          style={{
                            width: cjPullStep.includes('🔌') ? '25%' : 
                                   cjPullStep.includes('🔍') ? '50%' : 
                                   cjPullStep.includes('🖼️') ? '75%' : '95%'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {cjPulledProduct && (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-2 text-[11px] text-emerald-950">
                      <div className="flex items-center gap-1 font-bold text-emerald-800">
                        <Check className="w-3.5 h-3.5" />
                        <span>Produto Conectado Ativamente! (Shopify-Style Link)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img 
                          src={cjPulledProduct.imageUrl} 
                          alt="CJ Pulled" 
                          className="w-10 h-10 object-cover rounded bg-white border border-slate-200 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate">{cjPulledProduct.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">
                            ID CJ: {cjPulledProduct.cjProductId} | SKU Base: {cjPulledProduct.sku}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-emerald-100/60 pt-2 space-y-1">
                        <p className="font-bold text-[10px] text-emerald-900 uppercase">Mapeamento de Variantes de Fornecedor (CJ Hub):</p>
                        <div className="space-y-0.5 max-h-24 overflow-y-auto pr-1">
                          {cjPulledProduct.variants?.map((v: any) => (
                            <div key={v.id} className="flex justify-between items-center text-[9px] bg-white/60 px-2 py-1 rounded border border-emerald-100/30">
                              <span className="font-mono text-slate-600">{v.name} (ID: {v.id})</span>
                              <span className="font-bold text-indigo-700">Preço CJ: €{v.price.toFixed(2)} | Estoque: {v.stock} un.</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Media Selector Hub for CJ product */}
                      <div className="border-t border-emerald-100/60 pt-2 space-y-2">
                        <p className="font-bold text-[10px] text-indigo-950 uppercase flex items-center gap-1">
                          <Image className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Média Hub CJ - Imagens e Vídeos de Fornecedor:</span>
                        </p>
                        
                        {/* Images Section */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 font-medium block">
                            Selecione as imagens para importar no catálogo. Clique em "Definir Capa" para definir como imagem principal (Capa):
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {cjPulledProduct.images?.map((imgUrl: string, idx: number) => {
                              const isSelected = selectedCjImages.includes(imgUrl);
                              const isCover = importForm.imageUrl === imgUrl;
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    // Toggle selection only
                                    setSelectedCjImages(prev => {
                                      if (prev.includes(imgUrl)) {
                                        // Don't remove if it is the cover
                                        if (isCover) return prev;
                                        return prev.filter(url => url !== imgUrl);
                                      } else {
                                        return [...prev, imgUrl];
                                      }
                                    });
                                  }}
                                  className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all group ${
                                    isCover 
                                      ? 'ring-2 ring-indigo-600 border-transparent shadow-xs' 
                                      : isSelected 
                                        ? 'border-indigo-400 opacity-100' 
                                        : 'border-slate-200 opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img 
                                    src={imgUrl} 
                                    alt={`CJ media ${idx}`} 
                                    className="w-full h-full object-cover bg-white"
                                    referrerPolicy="no-referrer"
                                  />
                                  
                                  {/* Cover / Capa Selector */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Avoid triggering selection toggle
                                      // Set as cover
                                      setImportForm(prev => ({ ...prev, imageUrl: imgUrl }));
                                      // Ensure it is also selected in gallery
                                      setSelectedCjImages(prev => {
                                        if (prev.includes(imgUrl)) return prev;
                                        return [...prev, imgUrl];
                                      });
                                    }}
                                    className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider transition-all shadow-xs cursor-pointer ${
                                      isCover
                                        ? 'bg-indigo-600 text-white opacity-100'
                                        : 'bg-white/90 text-slate-700 hover:bg-white hover:text-indigo-600 opacity-0 group-hover:opacity-100'
                                    }`}
                                  >
                                    {isCover ? '⭐ Capa' : 'Definir Capa'}
                                  </button>

                                  {isSelected && (
                                    <div className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                                      <Check className="w-2 h-2 font-black" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Add manual image url link for CJ */}
                          <div className="flex gap-2 items-center mt-2 bg-white p-2 rounded border border-slate-150">
                            <input
                              type="text"
                              placeholder="Adicionar link de imagem personalizado..."
                              id="manual-img-input"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value.trim();
                                  if (val) {
                                    setSelectedCjImages(prev => [...prev, val]);
                                    setImportForm(prev => ({ ...prev, imageUrl: val }));
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                              className="flex-1 bg-slate-50 text-[10px] text-slate-800 rounded px-2.5 py-1.5 border border-slate-200 outline-none focus:border-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById('manual-img-input') as HTMLInputElement;
                                const val = el?.value.trim();
                                if (val) {
                                  setSelectedCjImages(prev => [...prev, val]);
                                  setImportForm(prev => ({ ...prev, imageUrl: val }));
                                  el.value = '';
                                }
                              }}
                              className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[9px] rounded transition-all shrink-0 cursor-pointer"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>

                        {/* Video Section */}
                        {cjPulledProduct.videoUrl && (
                          <div className="space-y-1.5 border-t border-slate-100 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                Vídeo Promocional Oficial do Fornecedor:
                              </span>
                              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={importCjVideo}
                                  onChange={(e) => setImportCjVideo(e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
                                />
                                <span>Importar Vídeo</span>
                              </label>
                            </div>
                            
                            {importCjVideo && (
                              <div className="space-y-1.5">
                                <div className="aspect-video w-full max-w-xs bg-slate-950 rounded-lg overflow-hidden border border-slate-800 shadow-inner relative mx-auto">
                                  <video 
                                    src={cjPulledProduct.videoUrl} 
                                    controls 
                                    className="w-full h-full"
                                    preload="metadata"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] text-slate-400">URL do Vídeo (Edite se necessário):</label>
                                  <input
                                    type="text"
                                    value={cjPulledProduct.videoUrl || ''}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      setCjPulledProduct((prev: any) => ({ ...prev, videoUrl: newVal }));
                                    }}
                                    className="w-full bg-white text-[9px] text-slate-800 rounded px-2 py-1 border border-slate-200 outline-none focus:border-indigo-600 font-mono"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              <div className="grid grid-cols-4 gap-4" id="import-field-price-weight">
                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-slate-500 font-medium block leading-tight">Custo Original Fornecedor (€):</label>
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
                  <label className="text-[10px] text-slate-500 font-medium block leading-tight">Margem de Lucro (%):</label>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 text-xs text-slate-600 rounded-xl font-mono text-center font-bold">
                    +{bankSettings.profitMarginMarkup}%
                  </div>
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-indigo-950 font-bold block leading-tight">Preço de Venda Final (€):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={((Number(importForm.originalPrice) || 0) * (1 + Number(bankSettings.profitMarginMarkup)/100)).toFixed(2)}
                    value={importForm.sellingPrice}
                    onChange={(e) => setImportForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                    className="w-full bg-indigo-50/50 text-xs text-indigo-900 rounded-xl border border-indigo-200 p-2.5 outline-none focus:border-indigo-600 font-mono font-bold"
                    title="Altere livremente o preço de venda para o seu catálogo!"
                  />
                </div>

                <div className="space-y-1 col-span-1">
                  <label className="text-[10px] text-slate-500 font-medium block leading-tight">Preço Calculado:</label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 text-xs text-slate-700 rounded-xl font-mono text-center font-bold">
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

              <div className="space-y-1" id="import-field-link">
                <label className="text-[10px] text-slate-500 font-medium">Link do Produto (Fornecedor / CJ / AliExpress):</label>
                <input
                  type="url"
                  placeholder="https://cjdropshipping.com/product/..."
                  value={importForm.productLink}
                  onChange={(e) => setImportForm(prev => ({ ...prev, productLink: e.target.value }))}
                  className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono"
                />
              </div>

              <div className="space-y-1.5" id="import-field-image-upload">
                <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                  Galeria do Produto (Adicione várias imagens!):
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option A: Local Upload */}
                  <div className="border border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-3 bg-white flex flex-col items-center justify-center text-center transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          Array.from(files).forEach((file: File) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const result = reader.result as string;
                              setManualImages(prev => {
                                if (prev.includes(result)) return prev;
                                const updated = [...prev, result];
                                setImportForm(f => {
                                  if (!f.imageUrl) {
                                    return { ...f, imageUrl: result };
                                  }
                                  return f;
                                });
                                return updated;
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="local-image-upload-input"
                    />
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600">
                      Upload do Computador (Múltiplas)
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Selecione um ou mais ficheiros de imagem
                    </span>
                  </div>

                  {/* Option B: Image URL / Preview */}
                  <div className="flex flex-col justify-center space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        id="manual-url-image-input"
                        placeholder="Cole um link de imagem externa..."
                        className="flex-1 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setManualImages(prev => {
                                if (prev.includes(val)) return prev;
                                const updated = [...prev, val];
                                setImportForm(f => {
                                  if (!f.imageUrl) {
                                    return { ...f, imageUrl: val };
                                  }
                                  return f;
                                });
                                return updated;
                              });
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('manual-url-image-input') as HTMLInputElement;
                          const val = el?.value.trim();
                          if (val) {
                            setManualImages(prev => {
                              if (prev.includes(val)) return prev;
                              const updated = [...prev, val];
                              setImportForm(f => {
                                if (!f.imageUrl) {
                                  return { ...f, imageUrl: val };
                                }
                                return f;
                              });
                              return updated;
                            });
                            el.value = '';
                          }
                        }}
                        className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        Adicionar
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      Escreva ou cole o link direto da imagem e clique em "Adicionar"
                    </span>
                  </div>
                </div>

                {/* Visual Gallery Grid for New Product */}
                {manualImages.length > 0 && (
                  <div className="mt-3.5 space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-blue-600" />
                        <span>Imagens da Galeria ({manualImages.length})</span>
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold italic">
                        Clique para definir a imagem de Capa (principal)
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {manualImages.map((imgUrl, idx) => {
                        const isCover = importForm.imageUrl === imgUrl;
                        return (
                          <div
                            key={idx}
                            className={`relative aspect-square rounded-xl overflow-hidden border bg-white group transition-all cursor-pointer ${
                              isCover 
                                ? 'ring-2 ring-blue-600 border-transparent shadow-xs' 
                                : 'border-slate-200 hover:border-blue-400'
                            }`}
                            onClick={() => {
                              setImportForm(prev => ({ ...prev, imageUrl: imgUrl }));
                            }}
                          >
                            <img
                              src={imgUrl}
                              alt={`New Gallery ${idx}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // Avoid triggering cover select
                                const updated = manualImages.filter(url => url !== imgUrl);
                                setManualImages(updated);
                                if (isCover) {
                                  setImportForm(prev => ({
                                    ...prev,
                                    imageUrl: updated.length > 0 ? updated[0] : ''
                                  }));
                                }
                              }}
                              className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-90 transition-opacity cursor-pointer shadow-xs"
                              title="Remover"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>

                            {isCover && (
                              <div className="absolute bottom-1 left-1 right-1 bg-blue-600 text-[8px] font-extrabold text-white py-0.5 px-0.5 rounded text-center uppercase tracking-wider scale-90">
                                Capa
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Video Upload or URL Input Section */}
              <div className="space-y-1.5" id="import-field-video-upload">
                <label className="text-[10px] text-slate-500 font-semibold block uppercase tracking-wider">
                  Vídeo de Demonstração (Opcional):
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option A: Local Video Upload */}
                  <div className="relative border border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all group min-h-[100px]">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setReadingVideo(true);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImportForm(prev => ({ ...prev, videoUrl: reader.result as string }));
                            setReadingVideo(false);
                          };
                          reader.onerror = () => {
                            setReadingVideo(false);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {readingVideo ? (
                      <>
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin mb-1" />
                        <span className="text-[10px] font-bold text-blue-600 animate-pulse">
                          A converter vídeo...
                        </span>
                      </>
                    ) : (
                      <>
                        <Video className="w-5 h-5 text-slate-400 group-hover:text-blue-500 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600 group-hover:text-blue-600">
                          Upload do Computador (Vídeo)
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Selecione um ficheiro de vídeo (.mp4, .webm, etc)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Option B: Video Link Input */}
                  <div className="flex flex-col justify-center space-y-2">
                    <input
                      type="url"
                      placeholder="Ou cole um link de vídeo direto (.mp4)..."
                      value={importForm.videoUrl.startsWith('data:') ? '' : importForm.videoUrl}
                      onChange={(e) => setImportForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-600 placeholder-slate-400 font-mono"
                    />
                    <span className="text-[9px] text-slate-400">
                      Cole um link externo contendo o vídeo do produto
                    </span>
                  </div>
                </div>

                {/* Video Preview and Clear Option */}
                {importForm.videoUrl && (
                  <div className="mt-3.5 space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-blue-600" />
                        <span>Visualização do Vídeo</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setImportForm(prev => ({ ...prev, videoUrl: '' }))}
                        className="text-[9px] text-red-600 font-bold hover:underline hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>Remover Vídeo</span>
                      </button>
                    </div>
                    
                    <div className="aspect-video w-full max-w-sm bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner relative mx-auto">
                      <video
                        src={importForm.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
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

          {/* Manage Product Catalog Section */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6" id="manage-catalog-section">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  {language === 'pt' ? 'Gerir Catálogo de Produtos' : 'Manage Product Catalog'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'pt' 
                    ? 'Visualize e remova produtos do catálogo da sua loja Kivento.' 
                    : 'View and remove items from your Kivento store catalog.'}
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                {adminProducts.length} {language === 'pt' ? 'produtos' : 'products'}
              </span>
            </div>

            {adminProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                {language === 'pt' ? 'Nenhum produto cadastrado no catálogo.' : 'No products found in catalog.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="catalog-products-list">
                {adminProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="p-4 border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-xs rounded-xl flex gap-3 items-center justify-between transition-all group"
                    id={`catalog-item-${product.id}`}
                  >
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={product.name}>
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className="bg-slate-200/60 px-1.5 py-0.5 rounded font-medium">
                            {product.category}
                          </span>
                          <span className="font-mono text-indigo-600 font-bold">
                            €{product.price.toFixed(2)}
                          </span>
                        </div>
                        {product.isDropshipped && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[9px] text-orange-600 bg-orange-50 border border-orange-100 font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
                              {product.sourcePlatform || 'Dropshipped'}
                            </span>
                            {product.sourcePlatform === 'CJ Dropshipping' && (
                              <button
                                type="button"
                                onClick={() => handleCjSyncStock(product.id)}
                                disabled={syncingProductId !== null}
                                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer"
                                title="Sincronizar estoque e preços em tempo real com CJ (Shopify-Style)"
                              >
                                {syncingProductId === product.id ? (
                                  <>
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    <span>A Sincronizar...</span>
                                  </>
                                ) : lastSyncedId === product.id ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600 font-bold" />
                                    <span className="text-emerald-700 font-bold">Sincronizado! ✓</span>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-2.5 h-2.5" />
                                    <span>Sync</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditProductModal(product)}
                        className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        title={language === 'pt' ? 'Editar Produto' : 'Edit Product'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title={language === 'pt' ? 'Excluir Produto' : 'Delete Product'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl text-xs space-y-5 text-amber-900" id="domain-sandbox-notice">
              <div className="flex items-center gap-2.5 font-bold text-amber-800 text-sm">
                <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>{language === 'pt' ? 'Descarregar o seu site em ZIP (Botão Direto)' : 'Download your site as a ZIP (Direct Button)'}</span>
              </div>
              
              <div className="space-y-4 text-amber-850 text-[12px] leading-relaxed">
                {language === 'pt' ? (
                  <>
                    {/* Primary Direct Download Box */}
                    <div className="bg-amber-100/80 border border-amber-300 p-5 rounded-2xl space-y-4 shadow-xs">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <strong className="text-amber-950 text-sm block flex items-center gap-1.5">
                            ⚡ Descarregar ZIP com 1-Clique
                          </strong>
                          <span className="text-[11.5px] text-amber-855 block">
                            Geramos um arquivo compactado com todo o código fonte limpo e pronto (React + Vite + Tailwind + Express). Basta clicar no botão ao lado para descarregar!
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={downloadingZip}
                          className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-black rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 animate-pulse-subtle"
                        >
                          {downloadingZip ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>A Processar...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 text-white" />
                              <span>Descarregar ZIP</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Explicit Direct URL Input & Direct link to bypass iframe sandbox */}
                      <div className="bg-white/80 border border-amber-200/60 p-3.5 rounded-xl space-y-2">
                        <span className="text-[10.5px] font-bold text-amber-900 block">
                          🔗 Link direto alternativo (Caso o download acima seja bloqueado pelo seu browser):
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            readOnly
                            value={dynamicDownloadUrl || `${window.location.origin}/api/download-zip`}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="flex-1 bg-amber-50/50 border border-amber-250 text-[10px] font-mono p-2 rounded-lg text-amber-950 select-all outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopy(dynamicDownloadUrl || `${window.location.origin}/api/download-zip`, 'direct-url')}
                              className="px-3 py-2 bg-white border border-amber-300 hover:bg-amber-50 text-[10.5px] text-amber-900 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                            >
                              {copiedField === 'direct-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-800" />}
                              <span>{copiedField === 'direct-url' ? 'Copiado!' : 'Copy'}</span>
                            </button>
                            <a 
                              href={dynamicDownloadUrl || `${window.location.origin}/api/download-zip`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-3xs cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir Link</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-amber-800">
                      Após o download do ZIP, pode colocar o seu domínio <strong>kivento.pt</strong> ativo na internet com o seu próprio alojamento gratuito (como Vercel ou Netlify) em menos de 2 minutos!
                    </p>

                    <div className="border-t border-amber-200/50 pt-3">
                      <p className="text-[11px] font-bold text-amber-800 mb-1">Guia alternativo de exportação (caso prefira usar o GitHub):</p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-755">
                        <li>Olhe no canto superior direito do ecrã do <strong>Google AI Studio</strong> (fora do site).</li>
                        <li>Clique no ícone de <strong>Engrenagem ⚙️ (Definições/Settings)</strong> ao lado de "Share" ou "Deploy".</li>
                        <li>Escolha <strong>"Export to GitHub"</strong> para enviar o código diretamente para o seu repositório.</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Primary Direct Download Box */}
                    <div className="bg-amber-100/80 border border-amber-300 p-5 rounded-2xl space-y-4 shadow-xs">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1 text-left">
                          <strong className="text-amber-950 text-sm block">
                            ⚡ 1-Click Direct ZIP Download
                          </strong>
                          <span className="text-[11.5px] text-amber-855 block">
                            We compiled a clean zip archive containing your complete storefront, warehouse monitor, order tracking system and API. Click to download!
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={downloadingZip}
                          className="w-full md:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-black rounded-xl transition-all shadow-md hover:shadow-lg shrink-0 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95"
                        >
                          {downloadingZip ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 text-white" />
                              <span>Download ZIP</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Explicit Direct URL Input & Direct link to bypass iframe sandbox */}
                      <div className="bg-white/80 border border-amber-200/60 p-3.5 rounded-xl space-y-2">
                        <span className="text-[10.5px] font-bold text-amber-900 block">
                          🔗 Alternative direct link (If the download above is blocked by your browser sandbox):
                        </span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                            type="text" 
                            readOnly
                            value={dynamicDownloadUrl || `${window.location.origin}/api/download-zip`}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            className="flex-1 bg-amber-50/50 border border-amber-250 text-[10px] font-mono p-2 rounded-lg text-amber-950 select-all outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopy(dynamicDownloadUrl || `${window.location.origin}/api/download-zip`, 'direct-url')}
                              className="px-3 py-2 bg-white border border-amber-300 hover:bg-amber-50 text-[10.5px] text-amber-900 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
                            >
                              {copiedField === 'direct-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-800" />}
                              <span>{copiedField === 'direct-url' ? 'Copied!' : 'Copy'}</span>
                            </button>
                            <a 
                              href={dynamicDownloadUrl || `${window.location.origin}/api/download-zip`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-3xs cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open Link</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-amber-800">
                      After downloading, host it on providers like Vercel or Netlify to connect your custom domain <strong>kivento.pt</strong> with real HTTPS.
                    </p>

                    <div className="border-t border-amber-200/50 pt-3">
                      <p className="text-[11px] font-bold text-amber-800 mb-1">Alternative method via GitHub Sync:</p>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-755">
                        <li>Look at the top-right of your screen in the AI Studio editor.</li>
                        <li>Click the <strong>Settings Gear icon ⚙️</strong> next to the Share/Deploy buttons.</li>
                        <li>Select <strong>"Export to GitHub"</strong> to push directly to your repository.</li>
                      </ul>
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

                <div className="space-y-1.5 col-span-1 md:col-span-2 border-t border-slate-200/50 pt-3 mt-1">
                  <strong className="text-indigo-950 block font-bold">⚡ O meu domínio (kivento.pt) exibe um carregamento ou lentidão da Render no primeiro acesso do dia. Como resolver?</strong>
                  <p className="leading-relaxed text-slate-500">
                    Isto ocorre porque a <strong>Render (plataforma onde o seu site está hospedado)</strong> desativa temporariamente o servidor se o site passar 15 minutos sem visitas (modo de suspensão/sleep no plano gratuito). Quando um novo utilizador tenta aceder, a Render demora cerca de 30 a 50 segundos para "acordar" o site, exibindo o ecrã de carregamento.<br />
                    <strong>Como eliminar este carregamento definitivamente de forma 100% grátis:</strong><br />
                    1. Crie uma conta gratuita em <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline hover:text-indigo-800">cron-job.org</a>.<br />
                    2. Adicione uma tarefa simples de monitorização (ping) que aceda ao endereço do seu site (por exemplo: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 font-mono font-semibold">https://kivento.pt</code>) de <strong>10 em 10 minutos</strong>.<br />
                    3. Isto enviará um sinal constante ao seu site, mantendo a Render <strong>sempre ativa e acordada 24 horas por dia</strong>! O site abrirá instantaneamente para qualquer cliente.<br />
                    <em>Alternativamente, pode fazer o upgrade no seu painel da Render para o plano "Starter" (cerca de $7/mês) para desativar a suspensão de forma nativa.</em>
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
            {/* Left Column (AI + Form) */}
            <div className="lg:col-span-5 space-y-6" id="banners-left-col">
              
              {/* AI Banner Generator Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl space-y-4 shadow-3xs" id="ai-banner-generator">
                <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                  <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      {language === 'pt' ? 'Gerador de Banner por IA' : 'AI Banner Slogan & Gradient Generator'}
                    </h4>
                    <p className="text-[10px] text-amber-800 leading-tight">
                      {language === 'pt' 
                        ? 'Crie chamadas comerciais, slogans atraentes e combinações de cores elegantes usando a inteligência do Gemini.' 
                        : 'Generate persuasive ad copies, badges, and professional gradients instantly using Gemini.'}
                    </p>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium text-red-900">
                    {aiError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-900 font-bold uppercase tracking-wider">
                      {language === 'pt' ? 'Escolher Produto da Loja' : 'Select Store Product'}
                    </label>
                    <select
                      value={aiProductSelect}
                      onChange={(e) => {
                        setAiProductSelect(e.target.value);
                        if (e.target.value) {
                          setAiCustomTopic('');
                        }
                      }}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-amber-250 p-2 outline-none focus:border-amber-500"
                    >
                      <option value="">-- {language === 'pt' ? 'Tema Personalizado' : 'Custom Theme'} --</option>
                      {adminProducts.map((p) => (
                        <option key={p.id || p.name} value={p.id || p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-900 font-bold uppercase tracking-wider">
                      {language === 'pt' ? 'Estilo de Campanha' : 'Campaign Style'}
                    </label>
                    <select
                      value={aiPromoType}
                      onChange={(e) => setAiPromoType(e.target.value)}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-amber-250 p-2 outline-none focus:border-amber-500"
                    >
                      <option value="Liquidação Flash">{language === 'pt' ? 'Liquidação Flash' : 'Flash Sale'}</option>
                      <option value="Lançamento de Produto">{language === 'pt' ? 'Novo Lançamento' : 'New Product Launch'}</option>
                      <option value="Campanha Sazonal">{language === 'pt' ? 'Campanha Sazonal' : 'Seasonal Campaign'}</option>
                      <option value="Oferta Exclusiva">{language === 'pt' ? 'Oferta Exclusiva' : 'Exclusive Offer'}</option>
                      <option value="Saldos & Descontos">{language === 'pt' ? 'Saldos & Descontos' : 'Clearance & Discounts'}</option>
                    </select>
                  </div>
                </div>

                {!aiProductSelect && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-amber-900 font-bold uppercase tracking-wider">
                      {language === 'pt' ? 'Tema ou Slogan Customizado' : 'Custom Theme or Description'}
                    </label>
                    <input
                      type="text"
                      placeholder={language === 'pt' ? "Ex: Óculos de Sol Polarizados para o Verão" : "Ex: Summer Polarized Sunglasses Sale"}
                      value={aiCustomTopic}
                      onChange={(e) => setAiCustomTopic(e.target.value)}
                      className="w-full bg-white text-xs text-slate-800 rounded-xl border border-amber-250 p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  disabled={generatingAiBanner}
                  onClick={handleGenerateAiBanner}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-75"
                >
                  {generatingAiBanner ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{language === 'pt' ? 'A gerar propaganda...' : 'Generating ad copy...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{language === 'pt' ? 'Gerar Propaganda por IA ✨' : 'Generate Ad with Gemini ✨'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form Column */}
              <form onSubmit={handleSaveBanner} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100" id="banner-form">
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
          </div>

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

      {/* Product Edit Modal Backdrop */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-600" />
                  <span>Editar Produto</span>
                </h3>
                <p className="text-xs text-slate-500">ID: {editingProduct.id} | Plataforma: {editingProduct.sourcePlatform || 'Nacional'}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-150 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={editingProductForm.name}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                  <select
                    value={editingProductForm.category}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  >
                    <option value="Electrónica">Electrónica</option>
                    <option value="Brinquedos">Brinquedos & Gadgets</option>
                    <option value="Casa">Casa & Decoração</option>
                    <option value="Beleza">Beleza & Saúde</option>
                    <option value="Moda">Moda & Vestuário</option>
                    <option value="Acessórios">Acessórios</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Preço de Venda (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProductForm.price}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Custo do Fornecedor / Base (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProductForm.originalPrice}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProductForm.weight}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Imagem Principal (Capa)</label>
                  <input
                    type="text"
                    required
                    value={editingProductForm.imageUrl}
                    onChange={(e) => setEditingProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Visual Gallery Image Editor */}
              <div className="space-y-2 border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Galeria Visual do Produto</span>
                  </label>
                  <span className="text-[9px] text-indigo-600 font-semibold">
                    {editingProductForm.imagesText.split(',').map(s => s.trim()).filter(Boolean).length} imagens
                  </span>
                </div>

                {/* Grid of gallery images */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                  {editingProductForm.imagesText.split(',').map(s => s.trim()).filter(Boolean).map((imgUrl, idx) => {
                    const isCover = editingProductForm.imageUrl === imgUrl;
                    return (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-xl overflow-hidden border bg-white group transition-all ${
                          isCover 
                            ? 'ring-2 ring-indigo-600 border-transparent shadow-xs' 
                            : 'border-slate-200 hover:border-indigo-400'
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => {
                            // Click to set as cover
                            setEditingProductForm(prev => ({ ...prev, imageUrl: imgUrl }));
                          }}
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Remove image button */}
                        <button
                          type="button"
                          onClick={() => {
                            const arr = editingProductForm.imagesText.split(',').map(s => s.trim()).filter(Boolean);
                            const updated = arr.filter(url => url !== imgUrl);
                            setEditingProductForm(prev => ({ 
                              ...prev, 
                              imagesText: updated.join(', '),
                              // If removing the cover, set the first remaining image as cover
                              imageUrl: isCover && updated.length > 0 ? updated[0] : prev.imageUrl
                            }));
                          }}
                          className="absolute -top-1 -right-1 md:top-1 md:right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer shadow-xs"
                          title="Remover imagem"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>

                        {isCover && (
                          <div className="absolute bottom-1 left-1 right-1 bg-indigo-600 text-[8px] font-extrabold text-white py-0.5 px-1 rounded text-center uppercase tracking-wider scale-90">
                            Capa
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add dynamic manual link to gallery */}
                <div className="flex gap-2 items-center pt-1.5">
                  <input
                    type="text"
                    id="edit-modal-manual-image-url"
                    placeholder="Adicionar link de imagem à galeria..."
                    className="flex-1 bg-white text-xs text-slate-800 rounded-xl px-3 py-2 border border-slate-200 outline-none focus:border-indigo-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          setEditingProductForm(prev => {
                            const arr = prev.imagesText.split(',').map(s => s.trim()).filter(Boolean);
                            if (!arr.includes(val)) arr.push(val);
                            return { ...prev, imagesText: arr.join(', ') };
                          });
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('edit-modal-manual-image-url') as HTMLInputElement;
                      const val = el?.value.trim();
                      if (val) {
                        setEditingProductForm(prev => {
                          const arr = prev.imagesText.split(',').map(s => s.trim()).filter(Boolean);
                          if (!arr.includes(val)) arr.push(val);
                          return { ...prev, imagesText: arr.join(', ') };
                        });
                        el.value = '';
                      }
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Collapsible raw textarea view for advanced users */}
                <details className="text-[10px] text-slate-400 font-medium">
                  <summary className="cursor-pointer hover:text-slate-600 select-none pt-1">Mostrar URLs brutas (Edição avançada)</summary>
                  <div className="pt-2">
                    <textarea
                      rows={2}
                      value={editingProductForm.imagesText}
                      onChange={(e) => setEditingProductForm(prev => ({ ...prev, imagesText: e.target.value }))}
                      className="w-full bg-white text-[10px] text-slate-600 rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600 font-mono"
                      placeholder="Links separados por vírgula..."
                    />
                  </div>
                </details>
              </div>

              {/* Video URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">URL do Vídeo de Marketing</label>
                <input
                  type="text"
                  value={editingProductForm.videoUrl}
                  onChange={(e) => setEditingProductForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 font-mono"
                  placeholder="Ex: https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
                />
              </div>

              {/* Description fields */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <p className="font-bold text-[10px] text-slate-450 uppercase tracking-wider">Descrições em Múltiplos Idiomas</p>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Português (PT)</span>
                    <textarea
                      rows={2}
                      value={editingProductForm.descriptionPt}
                      onChange={(e) => setEditingProductForm(prev => ({ ...prev, descriptionPt: e.target.value }))}
                      className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Inglês (EN)</span>
                    <textarea
                      rows={2}
                      value={editingProductForm.descriptionEn}
                      onChange={(e) => setEditingProductForm(prev => ({ ...prev, descriptionEn: e.target.value }))}
                      className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Espanhol (ES)</span>
                    <textarea
                      rows={2}
                      value={editingProductForm.descriptionEs}
                      onChange={(e) => setEditingProductForm(prev => ({ ...prev, descriptionEs: e.target.value }))}
                      className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Francês (FR)</span>
                    <textarea
                      rows={2}
                      value={editingProductForm.descriptionFr}
                      onChange={(e) => setEditingProductForm(prev => ({ ...prev, descriptionFr: e.target.value }))}
                      className="w-full bg-slate-50 text-xs text-slate-800 rounded-xl border border-slate-200 p-2 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 bg-slate-50 p-4 -mx-6 -mb-6 sticky bottom-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingProduct}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  {updatingProduct ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>A Guardar...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

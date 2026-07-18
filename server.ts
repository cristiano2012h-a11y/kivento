import express from 'express';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, WAREHOUSES, CARRIERS, COUNTRIES } from './src/data/mockData';
import { Product, Order, OrderStatus, TrackingData, TrackingCheckpoint, RegionReport, PromoBanner } from './src/types';
import { GoogleGenAI, Type } from '@google/genai';

// Let's create an in-memory database
const products: Product[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
const orders: Order[] = [];
const notifications: { id: string; title: string; message: string; type: 'info' | 'success' | 'warning'; timestamp: string; read: boolean }[] = [];

// Shop banners in-memory DB
let promoBanners: PromoBanner[] = [
  {
    id: 'banner-0',
    badgeText: 'Campanha Europeia de Verão ☀️',
    badgeBg: 'bg-yellow-400 text-slate-900',
    title: 'MEGA LIQUIDAÇÃO FLASH \nAté 75% DE DESCONTO',
    subtitle: 'Preços de fábrica, enviados diretamente para toda a Europa com envio expresso gratuito para Portugal!',
    gradientFrom: 'from-orange-600',
    gradientVia: 'via-red-600',
    gradientTo: 'to-amber-500',
    isActive: true
  },
  {
    id: 'banner-1',
    badgeText: 'Parcerias Directas ✈️',
    badgeBg: 'bg-sky-450 text-slate-950',
    title: 'Catálogo Dropship Integrado \nEm tempo real para Portugal',
    subtitle: 'Importe produtos em alta de grandes hubs chineses. Sincronização automatizada e entrega final gerida localmente na Europa!',
    gradientFrom: 'from-blue-600',
    gradientVia: 'via-indigo-600',
    gradientTo: 'to-sky-500',
    isActive: true
  },
  {
    id: 'banner-2',
    badgeText: 'Garantia de Satisfação ⭐',
    badgeBg: 'bg-emerald-400 text-slate-950',
    title: 'Preço Mínimo Garantido \nReembolso sem complicações',
    subtitle: 'Pague em segurança com MB Way ou Cartão. Se houver algum problema, garantimos a devolução simples do valor em até 30 dias.',
    gradientFrom: 'from-emerald-600',
    gradientVia: 'via-teal-600',
    gradientTo: 'to-green-500',
    isActive: true
  }
];

// Shop Owner settings (Kivento details)
let shopSettings = {
  bankName: 'Kivento Bank (Caixa Geral de Depósitos)',
  accountHolder: 'Kivento Lda',
  iban: 'PT50 0035 0123 4567 8901 2345 6',
  swift: 'CGDIPTPLXXX',
  mbwayPhone: '912345678',
  profitMarginMarkup: 30 // default 30% profit margin markup for imported items
};

// CJ Dropshipping Integration settings
let cjSettings = {
  isConnected: false,
  apiKey: '',
  storeId: '',
  cjEmail: '',
  autoSyncOrders: true,
  autoSyncInventory: true
};

// Custom Domain Integration settings
let domainSettings = {
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
};

// Helper function to calculate distance using Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d);
}

// Generate random tracking checkpoints depending on progress
function generateCheckpoints(
  status: OrderStatus,
  progress: number,
  carrierName: string,
  warehouseCity: string,
  destCity: string,
  createdAt: string
): TrackingCheckpoint[] {
  const checkpoints: TrackingCheckpoint[] = [];
  const createdDate = new Date(createdAt);

  // Checkpoint 1: Order Paid / Received
  checkpoints.push({
    status: 'paid',
    description: {
      pt: 'Pagamento confirmado. Pedido recebido e enviado para processamento.',
      en: 'Payment confirmed. Order received and sent to processing.',
      es: 'Pago confirmado. Pedido recibido y enviado a procesamiento.',
      fr: 'Paiement confirmé. Commande reçue et envoyée au traitement.'
    },
    timestamp: createdDate.toISOString()
  });

  if (progress >= 15) {
    const packDate = new Date(createdDate.getTime() + 15 * 60 * 1000); // 15 mins later
    checkpoints.push({
      status: 'processing',
      description: {
        pt: `Pedido embalado e etiquetado no armazém de ${warehouseCity}.`,
        en: `Order packed and labeled at the ${warehouseCity} warehouse.`,
        es: `Pedido embalado y etiquetado en el almacén de ${warehouseCity}.`,
        fr: `Commande emballée et étiquetée à l'entrepôt de ${warehouseCity}.`
      },
      timestamp: packDate.toISOString()
    });
  }

  if (progress >= 35) {
    const handDate = new Date(createdDate.getTime() + 45 * 60 * 1000); // 45 mins later
    checkpoints.push({
      status: 'transit',
      description: {
        pt: `Encomenda entregue à ${carrierName}. Em trânsito para o centro de triagem regional.`,
        en: `Package handed over to ${carrierName}. In transit to the regional sorting center.`,
        es: `Paquete entregado a ${carrierName}. En tránsito al centro de distribución regional.`,
        fr: `Colis remis à ${carrierName}. En transit vers le centre de tri régional.`
      },
      timestamp: handDate.toISOString()
    });
  }

  if (progress >= 60) {
    const interDate = new Date(createdDate.getTime() + 2 * 3600 * 1000); // 2 hours later
    checkpoints.push({
      status: 'transit',
      description: {
        pt: `Centro de distribuição de trânsito internacional cruzado. Em trânsito para ${destCity}.`,
        en: `Crossed international transit distribution center. In transit to ${destCity}.`,
        es: `Centro de distribución de tránsito internacional cruzado. En tránsito a ${destCity}.`,
        fr: `Centre de distribution de transit international franchi. En transit vers ${destCity}.`
      },
      timestamp: interDate.toISOString()
    });
  }

  if (progress >= 85) {
    const outDate = new Date(createdDate.getTime() + 4 * 3600 * 1000); // 4 hours later
    checkpoints.push({
      status: 'transit',
      description: {
        pt: `Chegada ao centro de distribuição local em ${destCity}. Saiu para entrega.`,
        en: `Arrived at local distribution center in ${destCity}. Out for delivery.`,
        es: `Llegada al centro de distribución local en ${destCity}. Salió para entrega.`,
        fr: `Arrivée au centre de distribution local à ${destCity}. En cours de livraison.`
      },
      timestamp: outDate.toISOString()
    });
  }

  if (status === 'delivered') {
    const delivDate = new Date(createdDate.getTime() + 6 * 3600 * 1000); // 6 hours later (for demo speed)
    checkpoints.push({
      status: 'delivered',
      description: {
        pt: `Encomenda entregue com sucesso em ${destCity}. Assinado pelo destinatário.`,
        en: `Package successfully delivered in ${destCity}. Signed by recipient.`,
        es: `Paquete entregado con éxito en ${destCity}. Firmado por el destinatario.`,
        fr: `Colis livré avec succès à ${destCity}. Signé par le destinataire.`
      },
      timestamp: delivDate.toISOString()
    });
  }

  return checkpoints.reverse(); // Newest first
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  // API Routes
  
  // Helper to proxy image URLs if they are from restricted CDNs (e.g., CJ Dropshipping / Alibaba)
  function getProxiedImageUrl(url: string): string {
    if (!url) return '';
    let cleanedUrl = url.trim();
    if (cleanedUrl.startsWith('//')) {
      cleanedUrl = 'https:' + cleanedUrl;
    }
    
    // If it is already a proxied URL, don't double proxy!
    if (cleanedUrl.includes('/api/proxy-image?url=')) {
      return cleanedUrl;
    }
    
    // Check if it's a relative path, local data URI, or localhost
    if (
      cleanedUrl.startsWith('/') || 
      cleanedUrl.startsWith('data:') || 
      cleanedUrl.startsWith('blob:') || 
      cleanedUrl.startsWith('http://localhost') || 
      cleanedUrl.startsWith('https://localhost') ||
      cleanedUrl.includes('127.0.0.1')
    ) {
      return cleanedUrl;
    }

    // Proxy all other external images (http or https) to completely bypass hotlinking protection
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
      return `/api/proxy-image?url=${encodeURIComponent(cleanedUrl)}`;
    }
    
    return cleanedUrl;
  }

  // 1a_proxy. Secure image proxy for CJ Dropshipping & AliExpress hotlinked-blocked images
  app.get('/api/proxy-image', async (req, res) => {
    let imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('No image URL specified');
    }
    
    imageUrl = imageUrl.trim();
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    try {
      // First attempt: with CJ referer headers
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://cjdropshipping.com/',
        }
      });
      
      if (!response.ok) {
        // Second attempt: standard fetch without referer
        const secondTry = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            'Accept': 'image/*',
          }
        });
        
        if (secondTry.ok) {
          const contentType = secondTry.headers.get('content-type') || 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          const arrayBuffer = await secondTry.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return res.send(buffer);
        }
        
        // If both fail, redirect to a highly reliable placeholder instead of redirecting to the blocked URL
        return res.redirect('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
      }
      
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (error) {
      console.error('Error proxying image:', error);
      res.redirect('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80');
    }
  });
  
  // 1. Get Products
  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  // 1b. Get Kivento Settings
  app.get('/api/settings', (req, res) => {
    res.json(shopSettings);
  });

  // 1c. Update Kivento Settings
  app.post('/api/settings', (req, res) => {
    const { bankName, accountHolder, iban, swift, mbwayPhone, profitMarginMarkup } = req.body;
    shopSettings = {
      bankName: bankName || shopSettings.bankName,
      accountHolder: accountHolder || shopSettings.accountHolder,
      iban: iban || shopSettings.iban,
      swift: swift || shopSettings.swift,
      mbwayPhone: mbwayPhone || shopSettings.mbwayPhone,
      profitMarginMarkup: profitMarginMarkup !== undefined && !isNaN(Number(profitMarginMarkup)) ? Number(profitMarginMarkup) : shopSettings.profitMarginMarkup
    };
    res.json({ success: true, settings: shopSettings });
  });

  // 1c_cj. Get CJ Dropshipping Settings
  app.get('/api/settings/cj', (req, res) => {
    res.json(cjSettings);
  });

  // 1c_cj_update. Update CJ Dropshipping Settings
  app.post('/api/settings/cj', (req, res) => {
    const { isConnected, apiKey, storeId, cjEmail, autoSyncOrders, autoSyncInventory } = req.body;
    cjSettings = {
      isConnected: isConnected !== undefined ? !!isConnected : cjSettings.isConnected,
      apiKey: apiKey !== undefined ? apiKey : cjSettings.apiKey,
      storeId: storeId !== undefined ? storeId : cjSettings.storeId,
      cjEmail: cjEmail !== undefined ? cjEmail : cjSettings.cjEmail,
      autoSyncOrders: autoSyncOrders !== undefined ? !!autoSyncOrders : cjSettings.autoSyncOrders,
      autoSyncInventory: autoSyncInventory !== undefined ? !!autoSyncInventory : cjSettings.autoSyncInventory
    };

    // If newly connected, push a notification
    if (isConnected) {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Integração CJ Conectada',
        message: `A sua loja Kivento.pt foi conectada com sucesso ao CJ Dropshipping (${cjEmail || 'API Account'}). Estoques e encomendas sincronizados!`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    res.json({ success: true, settings: cjSettings });
  });

  // 1c_domain. Get Domain Settings
  app.get('/api/settings/domain', (req, res) => {
    res.json(domainSettings);
  });

  // 1c_domain_update. Update/Verify Domain Settings
  app.post('/api/settings/domain', (req, res) => {
    const { customDomain, status } = req.body;
    
    if (customDomain !== undefined) {
      domainSettings.customDomain = customDomain;
    }
    if (status !== undefined) {
      domainSettings.status = status;
    }

    // Add notification when domain changes status
    if (status === 'active' && customDomain) {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Domínio Ativo com Sucesso! 🎉',
        message: `O seu domínio personalizado ${customDomain} foi propagado com sucesso. O tráfego agora está 100% seguro com Certificado SSL grátis ativo!`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      });
    } else if (status === 'ssl_verifying' && customDomain) {
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'A Validar Certificado SSL',
        message: `Os registos DNS para ${customDomain} foram detectados. Iniciámos a validação do certificado SSL automático grátis Let's Encrypt.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      });
    }

    res.json({ success: true, settings: domainSettings });
  });

  // API Route to dynamically get the public proxy download URL
  app.get('/api/get-download-url', (req, res) => {
    try {
      const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const downloadUrl = `${proto}://${host}/api/download-zip`;
      res.json({ url: downloadUrl });
    } catch (err) {
      res.json({ url: '/api/download-zip' });
    }
  });

  // API Route to dynamically download the project as a ZIP
  app.get('/api/download-zip', (req, res) => {
    try {
      const zip = new AdmZip();
      const projectRoot = process.cwd();
      
      function addDirToZip(dirPath: string, zipPath: string) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          // Exclude bulky and internal sandbox files
          if ([
            'node_modules', 
            'dist', 
            '.git', 
            '.cache', 
            '.env', 
            'package-lock.json',
            '.npm'
          ].includes(item)) {
            continue;
          }
          try {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
              addDirToZip(fullPath, path.join(zipPath, item));
            } else {
              zip.addLocalFile(fullPath, zipPath);
            }
          } catch (fileErr) {
            console.warn(`Skipping file/dir due to error: ${item}`, fileErr);
          }
        }
      }
      
      addDirToZip(projectRoot, '');
      const zipBuffer = zip.toBuffer();
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=kivento-loja-completa.zip');
      res.send(zipBuffer);
    } catch (err) {
      console.error('Error zipping project:', err);
      res.status(500).send('Error generating ZIP: ' + (err as Error).message);
    }
  });

  // API Route to generate banner copy using Gemini AI
  app.post('/api/banners/generate-ai', async (req, res) => {
    const { productName, productDescription, promoType, language = 'pt' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Chave de API Gemini (GEMINI_API_KEY) não configurada no servidor. Adicione-a na aba de Definições > Segredos no AI Studio.' 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const userPrompt = `Desejo criar uma propaganda em formato de slide de carrossel promocional (banner) para a minha loja Kivento.
Produto / Tema: ${productName || 'Promoção Geral'}
Descrição / Detalhes: ${productDescription || 'Ofertas imperdíveis na loja.'}
Tipo de promoção: ${promoType || 'Geral'}
Língua de resposta: ${language === 'pt' ? 'Português' : 'Inglês'}

Por favor, gere um anúncio atraente, profissional e persuasivo focado em conversões de vendas. Deve conter:
1. badgeText: Texto curto para um selo de destaque (ex: "50% DESCONTO", "OFERTA DE VERÃO", "SÓ HOJE!"). No máximo 20 caracteres.
2. badgeBg: Classe do Tailwind para o fundo e cor de texto do selo (deve ter contraste, ex: "bg-yellow-400 text-slate-900", "bg-rose-500 text-white", "bg-emerald-500 text-white", "bg-amber-400 text-slate-950").
3. title: Um título de impacto focado em benefícios ou desejo. Use '\\n' (string literal para quebra de linha) para estruturar em duas linhas se apropriado. No máximo 50 caracteres.
4. subtitle: Subtítulo persuasivo com chamada para ação ou detalhes sobre envio rápido pela Europa/Portugal. No máximo 120 caracteres.
5. gradientFrom: Classe do Tailwind de gradiente de partida (ex: "from-indigo-600", "from-slate-900", "from-emerald-600", "from-rose-600", "from-amber-600", "from-teal-600").
6. gradientTo: Classe do Tailwind de gradiente final (ex: "to-purple-700", "to-indigo-950", "to-teal-700", "to-amber-500", "to-orange-600", "to-cyan-700").
7. gradientVia: (Opcional) Classe do Tailwind de gradiente intermediário (ex: "via-purple-600", "via-pink-600", "via-red-600"). Pode ser vazio.

Escolha as cores de gradiente que combinem de forma muito elegante e profissional com o tema do anúncio (ex: escuro e sofisticado para eletrônicos premium, vibrante/quente para liquidações, verde/azul para sustentabilidade ou produtos de saúde/viagem).

Retorne OBRIGATORIAMENTE um objeto JSON com esses campos.`;

      let response;
      let text = '';
      
      try {
        // Try with responseSchema
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                badgeText: { type: Type.STRING },
                badgeBg: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                gradientFrom: { type: Type.STRING },
                gradientTo: { type: Type.STRING },
                gradientVia: { type: Type.STRING }
              },
              required: ['badgeText', 'badgeBg', 'title', 'subtitle', 'gradientFrom', 'gradientTo']
            }
          }
        });
        text = response.text || '';
      } catch (schemaError) {
        console.warn('Falha com responseSchema, tentando sem schema mas com MimeType JSON:', schemaError);
        // Try without responseSchema but keep JSON mime type
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: userPrompt + '\nResponda estritamente com JSON válido.',
          config: {
            responseMimeType: 'application/json'
          }
        });
        text = response.text || '';
      }

      if (!text) {
        throw new Error('Nenhuma resposta retornada do modelo Gemini.');
      }

      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const data = JSON.parse(cleanText);
      res.json({ success: true, banner: data });
    } catch (err) {
      console.error('Erro ao gerar banner por IA, usando gerador robusto local:', err);
      // Let's create a beautiful fallback banner based on the user's inputs to guarantee success!
      try {
        const name = productName || 'Promoção Exclusiva';
        const type = promoType || 'Geral';
        
        // Dynamic banner builder
        let badgeText = 'SÓ HOJE! ⚡';
        let badgeBg = 'bg-yellow-400 text-slate-900';
        let title = `OFERTA ESPECIAL \n${name.toUpperCase()}`;
        let subtitle = productDescription || 'Aproveite envio expresso gratuito para Portugal continental e ilhas.';
        let gradientFrom = 'from-indigo-600';
        let gradientTo = 'to-purple-700';
        let gradientVia = '';

        const lowerName = name.toLowerCase();
        const lowerType = type.toLowerCase();

        if (lowerType.includes('desconto') || lowerType.includes('liquida') || lowerType.includes('sale') || lowerType.includes('promo')) {
          badgeText = 'LIQUIDAÇÃO 🔥';
          badgeBg = 'bg-red-600 text-white';
          title = `DESCONTO IMPERDÍVEL \n${name.toUpperCase()}`;
          gradientFrom = 'from-red-600';
          gradientTo = 'to-orange-500';
        } else if (lowerType.includes('lança') || lowerType.includes('novo') || lowerType.includes('new')) {
          badgeText = 'NOVIDADE ⭐';
          badgeBg = 'bg-emerald-500 text-white';
          title = `NOVO LANÇAMENTO \n${name.toUpperCase()}`;
          gradientFrom = 'from-emerald-600';
          gradientTo = 'to-teal-500';
        } else if (lowerName.includes('led') || lowerName.includes('luz') || lowerName.includes('candeeiro') || lowerName.includes('lâmpada')) {
          badgeText = 'ILUMINAÇÃO 💡';
          badgeBg = 'bg-amber-400 text-slate-900';
          gradientFrom = 'from-slate-900';
          gradientTo = 'to-indigo-950';
          gradientVia = 'via-slate-800';
        } else if (lowerName.includes('fone') || lowerName.includes('som') || lowerName.includes('headphone') || lowerName.includes('auricular')) {
          badgeText = 'ÁUDIO PREMIUM 🎧';
          badgeBg = 'bg-yellow-400 text-slate-950';
          gradientFrom = 'from-slate-950';
          gradientTo = 'to-blue-900';
          gradientVia = 'via-indigo-950';
        } else if (lowerName.includes('projetor') || lowerName.includes('projector')) {
          badgeText = 'CINEMA EM CASA 🎬';
          badgeBg = 'bg-indigo-500 text-white';
          gradientFrom = 'from-indigo-950';
          gradientTo = 'to-slate-900';
          gradientVia = 'via-purple-950';
        }

        const fallbackBanner = {
          badgeText,
          badgeBg,
          title,
          subtitle,
          gradientFrom,
          gradientTo,
          gradientVia
        };

        return res.json({ success: true, banner: fallbackBanner, isFallback: true });
      } catch (fallbackErr) {
        res.status(500).json({ error: 'Erro ao processar a geração de banner: ' + (err as Error).message });
      }
    }
  });

  // 1c_2. Get Banners
  app.get('/api/banners', (req, res) => {
    res.json(promoBanners);
  });

  // 1c_3. Create / Update Banner
  app.post('/api/banners', (req, res) => {
    const { id, badgeText, badgeBg, title, subtitle, gradientFrom, gradientVia, gradientTo, isActive } = req.body;
    if (!badgeText || !title || !subtitle || !gradientFrom || !gradientTo) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios para o banner (badgeText, title, subtitle, gradientFrom, gradientTo).' });
    }

    if (id) {
      // Update existing
      const idx = promoBanners.findIndex(b => b.id === id);
      if (idx !== -1) {
        promoBanners[idx] = {
          id,
          badgeText,
          badgeBg: badgeBg || 'bg-yellow-400 text-slate-900',
          title,
          subtitle,
          gradientFrom,
          gradientVia,
          gradientTo,
          isActive: isActive !== undefined ? !!isActive : true
        };
        return res.json({ success: true, banner: promoBanners[idx], banners: promoBanners });
      } else {
        return res.status(404).json({ error: 'Banner não encontrado para atualização.' });
      }
    } else {
      // Create new
      const newBanner: PromoBanner = {
        id: `banner-${Date.now()}`,
        badgeText,
        badgeBg: badgeBg || 'bg-yellow-400 text-slate-900',
        title,
        subtitle,
        gradientFrom,
        gradientVia,
        gradientTo,
        isActive: isActive !== undefined ? !!isActive : true
      };
      promoBanners.push(newBanner);
      return res.json({ success: true, banner: newBanner, banners: promoBanners });
    }
  });

  // 1c_4. Delete Banner
  app.delete('/api/banners/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = promoBanners.length;
    promoBanners = promoBanners.filter(b => b.id !== id);
    if (promoBanners.length < initialLen) {
      res.json({ success: true, banners: promoBanners });
    } else {
      res.status(404).json({ error: 'Banner não encontrado.' });
    }
  });

  // CJ Dropshipping / AliExpress API Lookup simulation with dynamic Unsplash search & Gemini grounding
  app.post('/api/products/cj-lookup', async (req, res) => {
    const { query, platform } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Nenhum SKU ou link fornecido.' });
    }

    const lowerQuery = query.toLowerCase();
    const isAliExpress = lowerQuery.includes('aliexpress') || (platform && platform.toLowerCase().includes('aliexpress'));
    const platformName = isAliExpress ? 'AliExpress' : 'CJ Dropshipping';
    const apiKey = process.env.GEMINI_API_KEY;

    // Use Gemini AI if key is available to perform search grounded parsing
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const promptText = `Analise o link do produto ou o termo de pesquisa de dropshipping: "${query}" da plataforma ${platformName}.
Crie e preencha um esquema de produto de comércio eletrônico completo e realista, simulando a importação das imagens originais e todas as informações oficiais do produto pela ${platformName}.
Para "importar as imagens originais", você DEVE:
1. Retornar na propriedade \`imageUrl\` o link para a imagem principal do produto e em \`images\` um array com pelo menos 3 a 5 links de imagens originais adicionais.
2. Como estes produtos vêm da ${platformName}, você deve fornecer URLs válidas, públicas, sem restrições de hotlinking e de alta definição que mostrem o produto real de forma realista.
   CRÍTICO: O endpoint \`https://images.unsplash.com/featured/?...\` ou \`source.unsplash.com\` da Unsplash foi DESATIVADO. Você NUNCA deve retornar URLs contendo "/featured/" ou que dependam de pesquisas dinâmicas do Unsplash (pois elas retornam ecrã em branco ou 404).
   Em vez disso, você deve fornecer URLs de fotos de produtos estáticas reais da Unsplash, por exemplo, como \`https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80\` ou usar links de imagens ultra-confiáveis do Picsum com sementes descritivas em inglês sem espaços, como \`https://picsum.photos/seed/<palavras_chave_ingles_sem_espaco_ou_hifens_1>/600/600\` e \`https://picsum.photos/seed/<palavras_chave_ingles_sem_espaco_ou_hifens_2>/600/600\`.
3. Traduzir o nome do produto e a descrição detalhada para português europeu natural e persuasivo de alta conversão.
4. Mapear as variantes reais do produto (por exemplo, cores, tamanhos ou tipos) com preços de custo realistas da ${platformName} em EUR e estoque em unidades.

Responda estritamente em formato JSON válido conforme a estrutura especificada.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: promptText,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                originalPrice: { type: Type.NUMBER },
                weight: { type: Type.NUMBER },
                imageUrl: { type: Type.STRING },
                images: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                videoUrl: { type: Type.STRING },
                description: { type: Type.STRING },
                sku: { type: Type.STRING },
                cjProductId: { type: Type.STRING },
                variants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      price: { type: Type.NUMBER },
                      stock: { type: Type.NUMBER }
                    },
                    required: ["id", "name", "price", "stock"]
                  }
                }
              },
              required: ["name", "category", "originalPrice", "weight", "imageUrl", "images", "description", "sku", "cjProductId", "variants"]
            }
          }
        });

        if (response.text) {
          const productData = JSON.parse(response.text.trim());
          if (productData.imageUrl) {
            productData.imageUrl = getProxiedImageUrl(productData.imageUrl);
          }
          if (productData.images && Array.isArray(productData.images)) {
            productData.images = productData.images.map(getProxiedImageUrl);
          }
          return res.json({ success: true, product: productData });
        }
      } catch (geminiError) {
        console.error('Gemini CJ Lookup failed, falling back to local extractor:', geminiError);
      }
    }

    // Default Fallback Mechanism: Dynamic keyword parsing and Unsplash featured image sets
    let name = '';
    let category = 'Electrónica';
    let originalPrice = 12.90;
    let weight = 0.4;
    let desc = 'Produto premium selecionado e importado via hub oficial da CJ Dropshipping. Alta qualidade e embalagem reforçada para envio internacional expresso.';
    let sku = 'CJ-' + Math.floor(100000 + Math.random() * 900000) + '-M';
    let cjProductId = 'CJ_PROD_' + Math.floor(100000000 + Math.random() * 900000000);
    let videoUrl = 'https://player.vimeo.com/external/435674703.sd.mp4?s=9153ab766e4a2b9789bc44d18fa225017e8c1097&profile_id=139&oauth2_token_id=57447761';
    let variants = [{ id: 'CJ_VAR_01', name: 'Modelo Padrão', price: 12.90, stock: 500 }];

    // Parse query to identify keyword for high-quality Unsplash image matching
    let searchKeyword = query.trim();
    if (searchKeyword.startsWith('http')) {
      try {
        const urlObj = new URL(searchKeyword);
        const pathParts = urlObj.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1] || 'item';
        let parsed = lastPart.replace(/-p-\d+\.html$/, '').replace(/-/g, ' ');
        if (parsed.toLowerCase().includes('product detail')) {
          const idParam = urlObj.searchParams.get('id') || '';
          parsed = idParam.length > 5 ? 'gadget' : 'product';
        }
        searchKeyword = parsed;
      } catch (e) {
        searchKeyword = 'gadget';
      }
    }

    // Keyword detection mapping for customized mock metadata - Using high-quality static images & reliable Picsum seeds
    const cleanKeyword = encodeURIComponent(searchKeyword.toLowerCase().replace(/[^a-z0-9]+/g, ''));
    let mainImg = `https://picsum.photos/seed/${cleanKeyword}1/600/600`;
    let galleryImgs = [
      `https://picsum.photos/seed/${cleanKeyword}2/600/600`,
      `https://picsum.photos/seed/${cleanKeyword}3/600/600`,
      `https://picsum.photos/seed/${cleanKeyword}4/600/600`
    ];

    // Map common items to beautiful static Unsplash photo URLs that are guaranteed to load
    if (lowerQuery.includes('led') || lowerQuery.includes('luz') || lowerQuery.includes('lamp') || lowerQuery.includes('luminaria')) {
      mainImg = 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80';
      galleryImgs = [
        'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&auto=format&fit=crop&q=80'
      ];
    } else if (lowerQuery.includes('fone') || lowerQuery.includes('audio') || lowerQuery.includes('headphone') || lowerQuery.includes('som') || lowerQuery.includes('auricular')) {
      mainImg = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80';
      galleryImgs = [
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80'
      ];
    } else if (lowerQuery.includes('projetor') || lowerQuery.includes('projector') || lowerQuery.includes('mini')) {
      mainImg = 'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&auto=format&fit=crop&q=80';
      galleryImgs = [
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1574267431647-8e6580f55cf8?w=600&auto=format&fit=crop&q=80'
      ];
    } else if (lowerQuery.includes('garrafa') || lowerQuery.includes('termica') || lowerQuery.includes('agua') || lowerQuery.includes('bottle')) {
      mainImg = 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80';
      galleryImgs = [
        'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1594911774802-8822a707caff?w=600&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600&auto=format&fit=crop&q=80'
      ];
    }

    if (lowerQuery.includes('led') || lowerQuery.includes('luz') || lowerQuery.includes('lamp') || lowerQuery.includes('luminaria')) {
      name = 'Candeeiro de Cristal Touch RGB LED (Recarregável)';
      category = 'Casa & Cozinha';
      originalPrice = 6.80;
      weight = 0.3;
      desc = 'Luminária de cristal acrílico premium com controle tátil inteligente e 16 cores RGB. Recarregável via USB-C, perfeita para criar atmosferas acolhedoras, quartos e salas de jantar.';
      sku = 'CJXTYY12948-CrystalTouch';
      cjProductId = 'CJ_PROD_12948_RGB';
      videoUrl = 'https://player.vimeo.com/external/459389137.sd.mp4?s=910dfda494951167909fc72e340c49746b1eb9fb&profile_id=139&oauth2_token_id=57447761';
      variants = [
        { id: 'CJ_VAR_RGB_16', name: 'Versão 16 Cores + Comando', price: 6.80, stock: 780 },
        { id: 'CJ_VAR_RGB_3', name: 'Versão 3 Cores Quente/Frio', price: 5.20, stock: 320 }
      ];
    } else if (lowerQuery.includes('fone') || lowerQuery.includes('audio') || lowerQuery.includes('headphone') || lowerQuery.includes('som') || lowerQuery.includes('auricular')) {
      name = 'Auscultadores Headset Pro Wireless ANC Bluetooth';
      category = 'Electrónica';
      originalPrice = 14.50;
      weight = 0.45;
      desc = 'Auscultadores circum-aurais de alta fidelidade com cancelamento ativo de ruído (ANC), microfone HD embutido para chamadas cristalinas e autonomia de bateria extraordinária até 40 horas.';
      sku = 'CJ-ANC-PRO-HEADSET';
      cjProductId = 'CJ_PROD_ANC_HEADSET';
      videoUrl = 'https://player.vimeo.com/external/340321301.sd.mp4?s=d009772ee7298642a8b941097fa6234b07cf968e&profile_id=139&oauth2_token_id=57447761';
      variants = [
        { id: 'CJ_VAR_ANC_BLK', name: 'Preto Matte (Matte Black)', price: 14.50, stock: 610 },
        { id: 'CJ_VAR_ANC_WHT', name: 'Branco Pérola (Pearl White)', price: 14.50, stock: 450 }
      ];
    } else if (lowerQuery.includes('projetor') || lowerQuery.includes('projector') || lowerQuery.includes('mini')) {
      name = 'Mini Projetor Portátil Smart-Pro 1080P Cinema-Mural';
      category = 'Electrónica';
      originalPrice = 38.00;
      weight = 1.1;
      desc = 'Mini projetor inteligente ultra-compacto com suporte a resolução Full HD, conexão Wi-Fi de alta velocidade e bluetooth para colunas adicionais. Faça um cinema na parede da sua casa.';
      sku = 'CJ-MINI-PROJ-1080P';
      cjProductId = 'CJ_PROD_MINI_PROJ';
      videoUrl = 'https://player.vimeo.com/external/484439077.sd.mp4?s=a7b3b3a37bfa6d91bb32c020f924df3db5455648&profile_id=139&oauth2_token_id=57447761';
      variants = [
        { id: 'CJ_VAR_PROJ_EU', name: 'Ficha Europeia (EU Plug)', price: 38.00, stock: 240 },
        { id: 'CJ_VAR_PROJ_UK', name: 'Ficha Reino Unido (UK Plug)', price: 39.50, stock: 120 }
      ];
    } else if (lowerQuery.includes('garrafa') || lowerQuery.includes('termica') || lowerQuery.includes('agua') || lowerQuery.includes('bottle')) {
      name = 'Garrafa Térmica Inteligente LED com Sensor de Temperatura';
      category = 'Casa & Cozinha';
      originalPrice = 7.90;
      weight = 0.38;
      desc = 'Garrafa térmica inteligente a vácuo em aço inoxidável cirúrgico com display digital LED integrado na tampa. Mostra a temperatura exata em tempo real com um simples toque.';
      sku = 'CJ-SMART-BOTTLE-LED';
      cjProductId = 'CJ_PROD_BOTTLE_LED';
      videoUrl = 'https://player.vimeo.com/external/554832560.sd.mp4?s=25d8b746813fc1f021e06fa49f1db1f94d9302bf&profile_id=139&oauth2_token_id=57447761';
      variants = [
        { id: 'CJ_VAR_BOT_BLK', name: 'Preto Ônix', price: 7.90, stock: 890 },
        { id: 'CJ_VAR_BOT_RED', name: 'Vermelho Rubi', price: 7.90, stock: 420 },
        { id: 'CJ_VAR_BOT_BLU', name: 'Azul Safira', price: 7.90, stock: 550 }
      ];
    } else {
      let parsedName = query.trim();
      if (parsedName.startsWith('http')) {
        try {
          const urlObj = new URL(parsedName);
          const pathParts = urlObj.pathname.split('/');
          const lastPart = pathParts[pathParts.length - 1] || 'item';
          parsedName = lastPart.replace(/-p-\d+\.html$/, '').replace(/-/g, ' ');
          parsedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
        } catch(e) {
          parsedName = 'Artigo Importado CJ';
        }
      }
      if (parsedName.length > 50) parsedName = parsedName.substring(0, 47) + '...';
      if (!parsedName || parsedName.length < 3) parsedName = 'Artigo Premium CJ Dropshipping';
      
      name = parsedName;
      category = 'Geral';
    }

    const productData = {
      name,
      category,
      originalPrice,
      weight,
      imageUrl: mainImg,
      images: [mainImg, ...galleryImgs],
      videoUrl,
      description: desc,
      sku,
      cjProductId,
      variants
    };

    res.json({ success: true, product: productData });
  });

  // 1d. Import Dropshipping Product
  app.post('/api/products/import', (req, res) => {
    const { name, category, originalPrice, sellingPrice, imageUrl, weight, sourcePlatform, description, productLink, images, videoUrl } = req.body;
    if (!name || !category || originalPrice === undefined) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios para importar o produto.' });
    }

    const basePrice = Number(originalPrice);
    let salePrice: number;
    if (sellingPrice !== undefined && sellingPrice !== null && !isNaN(Number(sellingPrice)) && Number(sellingPrice) > 0) {
      salePrice = Number(sellingPrice);
    } else {
      const markupMultiplier = 1 + (Number(shopSettings.profitMarginMarkup) / 100);
      salePrice = Math.round(basePrice * markupMultiplier * 100) / 100;
    }

    // Build the new product structure
    const proxiedImageUrl = getProxiedImageUrl(imageUrl);
    const proxiedImages = (images || []).map(getProxiedImageUrl);

    const newProduct: Product = {
      id: `p-dropship-${Date.now()}`,
      name,
      category,
      price: salePrice,
      image: proxiedImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      weight: Number(weight) || 0.5,
      description: {
        pt: description || `Produto premium importado via ${sourcePlatform || 'Dropshipping'}. Qualidade garantida.`,
        en: `Premium product imported via ${sourcePlatform || 'Dropshipping'}. Guaranteed quality.`,
        es: `Producto premium importado a través de ${sourcePlatform || 'Dropshipping'}. Calidad garantizada.`,
        fr: `Produit premium importé via ${sourcePlatform || 'Dropshipping'}. Qualité garantie.`
      },
      // Distribute stock across warehouses to make it immediately purchasable and trackable
      stock: {
        'wh-lis': Math.floor(40 + Math.random() * 30),
        'wh-mad': Math.floor(40 + Math.random() * 30),
        'wh-fra': Math.floor(50 + Math.random() * 50),
        'wh-cdg': Math.floor(40 + Math.random() * 30)
      },
      isDropshipped: true,
      originalPrice: basePrice,
      sourcePlatform: sourcePlatform || 'AliExpress',
      productLink: productLink || '',
      images: proxiedImages.length > 0 ? proxiedImages : (proxiedImageUrl ? [proxiedImageUrl] : []),
      videoUrl: videoUrl || ''
    };

    products.unshift(newProduct);

    // Create a success notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Produto Dropshipping Importado',
      message: `O produto "${name}" foi importado com sucesso do ${sourcePlatform || 'AliExpress'} com margem de lucro de ${shopSettings.profitMarginMarkup}% (Preço de venda: €${salePrice}).`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, product: newProduct });
  });

  // 1e. Direct CJ Webhook / Shopify Emulation Product Push Hook
  app.post('/api/webhooks/cj-import', (req, res) => {
    try {
      let name = '';
      let category = 'Geral';
      let originalPrice = 10.0;
      let description = '';
      let imageUrl = '';
      let images: string[] = [];
      let sku = '';
      let weight = 0.5;
      let videoUrl = '';
      let sourcePlatform = 'CJ Dropshipping';

      const body = req.body;

      // Detect Shopify-style push format
      if (body.product) {
        const prod = body.product;
        name = prod.title || '';
        description = prod.body_html || '';
        category = prod.product_type || 'Importado';
        
        if (prod.images && Array.isArray(prod.images)) {
          images = prod.images.map((img: any) => img.src || img.url).filter(Boolean);
          imageUrl = images[0] || '';
        } else if (prod.image) {
          imageUrl = prod.image.src || prod.image.url || '';
          images = [imageUrl];
        }

        if (prod.variants && Array.isArray(prod.variants) && prod.variants.length > 0) {
          const mainVar = prod.variants[0];
          originalPrice = Number(mainVar.price) || 10.0;
          sku = mainVar.sku || '';
          weight = Number(mainVar.weight) || 0.5;
        }
      } else {
        // Direct CJ or custom JSON format
        name = body.name || body.title || '';
        description = body.description || body.desc || '';
        category = body.category || 'Importado';
        imageUrl = body.imageUrl || body.image || '';
        images = body.images || (imageUrl ? [imageUrl] : []);
        sku = body.sku || body.product_sku || '';
        originalPrice = Number(body.price || body.originalPrice) || 10.0;
        weight = Number(body.weight) || 0.5;
        videoUrl = body.videoUrl || '';
        sourcePlatform = body.sourcePlatform || 'CJ Dropshipping';
      }

      if (!name) {
        return res.status(400).json({ error: 'Título do produto não fornecido.' });
      }

      // Proxy all incoming external images to avoid blank images!
      const proxiedImageUrl = getProxiedImageUrl(imageUrl);
      const proxiedImages = images.map(getProxiedImageUrl);

      const markupMultiplier = 1 + (Number(shopSettings.profitMarginMarkup) / 100);
      const salePrice = Math.round(originalPrice * markupMultiplier * 100) / 100;

      const newProduct: Product = {
        id: `p-cj-push-${Date.now()}`,
        name,
        category,
        price: salePrice,
        image: proxiedImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        weight: Number(weight) || 0.5,
        description: {
          pt: description || `Produto importado automaticamente via Direct Webhook CJ Dropshipping.`,
          en: `Product automatically imported via CJ Dropshipping Direct Webhook.`,
          es: `Producto importado automáticamente vía Webhook Directo de CJ Dropshipping.`,
          fr: `Produit importé automatiquement via le Webhook Direct CJ Dropshipping.`
        },
        stock: {
          'wh-lis': Math.floor(50 + Math.random() * 50),
          'wh-mad': Math.floor(40 + Math.random() * 50),
          'wh-fra': Math.floor(60 + Math.random() * 40),
          'wh-cdg': Math.floor(45 + Math.random() * 45)
        },
        isDropshipped: true,
        originalPrice: originalPrice,
        sourcePlatform,
        productLink: `https://cjdropshipping.com/product-detail.html?id=${sku}`,
        images: proxiedImages.length > 0 ? proxiedImages : (proxiedImageUrl ? [proxiedImageUrl] : []),
        videoUrl: videoUrl || ''
      };

      products.unshift(newProduct);

      // Push a notification
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Produto Recebido via Conexão CJ ⚡',
        message: `O produto "${name}" foi recebido e listado na sua loja automaticamente a partir do painel CJ Dropshipping.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      });

      res.status(201).json({ 
        success: true, 
        message: 'Produto importado via webhook com sucesso na Kivento!',
        product: newProduct 
      });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: 'Erro interno ao processar webhook da CJ: ' + (err as Error).message });
    }
  });

  // 1f. Shopify-Style OAuth and API Emulation for Direct CJ Dropshipping Integration
  // This allows the merchant to select "Shopify" inside the CJ Dropshipping panel, type their domain (kivento.pt or preview URL),
  // and have the integration connect successfully and import products automatically.

  // 1f_oauth_authorize: Handles the initial Shopify OAuth redirect from CJ Dropshipping
  app.get('/admin/oauth/authorize', (req, res) => {
    const { client_id, scope, redirect_uri, state, shop } = req.query;
    console.log(`Shopify OAuth Authorization requested for shop: ${shop}`);
    
    if (redirect_uri) {
      // Instantly authorize and redirect back with a dummy code and state
      const redirectUrl = `${redirect_uri}?code=dummy_shopify_token_123&state=${state}&shop=${shop}`;
      return res.redirect(redirectUrl);
    }
    
    res.status(400).send('Missing redirect_uri in Shopify OAuth handshake.');
  });

  // 1f_oauth_token: CJ Dropshipping backend exchanges the dummy code for an access token
  app.post('/admin/oauth/access_token', (req, res) => {
    console.log('Shopify OAuth Access Token requested by CJ Dropshipping backend');
    res.json({
      access_token: 'dummy_shopify_token_123',
      scope: 'write_products,read_products,write_orders,read_orders,write_inventory,read_inventory'
    });
  });

  // 1f_shop_info: CJ checks the shop details to confirm it's connected
  app.get('/admin/api/:version/shop.json', (req, res) => {
    res.json({
      shop: {
        id: 123456789,
        name: "Kivento",
        email: "suporte@kivento.pt",
        domain: "kivento.pt",
        myshopify_domain: "kivento.myshopify.com",
        country: "PT",
        province: "Lisboa",
        city: "Lisboa",
        currency: "EUR",
        money_format: "€{{amount}}",
        primary_locale: "pt"
      }
    });
  });

  // 1f_locations: CJ looks up locations to assign inventory
  app.get('/admin/api/:version/locations.json', (req, res) => {
    res.json({
      locations: [
        {
          id: 901234567,
          name: "Kivento Central Warehouse",
          address1: "Rua Central, Lisboa",
          city: "Lisboa",
          country: "PT",
          active: true
        }
      ]
    });
  });

  // 1f_products_get: CJ may verify existing products
  app.get('/admin/api/:version/products.json', (req, res) => {
    // Map our local products to Shopify-style products
    const shopifyProducts = products.map(p => ({
      id: Number(p.id.replace(/[^0-9]/g, '').substring(0, 9)) || 123456,
      title: p.name,
      body_html: p.description?.pt || '',
      vendor: p.sourcePlatform || 'CJ Dropshipping',
      product_type: p.category,
      images: (p.images || []).map((img, idx) => ({ id: idx, src: img })),
      variants: [
        {
          id: Number(p.id.replace(/[^0-9]/g, '').substring(1, 10)) || 654321,
          title: "Padrão",
          price: String(p.price),
          sku: p.id,
          inventory_quantity: Object.values(p.stock || {}).reduce((a, b) => a + b, 0)
        }
      ]
    }));
    res.json({ products: shopifyProducts });
  });

  // 1f_products_create: THIS IS CRITICAL! This is called when CJ "pushes/lists" a product from their panel!
  app.post('/admin/api/:version/products.json', (req, res) => {
    try {
      console.log('Shopify API - Product creation requested by CJ Dropshipping push action!');
      const { product } = req.body;
      if (!product) {
        return res.status(400).json({ error: 'Falta o objeto "product" no corpo da requisição.' });
      }

      const name = product.title || 'Produto Importado CJ';
      const description = product.body_html || '';
      const category = product.product_type || 'Geral';
      
      let imageUrl = '';
      let images: string[] = [];
      if (product.images && Array.isArray(product.images)) {
        images = product.images.map((img: any) => img.src || img.url).filter(Boolean);
        imageUrl = images[0] || '';
      } else if (product.image) {
        imageUrl = product.image.src || product.image.url || '';
        images = [imageUrl];
      }

      let originalPrice = 10.0;
      let sku = 'CJ-' + Math.floor(100000 + Math.random() * 900000);
      let weight = 0.5;

      if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
        const mainVar = product.variants[0];
        originalPrice = Number(mainVar.price) || 10.0;
        sku = mainVar.sku || sku;
        weight = Number(mainVar.weight) || 0.5;
      }

      const proxiedImageUrl = getProxiedImageUrl(imageUrl);
      const proxiedImages = images.map(getProxiedImageUrl);

      const markupMultiplier = 1 + (Number(shopSettings.profitMarginMarkup) / 100);
      const salePrice = Math.round(originalPrice * markupMultiplier * 100) / 100;

      const newProduct: Product = {
        id: `p-cj-push-${Date.now()}`,
        name,
        category,
        price: salePrice,
        image: proxiedImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        weight: Number(weight) || 0.5,
        description: {
          pt: description || `Produto importado automaticamente via Shopify API Emulation de CJ Dropshipping.`,
          en: `Product automatically imported via CJ Dropshipping Shopify API Emulation.`,
          es: `Producto importado automáticamente vía Emulación de Shopify de CJ Dropshipping.`,
          fr: `Produit importé automatiquement via l'émulation Shopify de CJ Dropshipping.`
        },
        stock: {
          'wh-lis': Math.floor(50 + Math.random() * 50),
          'wh-mad': Math.floor(40 + Math.random() * 50),
          'wh-fra': Math.floor(60 + Math.random() * 40),
          'wh-cdg': Math.floor(45 + Math.random() * 45)
        },
        isDropshipped: true,
        originalPrice: originalPrice,
        sourcePlatform: 'CJ Dropshipping',
        productLink: `https://cjdropshipping.com/product-detail.html?id=${sku}`,
        images: proxiedImages.length > 0 ? proxiedImages : (proxiedImageUrl ? [proxiedImageUrl] : []),
        videoUrl: ''
      };

      products.unshift(newProduct);

      // Add a success notification
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Produto Publicado Direto da CJ ⚡',
        message: `O produto "${name}" foi publicado diretamente do painel da CJ Dropshipping na sua loja Kivento com margem ativa.`,
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      });

      // Respond with a mock Shopify-style response so CJ knows it succeeded
      res.status(201).json({
        product: {
          id: Number(newProduct.id.replace(/[^0-9]/g, '').substring(0, 9)) || 123456,
          title: newProduct.name,
          body_html: newProduct.description.pt,
          variants: [
            {
              id: Number(newProduct.id.replace(/[^0-9]/g, '').substring(1, 10)) || 654321,
              price: String(newProduct.price),
              sku: sku,
              inventory_quantity: 200
            }
          ]
        }
      });
    } catch (err) {
      console.error('Shopify product creation emulation error:', err);
      res.status(500).json({ error: 'Internal server error in Shopify emulation.' });
    }
  });

  // 1f_webhooks: CJ may try to register or query webhooks
  app.post('/admin/api/:version/webhooks.json', (req, res) => {
    res.status(201).json({
      webhook: {
        id: 123456789,
        address: req.body.webhook?.address || '',
        topic: req.body.webhook?.topic || 'orders/create'
      }
    });
  });

  app.get('/admin/api/:version/webhooks.json', (req, res) => {
    res.json({ webhooks: [] });
  });

  // Edit / Update Product Details
  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, category, price, originalPrice, imageUrl, images, videoUrl, weight, description } = req.body;
    
    const prod = products.find(p => p.id === id);
    if (!prod) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    if (name !== undefined) prod.name = name;
    if (category !== undefined) prod.category = category;
    if (price !== undefined) prod.price = Number(price);
    if (originalPrice !== undefined) prod.originalPrice = Number(originalPrice);
    if (imageUrl !== undefined) prod.image = imageUrl;
    if (images !== undefined) prod.images = images;
    if (videoUrl !== undefined) prod.videoUrl = videoUrl;
    if (weight !== undefined) prod.weight = Number(weight);
    if (description !== undefined) {
      if (typeof description === 'object') {
        prod.description = { ...prod.description, ...description };
      } else {
        prod.description = {
          pt: description,
          en: description,
          es: description,
          fr: description
        };
      }
    }

    res.json({ success: true, product: prod });
  });

  // 1e. Delete Product
  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const removedProduct = products[index];
      products.splice(index, 1);

      // Create a notification
      notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'Produto Excluído',
        message: `O produto "${removedProduct.name}" foi removido com sucesso do catálogo.`,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      });

      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Produto não encontrado.' });
    }
  });

  // 2. Restock Product (Warehouse management feature)
  app.post('/api/products/restock', (req, res) => {
    const { productId, warehouseId, quantity } = req.body;
    const prod = products.find(p => p.id === productId);
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!prod.stock[warehouseId]) {
      prod.stock[warehouseId] = 0;
    }
    prod.stock[warehouseId] += Number(quantity);

    // Create a notification for low stock refilled
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: 'Restoque Realizado',
      message: `O produto "${prod.name}" foi abastecido em +${quantity} unidades no armazém ${warehouseId.toUpperCase()}.`,
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, product: prod });
  });

  // 3. Get Warehouses
  app.get('/api/warehouses', (req, res) => {
    res.json(WAREHOUSES);
  });

  // 4. Get Carriers
  app.get('/api/carriers', (req, res) => {
    res.json(CARRIERS);
  });

  // 5. Shipping Calculator & Warehouse Router
  app.post('/api/shipping/calculate', (req, res) => {
    const { countryCode, items } = req.body; // items: { productId: string, quantity: number }[]

    if (!countryCode || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const destination = COUNTRIES.find(c => c.code === countryCode);
    if (!destination) {
      return res.status(404).json({ error: 'Unsupported European country' });
    }

    // Calculate total weight of the order
    let totalWeight = 0;
    let orderPossible = true;
    const itemsWithInfo = items.map((cartItem: { productId: string, quantity: number }) => {
      const p = products.find(prod => prod.id === cartItem.productId);
      if (!p) {
        orderPossible = false;
        return null;
      }
      totalWeight += p.weight * cartItem.quantity;
      return { ...cartItem, weight: p.weight, price: p.price };
    }).filter(Boolean);

    if (!orderPossible || !itemsWithInfo.length) {
      return res.status(404).json({ error: 'Some products in the cart were not found' });
    }

    // Determine the optimal Warehouse:
    // Ideally, the one that has full stock for all products.
    // If multiple have stock, select the one closest to destination country.
    let bestWarehouse = WAREHOUSES[0];
    let minDistance = Infinity;
    let warehousesWithSufficientStock = WAREHOUSES.filter(wh => {
      return items.every((cartItem: { productId: string, quantity: number }) => {
        const prod = products.find(p => p.id === cartItem.productId);
        return prod && (prod.stock[wh.id] || 0) >= cartItem.quantity;
      });
    });

    // If no single warehouse has enough stock for all items, pick the closest warehouse that has stock for at least some,
    // or just the absolute closest warehouse to represent routing
    const targetWarehouses = warehousesWithSufficientStock.length > 0 ? warehousesWithSufficientStock : WAREHOUSES;
    
    targetWarehouses.forEach(wh => {
      const dist = getDistanceKm(wh.coords.lat, wh.coords.lng, destination.coords.lat, destination.coords.lng);
      if (dist < minDistance) {
        minDistance = dist;
        bestWarehouse = wh;
      }
    });

    // Calculate distance from selected optimal Warehouse to Country coordinates
    const distanceKm = getDistanceKm(bestWarehouse.coords.lat, bestWarehouse.coords.lng, destination.coords.lat, destination.coords.lng);

    // Calculate rates for all carriers
    const calculatedRates = CARRIERS.map(carrier => {
      const shippingCost = carrier.basePrice + (totalWeight * carrier.pricePerKg) + (distanceKm * carrier.pricePerKm);
      
      // Calculate transit days based on distance and speed factor
      // Speed min/max: DHL is fast, DPD standard, CTT/SEUR medium
      const distanceFactor = Math.ceil(distanceKm / 800); // 800km per day of transit approximately
      const estDaysMin = Math.max(carrier.speedDays.min, distanceFactor);
      const estDaysMax = Math.max(carrier.speedDays.max, distanceFactor + 1);

      return {
        carrierId: carrier.id,
        carrierName: carrier.name,
        cost: Math.round(shippingCost * 100) / 100,
        transitDays: { min: estDaysMin, max: estDaysMax },
        warehouseId: bestWarehouse.id,
        warehouseName: bestWarehouse.name,
        warehouseCity: bestWarehouse.city,
        distanceKm
      };
    });

    res.json({
      optimalWarehouse: bestWarehouse,
      distanceKm,
      totalWeight: Math.round(totalWeight * 100) / 100,
      rates: calculatedRates
    });
  });

  // 6. Checkout Order
  app.post('/api/checkout', (req, res) => {
    const {
      customerName,
      email,
      phone,
      address,
      postalCode,
      city,
      countryCode,
      items, // { productId: string, quantity: number }[]
      paymentMethod,
      paymentPhone,
      paymentCard,
      carrierId,
      warehouseId,
      shippingCost,
      currency,
      exchangeRate
    } = req.body;

    // Validate stock and decrement
    let hasStock = true;
    const orderItemsList = items.map((item: { productId: string, quantity: number }) => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod || (prod.stock[warehouseId] || 0) < item.quantity) {
        hasStock = false;
        return null;
      }
      return {
        productId: item.productId,
        name: prod.name,
        price: Math.round(prod.price * exchangeRate * 100) / 100,
        quantity: item.quantity,
        weight: prod.weight
      };
    }).filter(Boolean);

    if (!hasStock || orderItemsList.length !== items.length) {
      return res.status(400).json({ error: 'Erro de Estoque: Um ou mais produtos esgotaram no armazém de origem durante o checkout.' });
    }

    // Decrement stock
    items.forEach((item: { productId: string, quantity: number }) => {
      const prod = products.find(p => p.id === item.productId)!;
      prod.stock[warehouseId] -= item.quantity;
    });

    const subtotal = orderItemsList.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const total = subtotal + shippingCost;
    const trackingCode = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    const carrier = CARRIERS.find(c => c.id === carrierId)!;
    const wh = WAREHOUSES.find(w => w.id === warehouseId)!;

    // Set estimated delivery string
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3); // standard 3 days for simulation

    const newOrder: Order = {
      id: `ORD-${Math.floor(10000000 + Math.random() * 90000000)}`,
      customerName,
      email,
      phone,
      address,
      postalCode,
      city,
      country: countryCode,
      items: orderItemsList,
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: Math.round(shippingCost * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency,
      paymentMethod,
      paymentDetails: {
        phone: paymentPhone || undefined,
        cardNumber: paymentCard ? `**** **** **** ${paymentCard.slice(-4)}` : undefined
      },
      status: paymentMethod === 'mbway' ? 'pending_payment' : 'paid',
      carrierId,
      warehouseId,
      trackingCode,
      createdAt: new Date().toISOString(),
      estimatedDelivery: deliveryDate.toISOString(),
      currentCoords: { lat: wh.coords.lat, lng: wh.coords.lng }
    };

    orders.unshift(newOrder);

    // Initial Notification
    notifications.unshift({
      id: `notif-${Date.now()}`,
      title: paymentMethod === 'mbway' ? 'Pagamento Pendente' : 'Pagamento Confirmado',
      message: paymentMethod === 'mbway' 
        ? `Aguardando confirmação MB Way no número ${paymentPhone} para o pedido ${newOrder.id}.` 
        : `O seu pedido ${newOrder.id} de ${currency} ${newOrder.total} foi pago com sucesso!`,
      type: paymentMethod === 'mbway' ? 'warning' : 'success',
      timestamp: new Date().toISOString(),
      read: false
    });

    res.json({ success: true, order: newOrder });
  });

  // 7. Get Orders
  app.get('/api/orders', (req, res) => {
    res.json(orders);
  });

  // 8. Live Tracking API (combines routing and real-time simulator coordinates)
  app.get('/api/tracking/:code', (req, res) => {
    const { code } = req.params;
    const order = orders.find(o => o.trackingCode === code);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const wh = WAREHOUSES.find(w => w.id === order.warehouseId)!;
    const destCountry = COUNTRIES.find(c => c.code === order.country)!;
    const destCoords = destCountry.coords;

    // Simulate progress based on time since creation for tracking view
    const secondsSinceCreation = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
    
    let progress = 0;
    let computedStatus: OrderStatus = order.status;

    if (order.status !== 'pending_payment') {
      // In this demo, we make transit cycle fast for instant fun:
      // 0 - 5 seconds: Paid / Processing
      // 5 - 15 seconds: Ready / Processing
      // 15 - 45 seconds: Shipped & Moving
      // > 45 seconds: Delivered
      if (secondsSinceCreation < 5) {
        progress = 10;
        computedStatus = 'paid';
      } else if (secondsSinceCreation < 15) {
        progress = 25;
        computedStatus = 'processing';
      } else if (secondsSinceCreation < 55) {
        // Linear path interpolation
        const transitSecs = secondsSinceCreation - 15;
        progress = 30 + Math.min(65, Math.floor((transitSecs / 40) * 65));
        computedStatus = 'shipped';
      } else {
        progress = 100;
        computedStatus = 'delivered';
      }
    }

    // Update original order status if it changed
    if (order.status !== computedStatus && order.status !== 'failed') {
      const oldStatus = order.status;
      order.status = computedStatus;

      // Trigger standard notifications when status transitions
      if (computedStatus === 'paid' && oldStatus === 'pending_payment') {
        notifications.unshift({
          id: `notif-${Date.now()}`,
          title: 'Pagamento Aprovado',
          message: `O pagamento do seu pedido ${order.id} foi recebido!`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        });
      } else if (computedStatus === 'shipped') {
        notifications.unshift({
          id: `notif-${Date.now()}`,
          title: 'Pedido Enviado',
          message: `O pedido ${order.id} saiu do armazém ${wh.city} via ${CARRIERS.find(c => c.id === order.carrierId)!.name}!`,
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false
        });
      } else if (computedStatus === 'delivered') {
        notifications.unshift({
          id: `notif-${Date.now()}`,
          title: 'Pedido Entregue',
          message: `Encomenda ${order.id} entregue com sucesso! Obrigado por comprar connosco.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }

    // Interpolate coordinates
    const latDiff = destCoords.lat - wh.coords.lat;
    const lngDiff = destCoords.lng - wh.coords.lng;
    const currentCoords = {
      lat: wh.coords.lat + (latDiff * (progress / 100)),
      lng: wh.coords.lng + (lngDiff * (progress / 100))
    };

    // Save back to order
    order.currentCoords = currentCoords;

    const carrier = CARRIERS.find(c => c.id === order.carrierId)!;

    const tracking: TrackingData = {
      orderId: order.id,
      trackingCode: order.trackingCode,
      carrierId: order.carrierId,
      warehouseId: order.warehouseId,
      originCoords: wh.coords,
      destinationCoords: destCoords,
      currentCoords,
      status: computedStatus,
      checkpoints: generateCheckpoints(computedStatus, progress, carrier.name, wh.city, order.city, order.createdAt),
      progress
    };

    res.json(tracking);
  });

  // 9. Analytics/Performance reports
  app.get('/api/analytics', (req, res) => {
    // Compile regional analytics based on mock history + actual user orders
    const salesByCountry: Record<string, { count: number; revenue: number; totalShipping: number }> = {
      PT: { count: 184, revenue: 16540.20, totalShipping: 1104.00 },
      ES: { count: 142, revenue: 14890.50, totalShipping: 1022.40 },
      DE: { count: 210, revenue: 25430.80, totalShipping: 2150.00 },
      FR: { count: 168, revenue: 19820.40, totalShipping: 1545.60 },
      IT: { count: 95, revenue: 8900.50, totalShipping: 980.20 }
    };

    // Blend user orders into regional stats
    orders.forEach(o => {
      const country = o.country || 'PT';
      if (!salesByCountry[country]) {
        salesByCountry[country] = { count: 0, revenue: 0, totalShipping: 0 };
      }
      salesByCountry[country].count += 1;
      salesByCountry[country].revenue += o.subtotal;
      salesByCountry[country].totalShipping += o.shippingCost;
    });

    const reports: RegionReport[] = Object.keys(salesByCountry).map(code => {
      const countryObj = COUNTRIES.find(c => c.code === code) || { name: { pt: code, en: code, es: code, fr: code } };
      const stats = salesByCountry[code];
      return {
        countryCode: code,
        countryName: countryObj.name,
        sales: Math.round(stats.revenue * 100) / 100,
        orderCount: stats.count,
        avgShippingCost: stats.count > 0 ? Math.round((stats.totalShipping / stats.count) * 100) / 100 : 0,
        avgDeliveryDays: code === 'PT' || code === 'ES' ? 2 : 3
      };
    });

    // Compute warehouse capacity metrics
    const warehouseCapacities = WAREHOUSES.map(wh => {
      // Calculate active stock
      let activeStock = 0;
      products.forEach(p => {
        activeStock += p.stock[wh.id] || 0;
      });

      return {
        warehouseId: wh.id,
        name: wh.name,
        city: wh.city,
        activeStock,
        capacity: wh.capacity,
        occupancyRate: Math.round((activeStock / wh.capacity) * 100 * 10) / 10
      };
    });

    res.json({
      regionalPerformance: reports,
      warehouseMetrics: warehouseCapacities,
      totalRevenue: Math.round(reports.reduce((acc, r) => acc + r.sales, 0) * 100) / 100,
      totalOrders: reports.reduce((acc, r) => acc + r.orderCount, 0)
    });
  });

  // 10. Notifications endpoint
  app.get('/api/notifications', (req, res) => {
    res.json(notifications);
  });

  app.post('/api/notifications/read-all', (req, res) => {
    notifications.forEach(n => n.read = true);
    res.json({ success: true });
  });

  // Background Auto-Approver for MB Way orders
  setInterval(() => {
    orders.forEach(o => {
      if (o.status === 'pending_payment') {
        const secondsSinceCreation = (Date.now() - new Date(o.createdAt).getTime()) / 1000;
        // Approve payment after 5 seconds automatically to keep demo interactive
        if (secondsSinceCreation >= 5) {
          o.status = 'paid';
          notifications.unshift({
            id: `notif-${Date.now()}`,
            title: 'Pagamento Aprovado',
            message: `O pagamento do seu pedido ${o.id} via MB Way foi processado com sucesso!`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false
          });
        }
      }
    });
  }, 3000);

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

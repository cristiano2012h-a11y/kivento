import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PRODUCTS, WAREHOUSES, CARRIERS, COUNTRIES } from './src/data/mockData';
import { Product, Order, OrderStatus, TrackingData, TrackingCheckpoint, RegionReport, PromoBanner } from './src/types';

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
    subtitle: 'Preços de fábrica sem intermediários, enviados diretamente para toda a Europa com envio expresso gratuito para Portugal!',
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
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
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

  // 1d. Import Dropshipping Product
  app.post('/api/products/import', (req, res) => {
    const { name, category, originalPrice, imageUrl, weight, sourcePlatform, description } = req.body;
    if (!name || !category || originalPrice === undefined) {
      return res.status(400).json({ error: 'Faltam campos obrigatórios para importar o produto.' });
    }

    const basePrice = Number(originalPrice);
    const markupMultiplier = 1 + (Number(shopSettings.profitMarginMarkup) / 100);
    const salePrice = Math.round(basePrice * markupMultiplier * 100) / 100;

    // Build the new product structure
    const newProduct: Product = {
      id: `p-dropship-${Date.now()}`,
      name,
      category,
      price: salePrice,
      image: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
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
      sourcePlatform: sourcePlatform || 'AliExpress'
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

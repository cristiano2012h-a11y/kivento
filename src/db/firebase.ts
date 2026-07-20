import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { Product, Order, PromoBanner } from '../types.js';
import { INITIAL_PRODUCTS } from '../data/mockData.js';

let db: Firestore | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

export const isFirebaseConfigured = !!(projectId && clientEmail && privateKey);

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      const formattedPrivateKey = privateKey!.replace(/\\n/g, '\n');
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
      });
    }
    db = getFirestore();
    console.log('🔥 Firebase Admin / Firestore initialized successfully!');
    
    // Asynchronous seed check
    seedDefaultDataIfEmpty().catch(err => {
      console.error('Error seeding default Firestore data:', err);
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
} else {
  console.log('ℹ️ Firebase credentials not complete (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Using in-memory store.');
}

async function seedDefaultDataIfEmpty() {
  if (!db) return;
  
  // 1. Products
  const productsRef = db.collection('products');
  const snapshot = await productsRef.limit(1).get();
  if (snapshot.empty) {
    console.log('🌱 Seeding default products into Firestore...');
    const batch = db.batch();
    INITIAL_PRODUCTS.forEach((prod) => {
      const docRef = productsRef.doc(prod.id);
      batch.set(docRef, prod);
    });
    await batch.commit();
    console.log('✅ Default products seeded!');
  }

  // 2. Banners
  const bannersRef = db.collection('banners');
  const bannersSnapshot = await bannersRef.limit(1).get();
  if (bannersSnapshot.empty) {
    console.log('🌱 Seeding default banners into Firestore...');
    const initialBanners: PromoBanner[] = [
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

    const batch = db.batch();
    initialBanners.forEach((banner) => {
      const docRef = bannersRef.doc(banner.id);
      batch.set(docRef, banner);
    });
    await batch.commit();
    console.log('✅ Default banners seeded!');
  }

  // 3. Settings
  const settingsRef = db.collection('settings');
  
  const shopDoc = await settingsRef.doc('shop').get();
  if (!shopDoc.exists) {
    await settingsRef.doc('shop').set({
      bankName: 'Kivento Bank (Caixa Geral de Depósitos)',
      accountHolder: 'Kivento Lda',
      iban: 'PT50 0035 0123 4567 8901 2345 6',
      swift: 'CGDIPTPLXXX',
      mbwayPhone: '912345678',
      profitMarginMarkup: 30
    });
  }

  const cjDoc = await settingsRef.doc('cj').get();
  if (!cjDoc.exists) {
    await settingsRef.doc('cj').set({
      isConnected: false,
      apiKey: '',
      storeId: '',
      cjEmail: '',
      autoSyncOrders: true,
      autoSyncInventory: true
    });
  }

  const domainDoc = await settingsRef.doc('domain').get();
  if (!domainDoc.exists) {
    await settingsRef.doc('domain').set({
      customDomain: 'kivento.pt',
      status: 'active',
      dnsType: 'A',
      dnsHost: '@',
      dnsValue: '216.239.32.21',
      dnsValue2: '216.239.34.21',
      dnsValue3: '216.239.36.21',
      dnsValue4: '216.239.38.21',
      cnameHost: 'www',
      cnameValue: 'ghs.googlehosted.com'
    });
  }
}

// Data Access API
export async function getProducts(localFallback: Product[]): Promise<Product[]> {
  if (!db) return localFallback;
  try {
    const snapshot = await db.collection('products').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data() as Product);
  } catch (err) {
    console.error('Firebase error in getProducts:', err);
    return localFallback;
  }
}

export async function saveProduct(product: Product): Promise<void> {
  if (!db) return;
  try {
    await db.collection('products').doc(product.id).set(product);
  } catch (err) {
    console.error('Firebase error in saveProduct:', err);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  if (!db) return;
  try {
    await db.collection('products').doc(productId).delete();
  } catch (err) {
    console.error('Firebase error in deleteProduct:', err);
  }
}

export async function getOrders(localFallback: Order[]): Promise<Order[]> {
  if (!db) return localFallback;
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data() as Order);
  } catch (err) {
    console.error('Firebase error in getOrders:', err);
    return localFallback;
  }
}

export async function saveOrder(order: Order): Promise<void> {
  if (!db) return;
  try {
    await db.collection('orders').doc(order.id).set(order);
  } catch (err) {
    console.error('Firebase error in saveOrder:', err);
  }
}

export async function getNotifications(localFallback: any[]): Promise<any[]> {
  if (!db) return localFallback;
  try {
    const snapshot = await db.collection('notifications').orderBy('timestamp', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error('Firebase error in getNotifications:', err);
    return localFallback;
  }
}

export async function saveNotification(notif: any): Promise<void> {
  if (!db) return;
  try {
    await db.collection('notifications').doc(notif.id).set(notif);
  } catch (err) {
    console.error('Firebase error in saveNotification:', err);
  }
}

export async function markNotificationsAsRead(): Promise<void> {
  if (!db) return;
  try {
    const snapshot = await db.collection('notifications').where('read', '==', false).get();
    if (snapshot.empty) return;
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('Firebase error in markNotificationsAsRead:', err);
  }
}

export async function getPromoBanners(localFallback: PromoBanner[]): Promise<PromoBanner[]> {
  if (!db) return localFallback;
  try {
    const snapshot = await db.collection('banners').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data() as PromoBanner);
  } catch (err) {
    console.error('Firebase error in getPromoBanners:', err);
    return localFallback;
  }
}

export async function savePromoBanner(banner: PromoBanner): Promise<void> {
  if (!db) return;
  try {
    await db.collection('banners').doc(banner.id).set(banner);
  } catch (err) {
    console.error('Firebase error in savePromoBanner:', err);
  }
}

export async function deletePromoBanner(bannerId: string): Promise<void> {
  if (!db) return;
  try {
    await db.collection('banners').doc(bannerId).delete();
  } catch (err) {
    console.error('Firebase error in deletePromoBanner:', err);
  }
}

export async function getSettings(localFallback: any, key: 'shop' | 'cj' | 'domain'): Promise<any> {
  if (!db) return localFallback;
  try {
    const doc = await db.collection('settings').doc(key).get();
    if (!doc.exists) return localFallback;
    return doc.data();
  } catch (err) {
    console.error(`Firebase error in getSettings (${key}):`, err);
    return localFallback;
  }
}

export async function saveSettings(key: 'shop' | 'cj' | 'domain', settings: any): Promise<void> {
  if (!db) return;
  try {
    await db.collection('settings').doc(key).set(settings, { merge: true });
  } catch (err) {
    console.error(`Firebase error in saveSettings (${key}):`, err);
  }
}

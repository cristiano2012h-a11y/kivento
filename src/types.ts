export interface Product {
  id: string;
  name: string;
  description: Record<string, string>; // Multi-language descriptions
  price: number; // base price in EUR
  image: string;
  weight: number; // in kg
  category: string;
  stock: Record<string, number>; // warehouseId -> quantity
  isDropshipped?: boolean;
  originalPrice?: number;
  sourcePlatform?: string;
  productLink?: string;
  images?: string[];
  videoUrl?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  coords: { lat: number; lng: number };
  code: string;
  capacity: number;
}

export interface Carrier {
  id: string;
  name: string;
  logo: string;
  basePrice: number;
  pricePerKg: number;
  pricePerKm: number;
  speedDays: { min: number; max: number };
}

export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'failed';

export interface OrderItem {
  productId: string;
  name: string;
  price: number; // price at checkout
  quantity: number;
  weight: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string; // country code (e.g. PT, ES, DE, FR)
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  paymentMethod: 'mbway' | 'card';
  paymentDetails: {
    phone?: string;
    cardNumber?: string;
  };
  status: OrderStatus;
  carrierId: string;
  warehouseId: string;
  trackingCode: string;
  createdAt: string;
  estimatedDelivery: string;
  currentCoords?: { lat: number; lng: number };
}

export interface TrackingCheckpoint {
  status: OrderStatus | 'transit';
  description: Record<string, string>;
  timestamp: string;
  coords?: { lat: number; lng: number };
}

export interface TrackingData {
  orderId: string;
  trackingCode: string;
  carrierId: string;
  warehouseId: string;
  originCoords: { lat: number; lng: number };
  destinationCoords: { lat: number; lng: number };
  currentCoords: { lat: number; lng: number };
  status: OrderStatus;
  checkpoints: TrackingCheckpoint[];
  progress: number; // 0 to 100
}

export interface RegionReport {
  countryCode: string;
  countryName: Record<string, string>;
  sales: number;
  orderCount: number;
  avgShippingCost: number;
  avgDeliveryDays: number;
}

export interface PromoBanner {
  id: string;
  badgeText: string;
  badgeBg: string; // e.g. 'bg-yellow-400 text-slate-900'
  title: string;
  subtitle: string;
  gradientFrom: string; // Tailwind class name or custom color hex
  gradientVia?: string;
  gradientTo: string;
  isActive: boolean;
}

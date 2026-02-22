/**
 * KiranaConnect — Session & Local state (Application data now in MongoDB)
 */

// ============ TYPES ============

export interface OwnerProfile {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  password: string;
}

export interface Shop {
  _id?: string;
  ownerId: string;
  shopName: string;
  shopType: string;
  shopPhoto: string;
  address: {
    houseNumber: string;
    area: string;
    landmark: string;
    pinCode: string;
  };
  gpsLocation: string;
  openingTime: string;
  closingTime: string;
  weeklyOff: string;
}

export interface Product {
  id: string; // Used for UI keying
  _id?: string; // MongoDB ID
  shopOwnerId: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  _id?: string;
  id?: string;
  customerId: string;
  customerName: string;
  shopOwnerId: string;
  items: any[];
  totalPrice: number;
  status: 'New' | 'Accepted' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
  shopDetails?: {
    shopName: string;
    shopType: string;
  };
  deliveryAgentName?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  orderId?: string;
}

export interface CustomerProfile {
  id: string;
  mobile: string;
  name: string;
  email?: string;
}

export interface AdminProfile {
  email: string;
  name: string;
  phone?: string;
  photo?: string;
}

// ============ HELPERS ============

const get = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
};

const set = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const generateId = () => Math.random().toString(36).substring(2, 10);

// ============ SESSION MANAGEMENT ============

export const getOwnerProfile = (): OwnerProfile | null => get('kc_owner', null);
export const saveOwnerProfile = (p: OwnerProfile) => set('kc_owner', p);

export const getCustomerProfile = (): CustomerProfile | null => get('kc_customer', null);
export const saveCustomerProfile = (c: CustomerProfile) => set('kc_customer', c);

export const getAdminProfile = (): AdminProfile | null => get('kc_admin_profile', null);
export const saveAdminProfile = (profile: AdminProfile) => set('kc_admin_profile', profile);

// Application data (Shops, Products, Orders, Cart, etc.) is now managed exclusively via MongoDB.

/**
 * KiranaConnect — Session & Local state (Application data now in MongoDB)
 */

/* ================= TYPES ================= */

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
  id: string;
  _id?: string;
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
  status:
    | "New"
    | "Accepted"
    | "Preparing"
    | "Ready for Pickup"
    | "Out for Delivery"
    | "Delivered";
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

/* ================= HELPERS ================= */

const get = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const set = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const generateId = () =>
  Math.random().toString(36).substring(2, 10);

/* ================= SESSION ================= */

export const getOwnerProfile = (): OwnerProfile | null =>
  get("kc_owner", null);

export const saveOwnerProfile = (p: OwnerProfile) =>
  set("kc_owner", p);

export const getCustomerProfile = (): CustomerProfile | null =>
  get("kc_customer", null);

export const saveCustomerProfile = (c: CustomerProfile) =>
  set("kc_customer", c);

export const getAdminProfile = (): AdminProfile | null =>
  get("kc_admin_profile", null);

export const saveAdminProfile = (profile: AdminProfile) =>
  set("kc_admin_profile", profile);

/* ================= SHOP ================= */

export const getShop = (): Shop | null =>
  get("kc_shop", null);

export const saveShop = (shop: Shop) =>
  set("kc_shop", shop);

/* ================= PRODUCTS ================= */

export const getProducts = (): Product[] =>
  get("kc_products", []);

export const saveProducts = (products: Product[]) =>
  set("kc_products", products);

/* ================= CART ================= */

export const getCart = (): CartItem[] =>
  get("kc_cart", []);

export const saveCart = (cart: CartItem[]) =>
  set("kc_cart", cart);

export const clearCart = () =>
  set("kc_cart", []);

/* ================= ORDERS ================= */

export const getOrders = (): Order[] =>
  get("kc_orders", []);

export const saveOrders = (orders: Order[]) =>
  set("kc_orders", orders);

/* ================= NOTIFICATIONS ================= */

export const getNotifications = (): Notification[] =>
  get("kc_notifications", []);

export const saveNotifications = (notifications: Notification[]) =>
  set("kc_notifications", notifications);
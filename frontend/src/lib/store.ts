/**
 * KiranaConnect — localStorage Data Store
 * 
 * DATA FLOW:
 * - Owner registers → saves profile to localStorage
 * - Owner sets up shop → saves shop details
 * - Owner adds products → products stored per shop
 * - Customer browses → reads products where available=true
 * - Customer adds to cart → cart stored in localStorage
 * - Customer places order → order stored, notification created for owner
 * - Owner updates order status → customer gets notification
 * 
 * NOTIFICATION SYSTEM:
 * - Notifications are stored as arrays per role
 * - When customer places order → push to owner notifications
 * - When owner changes status → push to customer notifications
 * - Badge count = unread notifications count
 * 
 * TOGGLE VISIBILITY:
 * - Each product has `available: boolean`
 * - Owner toggles it on product management page
 * - Customer product page filters: products.filter(p => p.available)
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
  shopOwnerId: string;
  name: string;
  price: number;
  available: boolean;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  shopOwnerId: string;
  items: CartItem[];
  totalPrice: number;
  status: 'New' | 'Accepted' | 'Preparing' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
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

export interface CustomerAddress {
  id: string;
  customerId: string;
  houseNumber: string;
  street: string;
  landmark: string;
  pinCode: string;
  gpsLocation: string;
  label: 'Home' | 'Office' | 'Other';
}

export interface Rating {
  id: string;
  orderId: string;
  customerId: string;
  storeRating: number;
  deliveryRating: number;
  feedback: string;
  createdAt: string;
}

export interface SavedList {
  id: string;
  customerId: string;
  name: string;
  productIds: string[];
  createdAt: string;
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

// ============ OWNER ============

export const getOwnerProfile = (): OwnerProfile | null => get('kc_owner', null);
export const saveOwnerProfile = (p: OwnerProfile) => set('kc_owner', p);

export const getShop = (): Shop | null => get('kc_shop', null);
export const saveShop = (s: Shop) => set('kc_shop', s);

// ============ PRODUCTS ============

export const getProducts = (): Product[] => get('kc_products', []);
export const saveProducts = (p: Product[]) => set('kc_products', p);

export const addProduct = (p: Product) => {
  const products = getProducts();
  products.push(p);
  saveProducts(products);
};

export const updateProduct = (id: string, updates: Partial<Product>) => {
  const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
  saveProducts(products);
};

export const deleteProduct = (id: string) => {
  saveProducts(getProducts().filter(p => p.id !== id));
};

// ============ ORDERS ============

export const getOrders = (): Order[] => get('kc_orders', []);
export const saveOrders = (o: Order[]) => set('kc_orders', o);

export const addOrder = (o: Order) => {
  const orders = getOrders();
  orders.unshift(o);
  saveOrders(orders);
};

export const updateOrderStatus = (orderId: string, status: Order['status']) => {
  const orders = getOrders().map(o => o.id === orderId ? { ...o, status } : o);
  saveOrders(orders);
};

// ============ CART ============

export const getCart = (): CartItem[] => get('kc_cart', []);
export const saveCart = (c: CartItem[]) => set('kc_cart', c);
export const clearCart = () => localStorage.removeItem('kc_cart');

// ============ NOTIFICATIONS ============

export const getOwnerNotifications = (): Notification[] => get('kc_owner_notifs', []);
export const saveOwnerNotifications = (n: Notification[]) => set('kc_owner_notifs', n);

export const getCustomerNotifications = (): Notification[] => get('kc_customer_notifs', []);
export const saveCustomerNotifications = (n: Notification[]) => set('kc_customer_notifs', n);

export const addOwnerNotification = (msg: string, orderId?: string) => {
  const notifs = getOwnerNotifications();
  notifs.unshift({ id: generateId(), message: msg, read: false, createdAt: new Date().toISOString(), orderId });
  saveOwnerNotifications(notifs);
};

export const addCustomerNotification = (msg: string, orderId?: string) => {
  const notifs = getCustomerNotifications();
  notifs.unshift({ id: generateId(), message: msg, read: false, createdAt: new Date().toISOString(), orderId });
  saveCustomerNotifications(notifs);
};

export const markOwnerNotifsRead = () => {
  saveOwnerNotifications(getOwnerNotifications().map(n => ({ ...n, read: true })));
};

export const markCustomerNotifsRead = () => {
  saveCustomerNotifications(getCustomerNotifications().map(n => ({ ...n, read: true })));
};

// ============ CUSTOMER ============

export const getCustomerProfile = (): CustomerProfile | null => get('kc_customer', null);
export const saveCustomerProfile = (c: CustomerProfile) => set('kc_customer', c);

// ============ CUSTOMER ADDRESSES ============

export const getCustomerAddresses = (): CustomerAddress[] => get('kc_addresses', []);
export const saveCustomerAddresses = (a: CustomerAddress[]) => set('kc_addresses', a);
export const addCustomerAddress = (a: CustomerAddress) => {
  const addrs = getCustomerAddresses();
  addrs.push(a);
  saveCustomerAddresses(addrs);
};

// ============ RATINGS ============

export const getRatings = (): Rating[] => get('kc_ratings', []);
export const saveRating = (r: Rating) => {
  const ratings = getRatings();
  ratings.push(r);
  set('kc_ratings', ratings);
};
export const getRatingForOrder = (orderId: string): Rating | undefined =>
  getRatings().find(r => r.orderId === orderId);

// ============ SAVED LISTS ============

export const getSavedLists = (): SavedList[] => get('kc_saved_lists', []);
export const saveSavedLists = (l: SavedList[]) => set('kc_saved_lists', l);
export const addSavedList = (l: SavedList) => {
  const lists = getSavedLists();
  lists.push(l);
  saveSavedLists(lists);
};
export const deleteSavedList = (id: string) => {
  saveSavedLists(getSavedLists().filter(l => l.id !== id));
};

// ============ SEED DATA ============

export const seedDemoData = () => {
  // Only seed if no products exist
  if (getProducts().length > 0) return;
  
  const demoOwner: OwnerProfile = {
    id: 'owner1',
    fullName: 'Rajesh Kumar',
    mobile: '9876543210',
    email: 'rajesh@example.com',
    password: '1234',
  };
  
  const demoShop: Shop = {
    ownerId: 'owner1',
    shopName: 'Rajesh General Store',
    shopType: 'General Store',
    shopPhoto: '',
    address: { houseNumber: '42', area: 'MG Road', landmark: 'Near Bus Stand', pinCode: '560001' },
    gpsLocation: '12.9716, 77.5946',
    openingTime: '07:00',
    closingTime: '21:00',
    weeklyOff: 'Sunday',
  };
  
  const demoProducts: Product[] = [
    { id: 'p1', shopOwnerId: 'owner1', name: 'Toor Dal (1kg)', price: 140, available: true, category: 'Pulses' },
    { id: 'p2', shopOwnerId: 'owner1', name: 'Basmati Rice (5kg)', price: 450, available: true, category: 'Rice' },
    { id: 'p3', shopOwnerId: 'owner1', name: 'Amul Butter (500g)', price: 280, available: true, category: 'Dairy' },
    { id: 'p4', shopOwnerId: 'owner1', name: 'Sugar (1kg)', price: 48, available: true, category: 'Essentials' },
    { id: 'p5', shopOwnerId: 'owner1', name: 'Sunflower Oil (1L)', price: 180, available: true, category: 'Oil' },
    { id: 'p6', shopOwnerId: 'owner1', name: 'Wheat Flour (5kg)', price: 220, available: true, category: 'Flour' },
    { id: 'p7', shopOwnerId: 'owner1', name: 'Tea Powder (250g)', price: 120, available: false, category: 'Beverages' },
    { id: 'p8', shopOwnerId: 'owner1', name: 'Milk (1L)', price: 60, available: true, category: 'Dairy' },
    { id: 'p9', shopOwnerId: 'owner1', name: 'Onion (1kg)', price: 35, available: true, category: 'Vegetables' },
    { id: 'p10', shopOwnerId: 'owner1', name: 'Maggi Noodles (4 pack)', price: 56, available: true, category: 'Snacks' },
  ];
  
  saveOwnerProfile(demoOwner);
  saveShop(demoShop);
  saveProducts(demoProducts);
};

// Initialize seed data on first load
seedDemoData();

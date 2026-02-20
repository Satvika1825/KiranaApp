const API_URL = 'http://localhost:5000/api';

export const api = {
    // ============ AUTH ============
    auth: {
        sendOtp: async (mobile: string) => {
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile }),
            });
            if (!res.ok) throw new Error('Failed to send OTP');
            return res.json();
        },
        verifyOtp: async (mobile: string, otp: string, name?: string, email?: string, role?: string, password?: string) => {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, otp, name, email, role, password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.details || 'Failed to verify OTP');
            }
            return res.json();
        },
        registerOwner: async (data: { fullName: string; mobile: string; email?: string; password?: string }) => {
            const res = await fetch(`${API_URL}/auth/register-owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to register owner');
            return res.json();
        },
        loginOwner: async (mobile: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/login-owner`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to login');
            }
            return res.json();
        },
        loginCustomer: async (mobile: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/login-customer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to login');
            }
            return res.json();
        },
    },

    // ============ STORES ============
    stores: {
        create: async (data: any) => {
            const res = await fetch(`${API_URL}/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save store');
            return res.json();
        },
        getAll: async () => {
            const res = await fetch(`${API_URL}/stores`);
            if (!res.ok) throw new Error('Failed to fetch stores');
            return res.json();
        },
        getByOwner: async (ownerId: string) => {
            const res = await fetch(`${API_URL}/stores/owner/${ownerId}`);
            if (!res.ok) throw new Error('Failed to fetch store');
            return res.json();
        },
        getById: async (storeId: string) => {
            const res = await fetch(`${API_URL}/stores/${storeId}`);
            if (!res.ok) throw new Error('Failed to fetch store');
            return res.json();
        },
    },

    // ============ PRODUCTS ============
    products: {
        getCatalog: async () => {
            const res = await fetch(`${API_URL}/products/catalog`);
            if (!res.ok) throw new Error('Failed to fetch catalog');
            return res.json();
        },
        seedCatalog: async () => {
            const res = await fetch(`${API_URL}/products/catalog/seed`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to seed catalog');
            return res.json();
        },
        toggleCatalogProduct: async (catalogProductId: string, ownerId: string, enabled: boolean, price?: number) => {
            const res = await fetch(`${API_URL}/products/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ catalogProductId, ownerId, enabled, price }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Toggle failed');
            }
            return res.json();
        },
        getAll: async (shopOwnerId?: string, category?: string, search?: string) => {
            const params = new URLSearchParams();
            if (shopOwnerId) params.set('shopOwnerId', shopOwnerId);
            if (category && category !== 'All') params.set('category', category);
            if (search) params.set('search', search);
            const res = await fetch(`${API_URL}/products?${params}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
        },
        getById: async (productId: string) => {
            const res = await fetch(`${API_URL}/products/${productId}`);
            if (!res.ok) throw new Error('Failed to fetch product');
            return res.json();
        },
        create: async (product: any) => {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product),
            });
            if (!res.ok) throw new Error('Failed to add product');
            return res.json();
        },
        update: async (productId: string, updates: any) => {
            const res = await fetch(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update product');
            return res.json();
        },
        delete: async (productId: string) => {
            const res = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete product');
            return res.json();
        },
        bulkSave: async (products: any[]) => {
            const res = await fetch(`${API_URL}/products/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products }),
            });
            if (!res.ok) throw new Error('Failed to bulk save products');
            return res.json();
        },
        getCategories: async (shopOwnerId?: string) => {
            const params = new URLSearchParams();
            if (shopOwnerId) params.set('shopOwnerId', shopOwnerId);
            const res = await fetch(`${API_URL}/products/categories?${params}`);
            if (!res.ok) throw new Error('Failed to fetch categories');
            return res.json();
        },
    },

    // ============ CART ============
    cart: {
        get: async (userId: string) => {
            const res = await fetch(`${API_URL}/cart/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch cart');
            return res.json();
        },
        update: async (userId: string, items: any[]) => {
            const res = await fetch(`${API_URL}/cart/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items }),
            });
            if (!res.ok) throw new Error('Failed to update cart');
            return res.json();
        },
        clear: async (userId: string) => {
            const res = await fetch(`${API_URL}/cart/${userId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to clear cart');
            return res.json();
        },
        add: async (userId: string, item: any) => {
            const res = await fetch(`${API_URL}/cart/${userId}/item`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (!res.ok) throw new Error('Failed to add item to cart');
            return res.json();
        },
    },

    // ============ ORDERS ============
    orders: {
        place: async (orderData: any) => {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            if (!res.ok) throw new Error('Failed to place order');
            return res.json();
        },
        getByCustomer: async (customerId: string) => {
            const res = await fetch(`${API_URL}/orders/customer/${customerId}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        getByOwner: async (shopOwnerId: string) => {
            const res = await fetch(`${API_URL}/orders/owner/${shopOwnerId}`);
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        getDetail: async (orderId: string) => {
            const res = await fetch(`${API_URL}/orders/detail/${orderId}`);
            if (!res.ok) throw new Error('Failed to fetch order');
            return res.json();
        },
        updateStatus: async (orderId: string, status: string) => {
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error('Failed to update order status');
            return res.json();
        },
    },

    // ============ CUSTOMER ============
    customer: {
        saveProfile: async (data: { userId: string; mobile: string; name: string; email?: string }) => {
            const res = await fetch(`${API_URL}/customer/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to save profile');
            return res.json();
        },
        getProfile: async (userId: string) => {
            const res = await fetch(`${API_URL}/customer/profile/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        addAddress: async (data: any) => {
            const res = await fetch(`${API_URL}/customer/address`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to add address');
            return res.json();
        },
        getAddresses: async (userId: string) => {
            const res = await fetch(`${API_URL}/customer/addresses/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch addresses');
            return res.json();
        },
        deleteAddress: async (userId: string, addressId: string) => {
            const res = await fetch(`${API_URL}/customer/address/${userId}/${addressId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete address');
            return res.json();
        },
    },
};

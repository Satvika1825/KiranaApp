const API_URL = 'http://localhost:5000/api';

export const api = {
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
        }
    }
};

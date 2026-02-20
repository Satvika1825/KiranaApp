
import { api } from './api';
import { getOwnerProfile, getShop, getProducts, getCustomerProfile, getCart } from './store';

export const syncService = {
    /**
     * Syncs owner related data to cloud
     */
    syncOwnerData: async () => {
        const owner = getOwnerProfile();
        const shop = getShop();
        const products = getProducts();

        if (!owner || !owner.mobile) return;

        try {
            // 1. Sync Store
            if (shop) {
                await api.stores.create(shop);
                console.log('Sync: Store synced to cloud');
            }

            // 2. Sync Products
            if (products.length > 0) {
                // Ensure all products have the correct owner ID
                const productsWithCorrectId = products.map(p => ({
                    ...p,
                    shopOwnerId: owner.id
                }));
                await api.products.bulkSave(productsWithCorrectId);
                console.log('Sync: Products synced to cloud');
            }
            return true;
        } catch (err) {
            console.error('Sync: Owner sync failed:', err);
            return false;
        }
    },

    /**
     * Syncs customer related data to cloud
     */
    syncCustomerData: async () => {
        const customer = getCustomerProfile();
        const cart = getCart();

        if (!customer || !customer.id) {
            console.log('Sync: No customer profile found, skipping sync');
            return false;
        }

        try {
            // 1. Sync Profile
            await api.customer.saveProfile({
                userId: customer.id,
                mobile: customer.mobile,
                name: customer.name,
                email: customer.email
            });
            console.log('Sync: Customer profile synced');

            // 2. Sync Cart
            // Even if cart is empty, we should sync it (to clear cloud cart)
            const apiItems = cart.map(c => ({
                productId: c.product.id,
                quantity: c.quantity,
                name: c.product.name,
                price: c.product.price,
                shopOwnerId: c.product.shopOwnerId
            }));
            await api.cart.update(customer.id, apiItems);
            console.log('Sync: Cart synced (items:', apiItems.length, ')');
            return true;
        } catch (err) {
            console.error('Sync: Customer sync failed:', err);
            return false;
        }
    }
};

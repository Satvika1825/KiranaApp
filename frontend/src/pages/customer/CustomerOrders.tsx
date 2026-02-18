/**
 * Customer Orders History Page
 * Shows all past orders with status and reorder capability.
 */
import { useNavigate } from 'react-router-dom';
import { getOrders, getCustomerProfile, getShop, getCart, saveCart, getProducts } from '@/lib/store';
import { Package, RefreshCw, ChevronRight } from 'lucide-react';
import type { CartItem } from '@/lib/store';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const shop = getShop();
  const orders = getOrders().filter(o => o.customerId === (customer?.id || 'guest'));

  const statusClass: Record<string, string> = {
    'New': 'kc-status-new',
    'Accepted': 'kc-status-accepted',
    'Preparing': 'kc-status-preparing',
    'Out for Delivery': 'kc-status-delivery',
    'Delivered': 'kc-status-delivered',
  };

  /** Reorder: add all items from a past order back to cart */
  const reorder = (orderItems: CartItem[]) => {
    const currentProducts = getProducts();
    const cart = getCart();
    orderItems.forEach(item => {
      // Only add if product still exists and is available
      const prod = currentProducts.find(p => p.id === item.product.id && p.available);
      if (!prod) return;
      const existing = cart.find(c => c.product.id === prod.id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.push({ product: prod, quantity: item.quantity });
      }
    });
    saveCart(cart);
    navigate('/customer/cart');
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">My Orders</h2>
      <p className="text-sm text-muted-foreground mb-4">Track and reorder</p>

      {orders.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="kc-card-flat p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-heading font-bold text-foreground text-sm">Order #{o.id}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={statusClass[o.status] || 'kc-status'}>{o.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {o.items.length} item{o.items.length > 1 ? 's' : ''} · ₹{o.totalPrice}
                {shop && <span> · {shop.shopName}</span>}
              </p>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/customer/order/${o.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                  Track <ChevronRight className="w-3 h-3" />
                </button>
                {o.status === 'Delivered' && (
                  <button onClick={() => reorder(o.items)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                    <RefreshCw className="w-3 h-3" /> Reorder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;

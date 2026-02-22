import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { Package, RefreshCw, ChevronRight, Loader2 } from 'lucide-react';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const customerId = customer?.id || 'guest';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.orders.getByCustomer(customerId);
      setOrders(data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customerId]);

  const statusClass: Record<string, string> = {
    'New': 'kc-status-new',
    'Accepted': 'kc-status-accepted',
    'Preparing': 'kc-status-preparing',
    'Out for Delivery': 'kc-status-delivery',
    'Delivered': 'kc-status-delivered',
  };

  /** Reorder: add all items from a past order back to cart */
  const reorder = async (orderItems: any[]) => {
    try {
      // Fetch current cart first
      const cartRes = await api.cart.get(customerId);
      const currentItems = cartRes.items || [];

      // Combine old order items into current cart
      const updatedItems = [...currentItems];
      orderItems.forEach(item => {
        const existing = updatedItems.find(c => c.productId === item.product.id);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          updatedItems.push({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            shopOwnerId: item.product.shopOwnerId,
            quantity: item.quantity
          });
        }
      });

      await api.cart.update(customerId, updatedItems);
      navigate('/customer/cart');
    } catch (err) {
      alert('Failed to reorder. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading your orders...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">My Orders</h2>
      <p className="text-sm text-muted-foreground mb-4">Track and reorder</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="kc-card-flat p-8 text-center text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm font-medium">No orders found</p>
          <button onClick={() => navigate('/customer/stores')}
            className="mt-3 text-primary text-sm font-bold hover:underline">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o._id} className="kc-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-heading font-bold text-foreground text-sm">Order #{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={statusClass[o.status] || 'kc-status'}>{o.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {o.items.length} item{o.items.length > 1 ? 's' : ''} · <span className="text-foreground font-bold font-heading text-base">₹{o.totalPrice}</span>
                {o.shopDetails && <span> · {o.shopDetails.shopName}</span>}
              </p>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/customer/order/${o._id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all border border-input">
                  Track Order <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {o.status === 'Delivered' && (
                  <button onClick={() => reorder(o.items)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20">
                    <RefreshCw className="w-3.5 h-3.5" /> Reorder
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

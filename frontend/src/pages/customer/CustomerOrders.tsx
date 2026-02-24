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
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-base text-muted-foreground font-heading font-semibold">Loading your orders...</p>
    </div>
  );

  return (
    <div className="animate-fade-in px-4 md:px-6 py-6 bg-gradient-to-b from-background to-secondary/20 min-h-screen">
      <h2 className="text-3xl font-heading font-bold text-foreground mb-2">My Orders</h2>
      <p className="text-base text-muted-foreground mb-6 font-body">Track and reorder your groceries</p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/15 border-2 border-destructive/30 text-destructive text-sm text-center font-semibold">{error}</div>
      )}

      {orders.length === 0 ? (
        <div className="kc-card-flat p-12 text-center text-muted-foreground rounded-2xl border-2 border-secondary">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-bold font-heading">No orders found</p>
          <p className="text-base mt-2 mb-4">Start shopping to place your first order</p>
          <button onClick={() => navigate('/customer/home')}
            className="inline-block px-6 py-3 text-primary text-base font-bold hover:bg-primary/10 rounded-lg transition-colors">
            Continue Shopping →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o._id} className="kc-card p-5 border-2 border-secondary hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-heading font-bold text-foreground text-lg">Order #{o._id.slice(-6).toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground font-body mt-1">{new Date(o.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{o.status}</span>
              </div>
              <p className="text-base text-muted-foreground mb-4 font-body">
                <span className="font-semibold">{o.items.length} item{o.items.length > 1 ? 's' : ''}</span> · <span className="text-foreground font-heading font-bold text-lg">₹{o.totalPrice}</span>
                {o.shopDetails && <span className="text-primary font-semibold ml-2">· {o.shopDetails.shopName}</span>}
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate(`/customer/order/${o._id}`)}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary/15 text-primary rounded-xl text-sm font-bold hover:bg-primary/25 transition-all border-2 border-primary/30 hover:border-primary/50">
                  <ChevronRight className="w-4 h-4" /> Track Order
                </button>
                {o.status === 'Delivered' && (
                  <button onClick={() => reorder(o.items)}
                    className="flex-1 flex items-center justify-center gap-2 h-11 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-sm font-bold hover:shadow-lg transition-all shadow-md shadow-primary/40">
                    <RefreshCw className="w-4 h-4" /> Reorder
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

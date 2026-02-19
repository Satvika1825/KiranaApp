/**
 * Owner Orders Page
 * Fetches orders from backend API. Status changes sync to backend.
 *
 * ORDER STATUS UPDATES:
 * - Owner changes status via dropdown
 * - Status change triggers customer notification & backend update
 * - Status options: New → Accepted → Preparing → Out for Delivery → Delivered
 */
import { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, addCustomerNotification, getOwnerProfile, type Order } from '@/lib/store';
import { api } from '@/lib/api';
import { ClipboardList } from 'lucide-react';

const statuses: Order['status'][] = ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];

const statusClass = (s: string) => {
  switch (s) {
    case 'New': return 'kc-status-new';
    case 'Accepted': return 'kc-status-accepted';
    case 'Preparing': return 'kc-status-preparing';
    case 'Out for Delivery': return 'kc-status-delivery';
    case 'Delivered': return 'kc-status-delivered';
    default: return '';
  }
};

const OwnerOrders = () => {
  const owner = getOwnerProfile();
  const [orders, setOrders] = useState(getOrders());

  // Fetch orders from backend
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.orders.getByOwner(owner?.id || 'owner1');
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
        }
      } catch {
        setOrders(getOrders());
      }
    };
    fetchOrders();

    // Poll for new orders
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    // Update localStorage
    updateOrderStatus(orderId, newStatus);
    addCustomerNotification(`Order #${orderId} is now: ${newStatus}`, orderId);

    // Update backend
    try {
      await api.orders.updateStatus(orderId, newStatus);
    } catch {
      console.log('Backend status update failed');
    }

    // Update local state
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Orders ({orders.length})</h2>

      {orders.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="kc-card-flat p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-heading font-bold text-foreground text-sm">Order #{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.customerName} · {new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className={statusClass(order.status)}>{order.status}</span>
              </div>

              {/* Items */}
              <div className="bg-muted/50 rounded-lg p-2.5">
                {order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm py-0.5">
                    <span className="text-foreground">{item.product.name} × {item.quantity}</span>
                    <span className="text-muted-foreground">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-border mt-1.5 pt-1.5 text-foreground">
                  <span>Total</span>
                  <span>₹{order.totalPrice}</span>
                </div>
              </div>

              {/* Status Dropdown */}
              {order.status !== 'Delivered' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Update Status:</label>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value as Order['status'])}
                    className="px-2 py-1.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerOrders;

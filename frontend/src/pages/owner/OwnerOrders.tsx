/**
 * Owner Orders Page
 * STATUS FLOW: New → Accepted → Preparing → Ready for Pickup (auto-assigns agent) → Out for Delivery → Delivered
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ClipboardList, Truck, RefreshCw, User } from 'lucide-react';

const ALL_STATUSES = ['New', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

const statusColors: Record<string, string> = {
  'New': 'bg-slate-100 text-slate-600',
  'Accepted': 'bg-blue-100 text-blue-700',
  'Preparing': 'bg-amber-100 text-amber-700',
  'Ready for Pickup': 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  'Delivered': 'bg-green-100 text-green-700',
};

const deliveryStatusColors: Record<string, string> = {
  'Pending': 'text-slate-400',
  'Assigned': 'text-blue-600',
  'Picked Up': 'text-amber-600',
  'Out for Delivery': 'text-purple-600',
  'Delivered': 'text-green-600',
};

const OwnerOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getOwnerId = () => {
    try { return JSON.parse(localStorage.getItem('kc_owner') || '{}').id; } catch { return null; }
  };

  const fetchOrders = async (silent = false) => {
    const ownerId = getOwnerId();
    if (!ownerId) { setLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await api.orders.getByOwner(ownerId);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(true), 8000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (order: any, newStatus: string) => {
    const orderId = order._id || order.id;
    setUpdatingId(orderId);

    // Optimistic update
    setOrders(prev => prev.map(o => (o._id || o.id) === orderId ? { ...o, status: newStatus } : o));

    try {
      await api.orders.updateStatus(orderId, newStatus);
      // Refresh to get assignment info if Ready for Pickup was triggered
      if (newStatus === 'Ready for Pickup') {
        setTimeout(() => fetchOrders(true), 1500);
      }
    } catch (err) {
      console.error('Status update failed', err);
      fetchOrders(true); // revert by refetching
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>
  );

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-heading font-bold text-foreground">Orders ({orders.length})</h2>
        <button
          onClick={() => fetchOrders(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const orderId = order._id || order.id;
            const isBusy = updatingId === orderId;
            const availableNextStatuses = ALL_STATUSES.filter(
              s => ALL_STATUSES.indexOf(s) > ALL_STATUSES.indexOf(order.status)
            );

            return (
              <div key={orderId} className="kc-card-flat p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-heading font-bold text-foreground text-sm">
                      Order #{(order.id || orderId).substring(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.customerName} · {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>

                {/* Delivery Agent Info */}
                {order.deliveryAgentId && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-800">
                        Agent: {order.deliveryAgentName || 'Assigned'}
                      </p>
                      <p className={`text-xs font-medium ${deliveryStatusColors[order.deliveryStatus] || 'text-slate-500'}`}>
                        Delivery: {order.deliveryStatus}
                      </p>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="bg-muted/50 rounded-lg p-2.5">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm py-0.5">
                      <span className="text-foreground">{item.product?.name || item.name} × {item.quantity}</span>
                      <span className="text-muted-foreground">₹{(item.product?.price || item.price) * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t border-border mt-1.5 pt-1.5 text-foreground">
                    <span>Total</span><span>₹{order.totalPrice}</span>
                  </div>
                </div>

                {/* Status Actions */}
                {order.status !== 'Delivered' && (
                  <div className="flex flex-wrap gap-2">
                    {/* Quick action buttons for key transitions */}
                    {order.status === 'New' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order, 'Accepted')}
                        className="flex-1 min-w-[100px] bg-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                      >
                        ✓ Accept
                      </button>
                    )}
                    {order.status === 'Accepted' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order, 'Preparing')}
                        className="flex-1 min-w-[100px] bg-amber-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-amber-600 disabled:opacity-50"
                      >
                        👨‍🍳 Start Preparing
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button
                        disabled={isBusy}
                        onClick={() => handleStatusChange(order, 'Ready for Pickup')}
                        className="flex-1 min-w-[100px] bg-orange-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-orange-600 disabled:opacity-50"
                      >
                        🚀 {isBusy ? 'Assigning...' : 'Ready for Pickup'}
                      </button>
                    )}

                    {/* Dropdown for other status changes */}
                    <select
                      disabled={isBusy}
                      value={order.status}
                      onChange={e => handleStatusChange(order, e.target.value)}
                      className="px-2 py-2 rounded-lg border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value={order.status}>{order.status}</option>
                      {availableNextStatuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                {order.status === 'Delivered' && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-xl">
                    <span className="text-sm font-semibold">✓ Order Delivered</span>
                    <span className="text-xs text-green-500 ml-auto">₹{order.totalPrice} {order.paymentMethod === 'cod' ? 'COD' : 'Paid'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerOrders;

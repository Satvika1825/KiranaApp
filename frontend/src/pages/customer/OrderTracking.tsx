import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Package, CheckCircle2, Truck, ChefHat, ClipboardCheck, Receipt, Loader2, AlertCircle } from 'lucide-react';

const steps = [
  { status: 'New', label: 'Order Placed', icon: ClipboardCheck },
  { status: 'Accepted', label: 'Accepted', icon: CheckCircle2 },
  { status: 'Preparing', label: 'Packing', icon: ChefHat },
  { status: 'Ready for Pickup', label: 'Ready for Pickup', icon: Package },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const fetchOrder = async (silent = false) => {
    if (!orderId) return;
    if (!silent) setLoading(true);
    try {
      const data = await api.orders.getDetail(orderId);
      if (data.order) {
        setOrder(data.order);
        setError('');
      } else {
        setError('Order not found');
      }
    } catch (err) {
      console.error('Failed to fetch order', err);
      if (!silent) setError('Failed to load order tracking');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(() => fetchOrder(true), 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Fetching order status...</p>
    </div>
  );

  if (error || !order) {
    return (
      <div className="animate-fade-in text-center py-20 px-6">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">{error || 'Order Not Found'}</h2>
        <p className="text-sm text-muted-foreground mb-6">We couldn't find the order you're looking for.</p>
        <button onClick={() => navigate('/customer/home')}
          className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20">
          Back to Shopping
        </button>
      </div>
    );
  }

  const currentIdx = steps.findIndex(s => s.status === order.status);
  const isDelivered = order.status === 'Delivered';

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4 animate-pulse-soft">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Order #{order._id?.slice(-6).toUpperCase() || 'TRACKING'}</h2>
        <p className="text-sm text-muted-foreground">
          {order.shopDetails?.shopName || 'Kirana Store'} · {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="kc-card p-6 mb-4">
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${done ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110' : 'bg-muted text-muted-foreground'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                    <step.icon className={`w-5 h-5 ${active ? 'animate-bounce' : ''}`} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-1 h-8 rounded-full transition-all duration-1000 ${idx < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
                <div className="pt-1.5 flex-1">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-bold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {active && <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full animate-pulse">Live</span>}
                  </div>
                  {active && <p className="text-xs text-muted-foreground mt-0.5">Your order is currently at this stage</p>}

                  {/* Show agent name when assigned */}
                  {step.status === 'Out for Delivery' && done && order.deliveryAgentName && (
                    <div className="mt-2 flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                      <p className="text-xs text-blue-700 font-bold">Delivery by: {order.deliveryAgentName}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Confirmation */}
      {isDelivered && !confirmed && (
        <div className="kc-card p-6 mb-4 text-center border-primary border-2 shadow-xl shadow-primary/5">
          <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-heading font-bold text-foreground mb-1">Delivered!</h3>
          <p className="text-sm text-muted-foreground mb-4">Was your delivery successful?</p>
          <button onClick={() => setConfirmed(true)}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-95 transition-all">
            Confirm Happy Delivery
          </button>
        </div>
      )}

      {confirmed && (
        <div className="kc-card p-4 mb-4 text-center bg-green-50 border-green-100">
          <p className="text-sm text-green-700 font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Thank you for confirming!
          </p>
        </div>
      )}

      {/* Digital Receipt */}
      {isDelivered && (
        <div className="kc-card p-6 mb-4">
          <h3 className="font-heading font-bold text-foreground text-sm mb-4 flex items-center gap-2 border-b pb-2">
            <Receipt className="w-4 h-4 text-primary" /> Digital Receipt
          </h3>
          <div className="text-xs text-muted-foreground space-y-1 mb-4">
            <p className="flex justify-between"><span>Order ID</span> <span className="font-bold text-foreground">#{order._id}</span></p>
            <p className="flex justify-between"><span>Date</span> <span className="font-bold text-foreground">{new Date(order.createdAt).toLocaleString()}</span></p>
            <p className="flex justify-between"><span>Store</span> <span className="font-bold text-foreground">{order.shopDetails?.shopName}</span></p>
          </div>
          <div className="space-y-2 mb-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-0.5 text-foreground">
                <span>{item.product?.name || item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                <span className="font-bold">₹{(item.product?.price || item.price) * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm py-2 text-muted-foreground border-t border-dashed">
            <span>Delivery Fee</span><span>₹25</span>
          </div>
          <div className="flex justify-between items-center border-t pt-3 mt-1">
            <span className="font-bold text-foreground">Total Paid</span>
            <span className="text-xl font-bold text-primary">₹{order.totalPrice}</span>
          </div>
        </div>
      )}

      {/* Order Items (non-delivered) */}
      {!isDelivered && (
        <div className="kc-card p-6 mb-4">
          <h3 className="font-heading font-bold text-foreground text-sm mb-4 flex items-center gap-2 border-b pb-2">
            Summary
          </h3>
          <div className="space-y-2 mb-4">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1 text-foreground">
                <span>{item.product?.name || item.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
                <span className="font-bold">₹{(item.product?.price || item.price) * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t pt-3 mt-1">
            <span className="font-heading font-bold text-foreground">Grand Total</span>
            <span className="text-xl font-heading font-bold text-primary">₹{order.totalPrice}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/customer/home')}
        className="w-full h-14 bg-accent text-accent-foreground rounded-2xl font-bold hover:bg-accent/80 transition-all text-sm border border-input">
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderTracking;

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
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-base text-muted-foreground font-heading font-semibold">Fetching order status...</p>
    </div>
  );

  if (error || !order) {
    return (
      <div className="animate-fade-in text-center py-24 px-6 bg-gradient-to-b from-background to-secondary/20 min-h-screen">
        <div className="w-20 h-20 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2 text-foreground">{error || 'Order Not Found'}</h2>
        <p className="text-base text-muted-foreground mb-8 font-body">We couldn't find the order you're looking for.</p>
        <button onClick={() => navigate('/customer/home')}
          className="px-8 py-3.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-base font-bold shadow-lg shadow-primary/40 hover:shadow-xl transition-all">
          Back to Shopping
        </button>
      </div>
    );
  }

  const currentIdx = steps.findIndex(s => s.status === order.status);
  const isDelivered = order.status === 'Delivered';

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-12 px-4 bg-gradient-to-b from-background to-secondary/20 min-h-screen py-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/15 mb-4 animate-pulse-soft shadow-lg shadow-primary/20">
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-2">Order #{order._id?.slice(-6).toUpperCase() || 'TRACKING'}</h2>
        <p className="text-base text-muted-foreground font-body">
          {order.shopDetails?.shopName || 'Kirana Store'} · {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="kc-card p-7 mb-6 border-2 border-secondary rounded-2xl">
        <div className="space-y-6">
          {steps.map((step, idx) => {
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 font-bold ${done ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-110' : 'bg-secondary text-muted-foreground'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                    <step.icon className={`w-6 h-6 ${active ? 'animate-bounce' : ''}`} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-1.5 h-9 rounded-full transition-all duration-1000 ${idx < currentIdx ? 'bg-primary' : 'bg-secondary'}`} />
                  )}
                </div>
                <div className="pt-2 flex-1">
                  <div className="flex justify-between items-center">
                    <p className={`text-base font-heading font-bold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </p>
                    {active && <span className="text-xs font-heading font-bold uppercase tracking-widest bg-primary/20 text-primary px-3 py-1 rounded-full animate-pulse">Live</span>}
                  </div>
                  {active && <p className="text-sm text-muted-foreground mt-1 font-body">Your order is currently at this stage</p>}

                  {/* Show agent name when assigned */}
                  {step.status === 'Out for Delivery' && done && order.deliveryAgentName && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border-2 border-blue-200 shadow-sm">
                      <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-blue-700 font-heading font-bold">Delivery by: {order.deliveryAgentName}</p>
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
        <div className="kc-card p-7 mb-6 text-center border-2 border-primary/40 bg-primary/5 rounded-2xl shadow-lg shadow-primary/20">
          <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-heading font-bold text-foreground mb-2">Delivered!</h3>
          <p className="text-base text-muted-foreground mb-6 font-body">Was your delivery successful?</p>
          <button onClick={() => setConfirmed(true)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 rounded-xl font-heading font-bold text-lg shadow-lg shadow-primary/40 hover:shadow-xl transition-all">
            Confirm Happy Delivery
          </button>
        </div>
      )}

      {confirmed && (
        <div className="kc-card p-4 mb-6 text-center bg-green-50 border-2 border-green-200 rounded-xl">
          <p className="text-base text-green-700 font-heading font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Thank you for confirming!
          </p>
        </div>
      )}

      {/* Digital Receipt */}
      {isDelivered && (
        <div className="kc-card p-7 mb-6 border-2 border-secondary rounded-2xl">
          <h3 className="font-heading font-bold text-foreground text-lg mb-5 flex items-center gap-3 pb-3 border-b-2 border-secondary">
            <Receipt className="w-5 h-5 text-primary" /> Digital Receipt
          </h3>
          <div className="text-sm text-muted-foreground space-y-2 mb-4 font-body">
            <p className="flex justify-between"><span className="font-semibold">Order ID</span> <span className="font-heading font-bold text-foreground">#{order._id}</span></p>
            <p className="flex justify-between"><span className="font-semibold">Date</span> <span className="font-heading font-bold text-foreground">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>
            <p className="flex justify-between"><span className="font-semibold">Store</span> <span className="font-heading font-bold text-foreground">{order.shopDetails?.shopName}</span></p>
          </div>
          <div className="space-y-2 mb-4 font-body">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1.5 text-foreground">
                <span className="font-semibold">{item.product?.name || item.name} <span className="text-muted-foreground text-xs">× {item.quantity}</span></span>
                <span className="font-heading font-bold">₹{((item.product?.price || item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm py-3 text-muted-foreground border-t-2 border-dashed border-secondary font-body">
            <span className="font-semibold">Delivery Fee</span><span className="font-heading font-bold">₹25</span>
          </div>
          <div className="flex justify-between items-center border-t-2 border-secondary pt-4 mt-2">
            <span className="font-heading font-bold text-lg text-foreground">Total Paid</span>
            <span className="text-2xl font-heading font-bold text-primary">₹{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Order Items (non-delivered) */}
      {!isDelivered && (
        <div className="kc-card p-7 mb-6 border-2 border-secondary rounded-2xl">
          <h3 className="font-heading font-bold text-foreground text-lg mb-5 pb-3 border-b-2 border-secondary">
            Order Summary
          </h3>
          <div className="space-y-2 mb-4 font-body">
            {order.items.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm py-1.5 text-foreground">
                <span className="font-semibold">{item.product?.name || item.name} <span className="text-muted-foreground text-xs">× {item.quantity}</span></span>
                <span className="font-heading font-bold">₹{((item.product?.price || item.price) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t-2 border-secondary pt-4 mt-2">
            <span className="font-heading font-bold text-lg text-foreground">Grand Total</span>
            <span className="text-2xl font-heading font-bold text-primary">₹{order.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/customer/home')}
        className="w-full h-14 bg-primary/15 text-primary rounded-xl font-heading font-bold hover:bg-primary/25 transition-all text-lg border-2 border-primary/30">
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderTracking;

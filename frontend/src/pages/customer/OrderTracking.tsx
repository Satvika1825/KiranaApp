/**
 * Order Tracking Page — Customer
 * Fetches order from backend API with localStorage fallback.
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrders, getShop } from '@/lib/store';
import { api } from '@/lib/api';
import { Package, CheckCircle2, Truck, ChefHat, ClipboardCheck, Receipt } from 'lucide-react';

const steps = [
  { status: 'New', label: 'Order Placed', icon: ClipboardCheck },
  { status: 'Accepted', label: 'Accepted', icon: CheckCircle2 },
  { status: 'Preparing', label: 'Preparing', icon: ChefHat },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { status: 'Delivered', label: 'Delivered', icon: Package },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const shop = getShop();
  const [order, setOrder] = useState(getOrders().find(o => o.id === orderId));
  const [confirmed, setConfirmed] = useState(false);

  // Fetch from backend and poll for updates
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.orders.getDetail(orderId!);
        if (data.order) setOrder(data.order);
      } catch {
        // Use localStorage
      }
    };
    fetchOrder();

    const interval = setInterval(() => {
      fetchOrder();
      // Also check localStorage for local updates
      const updated = getOrders().find(o => o.id === orderId);
      if (updated && !order) setOrder(updated);
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!order) {
    return (
      <div className="animate-fade-in text-center py-8">
        <p className="text-muted-foreground">Order not found.</p>
        <button onClick={() => navigate('/customer/home')}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
          Back to Home
        </button>
      </div>
    );
  }

  const currentIdx = steps.findIndex(s => s.status === order.status);
  const isDelivered = order.status === 'Delivered';

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-3">
          <CheckCircle2 className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-xl font-heading font-bold text-foreground">Order #{order.id}</h2>
        <p className="text-sm text-muted-foreground">
          {shop?.shopName} · {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="kc-card-flat p-5 mb-4">
        <div className="space-y-4">
          {steps.map((step, idx) => {
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.status} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    } ${active ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-6 ${idx < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-medium ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                  {active && <p className="text-xs text-primary animate-pulse-soft">Current Status</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery Confirmation */}
      {isDelivered && !confirmed && (
        <div className="kc-card-flat p-4 mb-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
          <p className="font-heading font-bold text-foreground mb-1">Order Delivered!</p>
          <p className="text-sm text-muted-foreground mb-3">Did you receive your order?</p>
          <button onClick={() => setConfirmed(true)}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Confirm Received
          </button>
        </div>
      )}

      {confirmed && (
        <div className="kc-card-flat p-4 mb-4 text-center">
          <p className="text-sm text-primary font-semibold">✓ Order received confirmed!</p>
        </div>
      )}

      {/* Digital Receipt */}
      {isDelivered && (
        <div className="kc-card-flat p-4 mb-4">
          <h3 className="font-heading font-bold text-foreground text-sm mb-2 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" /> Digital Receipt
          </h3>
          <div className="text-xs text-muted-foreground space-y-0.5 mb-2">
            <p>Order #{order.id}</p>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
            {shop && <p>{shop.shopName}</p>}
          </div>
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-0.5 text-foreground">
              <span>{item.product.name} × {item.quantity}</span>
              <span>₹{item.product.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-0.5 text-muted-foreground border-t border-border mt-1 pt-1">
            <span>Delivery</span><span>₹25</span>
          </div>
          <div className="flex justify-between font-bold border-t border-border mt-1 pt-2 text-foreground">
            <span>Total Paid</span><span>₹{order.totalPrice}</span>
          </div>
        </div>
      )}

      {/* Order Items (non-delivered) */}
      {!isDelivered && (
        <div className="kc-card-flat p-4 mb-4">
          <h3 className="font-heading font-bold text-foreground text-sm mb-2">Order Items</h3>
          {order.items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1 text-foreground">
              <span>{item.product.name} × {item.quantity}</span>
              <span>₹{item.product.price * item.quantity}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold border-t border-border mt-2 pt-2 text-foreground">
            <span>Total</span><span>₹{order.totalPrice}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate('/customer/home')}
        className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm">
        Continue Shopping
      </button>
    </div>
  );
};

export default OrderTracking;

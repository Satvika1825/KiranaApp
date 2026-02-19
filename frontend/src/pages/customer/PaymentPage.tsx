/**
 * Payment Page — Customer
 * Place order via backend API. Also saves to localStorage for offline fallback.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCart, clearCart, addOrder, addOwnerNotification,
  getCustomerProfile, getOwnerProfile, generateId, getCustomerAddresses,
} from '@/lib/store';
import { api } from '@/lib/api';
import { syncService } from '@/lib/sync';
import { CreditCard, Banknote, Clock, ArrowRight, MapPin } from 'lucide-react';

const DELIVERY_CHARGE = 25;

const PaymentPage = () => {
  const navigate = useNavigate();
  const cart = getCart();
  const customer = getCustomerProfile();
  const owner = getOwnerProfile();
  const addresses = getCustomerAddresses();
  const [payMethod, setPayMethod] = useState<'upi' | 'cod' | 'pay_later'>('cod');
  const [instructions, setInstructions] = useState('');
  const [selectedAddr, setSelectedAddr] = useState(addresses[0]?.id || '');

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const total = subtotal + DELIVERY_CHARGE;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const orderId = generateId();
    const orderData = {
      id: orderId,
      customerId: customer?.id || 'guest',
      customerName: customer?.name || 'Guest Customer',
      shopOwnerId: owner?.id || 'owner1',
      items: cart,
      totalPrice: total,
      status: 'New' as const,
      paymentMethod: payMethod,
      specialInstructions: instructions,
      addressId: selectedAddr,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    addOrder(orderData);
    addOwnerNotification(`New order #${orderId} from ${customer?.name || 'Guest'} — ₹${total}`, orderId);
    clearCart();

    // Save to backend
    try {
      await api.orders.place(orderData);
      api.cart.clear(customer?.id || 'guest').catch(() => { });
      // Sync cart state (cleared) to cloud
      syncService.syncCustomerData();
    } catch {
      console.log('Backend order save failed, using localStorage');
    }

    navigate(`/customer/order/${orderId}`);
  };

  if (cart.length === 0) {
    navigate('/customer/cart');
    return null;
  }

  const methods = [
    { id: 'upi' as const, label: 'UPI Payment', icon: CreditCard, desc: 'GPay, PhonePe, Paytm' },
    { id: 'cod' as const, label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { id: 'pay_later' as const, label: 'Pay Later', icon: Clock, desc: 'Monthly kirana khata' },
  ];

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Checkout</h2>

      {/* Delivery Address */}
      {addresses.length > 0 && (
        <div className="kc-card-flat p-4 mb-3">
          <h3 className="font-heading font-bold text-foreground text-sm mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Delivery Address
          </h3>
          <div className="space-y-2">
            {addresses.map(a => (
              <button key={a.id} onClick={() => setSelectedAddr(a.id)}
                className={`w-full text-left p-2.5 rounded-lg border text-sm transition-colors ${selectedAddr === a.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className="font-medium text-foreground">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.houseNumber}, {a.street} - {a.pinCode}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Method */}
      <div className="kc-card-flat p-4 mb-3">
        <h3 className="font-heading font-bold text-foreground text-sm mb-2">Payment Method</h3>
        <div className="space-y-2">
          {methods.map(m => (
            <button key={m.id} onClick={() => setPayMethod(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${payMethod === m.id ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${payMethod === m.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                <m.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="kc-card-flat p-4 mb-3">
        <h3 className="font-heading font-bold text-foreground text-sm mb-2">Special Instructions</h3>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          rows={2} placeholder="e.g. Don't give plastic bag, Call before delivery" />
      </div>

      {/* Order Summary */}
      <div className="kc-card-flat p-4 mb-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-2">Order Summary</h3>
        {cart.map((item, i) => (
          <div key={i} className="flex justify-between text-sm py-1 text-foreground">
            <span>{item.product.name} × {item.quantity}</span>
            <span>₹{item.product.price * item.quantity}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-1 text-muted-foreground border-t border-border mt-1 pt-1">
          <span>Delivery Charge</span><span>₹{DELIVERY_CHARGE}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-border mt-1 pt-2 text-foreground">
          <span>Total</span><span className="text-lg">₹{total}</span>
        </div>
      </div>

      <button onClick={placeOrder}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        Place Order <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PaymentPage;

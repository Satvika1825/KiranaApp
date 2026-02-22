import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { CreditCard, Banknote, Clock, ArrowRight, MapPin, Loader2, AlertCircle } from 'lucide-react';

const DELIVERY_CHARGE = 25;

const PaymentPage = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const userId = customer?.id || 'guest';

  const [cart, setCart] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const [payMethod, setPayMethod] = useState<'upi' | 'cod' | 'pay_later'>('cod');
  const [instructions, setInstructions] = useState('');
  const [selectedAddr, setSelectedAddr] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cartData, addrData] = await Promise.all([
          api.cart.get(userId),
          api.customer.getAddresses(userId)
        ]);

        if (cartData?.items) {
          const mapped = cartData.items.map((item: any) => ({
            product: { id: item.productId, name: item.name, price: item.price, shopOwnerId: item.shopOwnerId },
            quantity: item.quantity
          }));
          setCart(mapped);
          if (mapped.length === 0) navigate('/customer/cart');
        } else {
          navigate('/customer/cart');
        }

        if (addrData?.addresses) {
          setAddresses(addrData.addresses);
          if (addrData.addresses.length > 0) setSelectedAddr(addrData.addresses[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch checkout data', err);
        setError('Failed to load checkout details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const total = subtotal + (cart.length > 0 ? DELIVERY_CHARGE : 0);

  const placeOrder = async () => {
    if (cart.length === 0 || !selectedAddr) {
      if (!selectedAddr) setError('Please select a delivery address');
      return;
    }

    setPlacing(true);
    setError('');

    // Get the first item's shopOwnerId to identify the store
    const shopOwnerId = cart[0]?.product?.shopOwnerId || '';

    const orderData = {
      customerId: userId,
      customerName: customer?.name || 'Guest Customer',
      shopOwnerId,
      items: cart,
      totalPrice: total,
      status: 'New',
      paymentMethod: payMethod,
      specialInstructions: instructions,
      addressId: selectedAddr,
    };

    try {
      const res = await api.orders.place(orderData);
      const newOrderId = res.order?._id || res.order?.id;

      // Clear cart on backend
      await api.cart.clear(userId);

      navigate(`/customer/order/${newOrderId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Preparing your checkout...</p>
    </div>
  );

  const methods = [
    { id: 'upi' as const, label: 'UPI Payment', icon: CreditCard, desc: 'GPay, PhonePe, Paytm' },
    { id: 'cod' as const, label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { id: 'pay_later' as const, label: 'Pay Later', icon: Clock, desc: 'Monthly kirana khata' },
  ];

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-10">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Checkout</h2>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Delivery Address */}
      <div className="kc-card p-5 mb-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-3 flex items-center gap-2 border-b pb-2">
          <MapPin className="w-4 h-4 text-primary" /> Delivery Address
        </h3>
        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map(a => (
              <button key={a._id} onClick={() => setSelectedAddr(a._id)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedAddr === a._id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground text-sm">{a.label}</span>
                  {selectedAddr === a._id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="block text-xs text-muted-foreground mt-0.5">{a.houseNumber}, {a.street} - {a.pinCode}</span>
              </button>
            ))}
            <button onClick={() => navigate('/customer/addresses')}
              className="w-full py-2 text-primary text-xs font-bold hover:underline">
              + Add New Address
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No addresses found</p>
            <button onClick={() => navigate('/customer/addresses')}
              className="bg-accent px-4 py-2 rounded-lg text-xs font-bold">
              Add Address
            </button>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="kc-card p-5 mb-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-3 border-b pb-2">Payment Method</h3>
        <div className="space-y-2">
          {methods.map(m => (
            <button key={m.id} onClick={() => setPayMethod(m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${payMethod === m.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-border'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payMethod === m.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="kc-card p-5 mb-4">
        <h3 className="font-heading font-bold text-foreground text-sm mb-3 border-b pb-2">Special Instructions</h3>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          rows={2} placeholder="e.g. Near the park gate, Call before delivery..." />
      </div>

      {/* Order Summary */}
      <div className="kc-card p-5 mb-6">
        <h3 className="font-heading font-bold text-foreground text-sm mb-3 border-b pb-2">Order Summary</h3>
        <div className="space-y-2 mb-4">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-sm text-foreground">
              <span className="font-medium">{item.product.name} <span className="text-muted-foreground">× {item.quantity}</span></span>
              <span className="font-bold">₹{item.product.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm py-2 text-muted-foreground border-t border-dashed">
          <span>Delivery Charge</span><span>₹{DELIVERY_CHARGE}</span>
        </div>
        <div className="flex justify-between items-center border-t pt-3 mt-1">
          <span className="font-heading font-bold text-foreground">Total Payable</span>
          <span className="text-2xl font-heading font-bold text-primary">₹{total}</span>
        </div>
      </div>

      <button onClick={placeOrder} disabled={placing || cart.length === 0}
        className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
        {placing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Place Order <ArrowRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
};

export default PaymentPage;

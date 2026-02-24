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
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-base text-muted-foreground font-heading font-semibold">Processing checkout...</p>
    </div>
  );

  const methods = [
    { id: 'upi' as const, label: 'UPI Payment', icon: CreditCard, desc: 'GPay, PhonePe, Paytm' },
    { id: 'cod' as const, label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { id: 'pay_later' as const, label: 'Pay Later', icon: Clock, desc: 'Monthly kirana khata' },
  ];

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-12 px-4 bg-gradient-to-b from-background to-secondary/20 min-h-screen py-6">
      <h2 className="text-3xl font-heading font-bold text-foreground mb-6">Checkout</h2>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/15 border-2 border-destructive/30 text-destructive text-base flex items-center gap-3 font-body font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Delivery Address */}
      <div className="kc-card p-6 mb-6 border-2 border-secondary rounded-2xl">
        <h3 className="font-heading font-bold text-foreground text-lg mb-4 flex items-center gap-2 pb-3 border-b-2 border-secondary">
          <MapPin className="w-5 h-5 text-primary" /> Delivery Address
        </h3>
        {addresses.length > 0 ? (
          <div className="space-y-3">
            {addresses.map(a => (
              <button key={a._id} onClick={() => setSelectedAddr(a._id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-body ${selectedAddr === a._id ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md' : 'border-secondary hover:border-primary/40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading font-bold text-foreground text-base">{a.label}</span>
                  {selectedAddr === a._id && <div className="w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/40" />}
                </div>
                <span className="block text-sm text-muted-foreground">{a.houseNumber}, {a.street} - {a.pinCode}</span>
              </button>
            ))}
            <button onClick={() => navigate('/customer/address')}
              className="w-full py-3 text-primary text-base font-bold hover:bg-primary/10 rounded-lg transition-colors">
              + Add New Address
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-base text-muted-foreground mb-4 font-body">No addresses found</p>
            <button onClick={() => navigate('/customer/address')}
              className="bg-primary px-6 py-3 rounded-xl text-base font-bold text-primary-foreground">
              Add Address Now
            </button>
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="kc-card p-6 mb-6 border-2 border-secondary rounded-2xl">
        <h3 className="font-heading font-bold text-foreground text-lg mb-4 pb-3 border-b-2 border-secondary">Payment Method</h3>
        <div className="space-y-3">
          {methods.map(m => (
            <button key={m.id} onClick={() => setPayMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all font-body ${payMethod === m.id ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md' : 'border-secondary hover:border-primary/40'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${payMethod === m.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/40' : 'bg-secondary text-muted-foreground'}`}>
                <m.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-heading font-bold text-foreground text-base">{m.label}</p>
                <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Special Instructions */}
      <div className="kc-card p-6 mb-6 border-2 border-secondary rounded-2xl">
        <h3 className="font-heading font-bold text-foreground text-lg mb-4 pb-3 border-b-2 border-secondary">Special Instructions</h3>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-secondary bg-white text-base font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          rows={2} placeholder="e.g. Near the park gate, Call before delivery..." />
      </div>

      {/* Order Summary */}
      <div className="kc-card p-6 mb-7 border-2 border-secondary rounded-2xl">
        <h3 className="font-heading font-bold text-foreground text-lg mb-4 pb-3 border-b-2 border-secondary">Order Summary</h3>
        <div className="space-y-3 mb-4 font-body">
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between text-base text-foreground">
              <span className="font-semibold">{item.product.name} <span className="text-muted-foreground text-sm">× {item.quantity}</span></span>
              <span className="font-heading font-bold text-foreground">₹{item.product.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-base py-3 text-muted-foreground border-t-2 border-dashed border-secondary font-body">
          <span className="font-semibold">Delivery Charge</span><span className="font-heading font-bold">₹{DELIVERY_CHARGE}</span>
        </div>
        <div className="flex justify-between items-center border-t-2 border-secondary pt-4 mt-2">
          <span className="font-heading font-bold text-foreground text-lg">Total Payable</span>
          <span className="text-3xl font-heading font-bold text-primary">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <button onClick={placeOrder} disabled={placing || cart.length === 0}
        className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-14 rounded-xl font-heading font-bold shadow-lg shadow-primary/40 hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg">
        {placing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Place Order <ArrowRight className="w-5 h-5" /></>}
      </button>
    </div>
  );
};

export default PaymentPage;

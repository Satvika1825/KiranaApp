/**
 * Cart Page — Customer
 * Shows cart items with quantity controls, delivery charge, total price.
 * Proceed to Payment page for checkout.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile, type CartItem } from '@/lib/store';
import { api } from '@/lib/api';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const DELIVERY_CHARGE = 25;

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const customer = getCustomerProfile();
  const userId = customer?.id || 'guest';

  const fetchCart = async () => {
    try {
      setLoading(true);
      const data = await api.cart.get(userId);
      if (data && data.items) {
        const mapped = data.items.map((item: any) => ({
          product: {
            id: item.productId,
            name: item.name,
            price: item.price,
            shopOwnerId: item.shopOwnerId,
            available: true,
            category: ''
          },
          quantity: item.quantity
        }));
        setCart(mapped);
      }
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [userId]);

  const updateCartBackend = (newCart: CartItem[]) => {
    const apiItems = newCart.map(c => ({
      productId: c.product.id,
      quantity: c.quantity,
      name: c.product.name,
      price: c.product.price,
      shopOwnerId: c.product.shopOwnerId
    }));
    api.cart.update(userId, apiItems).catch(console.error);
  };

  const updateQty = (productId: string, delta: number) => {
    const updated = cart.map(c => {
      if (c.product.id === productId) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    });
    setCart(updated);
    updateCartBackend(updated);
  };

  const removeItem = (productId: string) => {
    const updated = cart.filter(c => c.product.id !== productId);
    setCart(updated);
    updateCartBackend(updated);
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const total = subtotal + (cart.length > 0 ? DELIVERY_CHARGE : 0);

  return (
    <div className="animate-fade-in px-4 md:px-8 py-6 bg-gradient-to-b from-background to-secondary/20 min-h-screen">
      <h2 className="text-3xl font-heading font-bold text-foreground mb-6">Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="kc-card-flat p-12 text-center border-2 border-secondary rounded-2xl">
          <ShoppingBag className="w-16 h-16 text-primary/30 mx-auto mb-4" />
          <p className="text-xl text-muted-foreground font-bold mb-4 font-heading">Your cart is empty</p>
          <p className="text-base text-muted-foreground mb-6 font-body">Start shopping to add items to your cart</p>
          <button onClick={() => navigate('/customer/home')}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl text-base font-bold hover:shadow-lg transition-all hover:scale-105 font-heading">
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {cart.map(item => (
              <div key={item.product.id} className="kc-card-flat p-4 flex items-center gap-4 border-2 border-secondary hover:border-primary/30 hover:shadow-md transition-all duration-200">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-foreground text-base truncate">{item.product.name}</p>
                  <p className="text-sm text-primary font-semibold">₹{item.product.price} each</p>
                </div>

                <div className="flex items-center gap-2 bg-secondary/40 rounded-lg p-2 border border-secondary/60">
                  <button onClick={() => updateQty(item.product.id, -1)}
                    className="w-8 h-8 rounded-lg border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all font-bold">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-foreground w-8 text-center font-heading">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)}
                    className="w-8 h-8 rounded-lg border-2 border-primary flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all font-bold">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <p className="font-heading font-bold text-primary text-lg w-20 text-right">₹{item.product.price * item.quantity}</p>

                <button onClick={() => removeItem(item.product.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-lg transition-all hover:scale-110">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="kc-card-flat p-6 border-2 border-secondary rounded-2xl">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-base font-body text-foreground">
                <span className="font-semibold">Subtotal</span>
                <span className="font-heading font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-body text-muted-foreground">
                <span className="font-semibold">Delivery Charge</span>
                <span className="font-heading font-bold text-foreground">₹{DELIVERY_CHARGE}</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-t-2 border-secondary pt-4 mb-6">
              <span className="font-heading font-bold text-lg text-foreground">Total Amount</span>
              <span className="text-2xl font-heading font-bold text-primary">₹{total.toFixed(2)}</span>
            </div>
            <button onClick={() => navigate('/customer/payment')}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/40 transition-all hover:scale-105 font-heading">
              Proceed to Checkout <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;

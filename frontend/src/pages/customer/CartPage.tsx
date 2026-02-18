/**
 * Cart Page — Customer
 * Shows cart items with quantity controls, delivery charge, total price.
 * Proceed to Payment page for checkout.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, saveCart } from '@/lib/store';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const DELIVERY_CHARGE = 25;

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(getCart());

  const updateQty = (productId: string, delta: number) => {
    const updated = cart.map(c => {
      if (c.product.id === productId) {
        return { ...c, quantity: Math.max(1, c.quantity + delta) };
      }
      return c;
    });
    setCart(updated);
    saveCart(updated);
  };

  const removeItem = (productId: string) => {
    const updated = cart.filter(c => c.product.id !== productId);
    setCart(updated);
    saveCart(updated);
  };

  const subtotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const total = subtotal + (cart.length > 0 ? DELIVERY_CHARGE : 0);

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Your Cart</h2>

      {cart.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm mb-3">Your cart is empty</p>
          <button onClick={() => navigate('/customer/stores')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            Browse Stores
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {cart.map(item => (
              <div key={item.product.id} className="kc-card-flat p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.product.price} each</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product.id, -1)}
                    className="w-7 h-7 rounded-md border flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium text-foreground w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product.id, 1)}
                    className="w-7 h-7 rounded-md border flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="font-bold text-foreground text-sm w-16 text-right">₹{item.product.price * item.quantity}</p>

                <button onClick={() => removeItem(item.product.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="kc-card-flat p-4">
            <div className="flex justify-between text-sm text-foreground mb-1">
              <span>Subtotal</span><span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Delivery Charge</span><span>₹{DELIVERY_CHARGE}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border pt-2">
              <span className="font-heading font-bold text-foreground">Total</span>
              <span className="text-xl font-heading font-bold text-foreground">₹{total}</span>
            </div>
            <button onClick={() => navigate('/customer/payment')}
              className="w-full mt-3 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;

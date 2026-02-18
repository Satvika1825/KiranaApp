/**
 * Customer Products Page
 * Shows only products with availability=ON.
 * Includes images + add to cart toast.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProducts,
  getCart,
  saveCart,
  getShop,
  type CartItem,
} from '@/lib/store';
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Search,
  X,
} from 'lucide-react';

const CustomerProducts = () => {
  const navigate = useNavigate();
  const shop = getShop();

  const allProducts = getProducts().filter(p => p.available);

  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showToast, setShowToast] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(allProducts.map(p => p.category))];
    return ['All', ...cats.sort()];
  }, [allProducts]);

  const products = useMemo(() => {
    return allProducts.filter(p => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === 'All' ||
        p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allProducts, search, selectedCategory]);

  const getQty = (id: string) => quantities[id] || 1;

  const setQty = (id: string, qty: number) =>
    setQuantities({
      ...quantities,
      [id]: Math.max(1, qty),
    });

  const addToCart = (productId: string) => {
    const product = allProducts.find(
      p => p.id === productId
    );
    if (!product) return;

    const existing = cart.find(
      c => c.product.id === productId
    );

    let updated: CartItem[];

    if (existing) {
      updated = cart.map(c =>
        c.product.id === productId
          ? {
              ...c,
              quantity:
                c.quantity + getQty(productId),
            }
          : c
      );
    } else {
      updated = [
        ...cart,
        { product, quantity: getQty(productId) },
      ];
    }

    setCart(updated);
    saveCart(updated);

    setQuantities({
      ...quantities,
      [productId]: 1,
    });

    // Toast animation
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  const cartCount = cart.reduce(
    (s, c) => s + c.quantity,
    0
  );

  return (
    <div className="w-full px-6 lg:px-10 py-6 animate-fade-in relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">
            {shop?.shopName || 'Store'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {products.length} products available
          </p>
        </div>

        {cartCount > 0 && (
          <button
            onClick={() =>
              navigate('/customer/cart')
            }
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({cartCount})
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search products..."
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(cat)
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              selectedCategory === cat
                ? 'bg-primary text-white'
                : 'bg-accent text-accent-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-10 h-10 mx-auto mb-2 text-gray-400" />
          <p className="text-muted-foreground">
            No products found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm p-3 flex flex-col"
            >
              {/* PRODUCT IMAGE */}
              <div className="w-full h-40 overflow-hidden rounded-lg mb-3">
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-sm font-medium mb-1">
                {p.name}
              </h3>

              <p className="text-xs text-gray-500 mb-1">
                {p.category}
              </p>

              <p className="font-bold mb-2">
                ₹{p.price}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() =>
                    setQty(p.id, getQty(p.id) - 1)
                  }
                  className="w-7 h-7 border rounded flex items-center justify-center"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="w-6 text-center text-sm">
                  {getQty(p.id)}
                </span>

                <button
                  onClick={() =>
                    setQty(p.id, getQty(p.id) + 1)
                  }
                  className="w-7 h-7 border rounded flex items-center justify-center"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                onClick={() => addToCart(p.id)}
                className="w-full py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Item Added to Cart 🛒
        </div>
      )}
    </div>
  );
};

export default CustomerProducts;

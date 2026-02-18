/**
 * Customer Products Page
 * Shows only products with availability=ON.
 * Features: search bar, category filter, grid layout with quantity selector and Add to Cart.
 * IMPORTANT: Only display products where availability = ON from owner data.
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, getCart, saveCart, getShop, type CartItem } from '@/lib/store';
import { ShoppingCart, Plus, Minus, Package, Search, X } from 'lucide-react';

const CustomerProducts = () => {
  const navigate = useNavigate();
  const shop = getShop();
  // Only show available products (availability toggle = ON)
  const allProducts = getProducts().filter(p => p.available);
  const [cart, setCart] = useState<CartItem[]>(getCart());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories from available products
  const categories = useMemo(() => {
    const cats = [...new Set(allProducts.map(p => p.category))];
    return ['All', ...cats.sort()];
  }, [allProducts]);

  // Filter products by search and category
  const products = useMemo(() => {
    return allProducts.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [allProducts, search, selectedCategory]);

  const getQty = (id: string) => quantities[id] || 1;
  const setQty = (id: string, qty: number) => setQuantities({ ...quantities, [id]: Math.max(1, qty) });

  const addToCart = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(c => c.product.id === productId);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map(c => c.product.id === productId
        ? { ...c, quantity: c.quantity + getQty(productId) } : c);
    } else {
      updated = [...cart, { product, quantity: getQty(productId) }];
    }
    setCart(updated);
    saveCart(updated);
    setQuantities({ ...quantities, [productId]: 1 });
  };

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-foreground">{shop?.shopName || 'Store'}</h2>
          <p className="text-sm text-muted-foreground">{products.length} products available</p>
        </div>
        {cartCount > 0 && (
          <button onClick={() => navigate('/customer/cart')}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <ShoppingCart className="w-4 h-4" /> Cart ({cartCount})
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search products..." />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-none">
        {categories.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-accent-foreground hover:bg-accent/80'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="kc-card-flat p-8 text-center">
          <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">
            {search || selectedCategory !== 'All' ? 'No matching products found.' : 'No products available right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map(p => (
            <div key={p.id} className="kc-card-flat p-3 flex flex-col">
              {/* Product icon placeholder */}
              <div className="w-full aspect-square rounded-lg bg-accent/50 flex items-center justify-center mb-3">
                <Package className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="font-medium text-foreground text-sm flex-1 mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{p.category}</p>
              <p className="font-heading font-bold text-foreground mb-2">₹{p.price}</p>

              {/* Quantity selector */}
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setQty(p.id, getQty(p.id) - 1)}
                  className="w-7 h-7 rounded-md border flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-foreground w-6 text-center">{getQty(p.id)}</span>
                <button onClick={() => setQty(p.id, getQty(p.id) + 1)}
                  className="w-7 h-7 rounded-md border flex items-center justify-center text-foreground hover:bg-accent transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button onClick={() => addToCart(p.id)}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1">
                <ShoppingCart className="w-3 h-3" /> Add to Cart
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerProducts;

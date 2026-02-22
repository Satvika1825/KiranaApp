/**
 * Customer Products Page
 * Fetches products from backend API for a specific store (ownerId from URL).
 * Add to cart syncs to backend.
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getCustomerProfile,
  type CartItem,
} from '@/lib/store';
import { api } from '@/lib/api';
import {
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Search,
  X,
  ArrowLeft,
} from 'lucide-react';

const CustomerProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get store info from URL query params (set by CustomerHome when clicking a store)
  const ownerId = searchParams.get('ownerId') || '';
  const storeId = searchParams.get('storeId') || '';

  const customer = getCustomerProfile();
  const userId = customer?.id || 'guest';

  const [storeName, setStoreName] = useState('Store');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);

  // Fetch store name, products and cart from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch store name and products
        const storePromise = storeId ? api.stores.getById(storeId) : (ownerId ? api.stores.getByOwner(ownerId) : Promise.resolve(null));
        const productsPromise = api.products.getAll(ownerId || undefined);
        const cartPromise = api.cart.get(userId);

        const [storeData, productsData, cartData] = await Promise.all([
          storePromise,
          productsPromise,
          cartPromise
        ]);

        if (storeData?.store?.shopName) setStoreName(storeData.store.shopName);

        if (productsData.products) {
          const mapped = productsData.products.map((p: any) => ({
            id: p._id || p.id,
            shopOwnerId: p.shopOwnerId,
            name: p.name,
            price: p.price,
            available: p.available,
            category: p.category,
            image: p.image || ''
          }));
          setAllProducts(mapped.filter((p: any) => p.available));
        }

        if (cartData?.items) {
          const mappedCart = cartData.items.map((item: any) => ({
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
          setCart(mappedCart);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [ownerId, storeId, userId]);

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

  const addToCart = async (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    setCartLoading(true);
    try {
      const existing = cart.find(c => c.product.id === productId);
      let updated: CartItem[];

      if (existing) {
        updated = cart.map(c =>
          c.product.id === productId
            ? { ...c, quantity: c.quantity + getQty(productId) }
            : c
        );
      } else {
        updated = [
          ...cart,
          { product, quantity: getQty(productId) },
        ];
      }

      setCart(updated);

      // Sync to backend
      const apiItems = updated.map(c => ({
        productId: c.product.id,
        quantity: c.quantity,
        name: c.product.name,
        price: c.product.price,
        shopOwnerId: c.product.shopOwnerId
      }));
      await api.cart.update(userId, apiItems);

      setQuantities({
        ...quantities,
        [productId]: 1,
      });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
    } catch (err) {
      console.error('Failed to update cart', err);
    } finally {
      setCartLoading(false);
    }
  };

  const cartCount = cart.reduce(
    (s, c) => s + c.quantity,
    0
  );

  return (
    <div className="w-full px-6 lg:px-10 py-6 animate-fade-in relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/customer/home')} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-xl font-bold">{storeName}</h2>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${products.length} products available`}
            </p>
          </div>
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
            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${selectedCategory === cat
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
              <div className="w-full h-36 overflow-hidden rounded-xl mb-3 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
                  />
                ) : null}
                <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${p.image ? 'hidden' : ''}`}>
                  <span className="text-3xl font-bold text-slate-400">{p.name.charAt(0).toUpperCase()}</span>
                  <span className="text-xs text-slate-400">{p.category}</span>
                </div>
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

/**
 * Customer Products Page
 * Fetches products from backend API for a specific store (ownerId from URL).
 * Add to cart syncs to backend.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
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
  Camera,
  Store,
  Upload,
} from 'lucide-react';
import GroceryListModal from '@/components/customer/GroceryListModal';


const CustomerProducts = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get store info from URL query params (set by CustomerHome when clicking a store)
  const ownerId = searchParams.get('ownerId') || '';
  const storeId = searchParams.get('storeId') || '';

  const customer = getCustomerProfile();
  const userId = customer?.id || 'guest';

  const [storeName, setStoreName] = useState('Store');
  const [storePhoto, setStorePhoto] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


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
        if (storeData?.store?.shopPhoto) setStorePhoto(storeData.store.shopPhoto);

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
              category: '',
              image: ''
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

  const handleBulkAdd = async (items: any[]) => {
    setCartLoading(true);
    try {
      let updated = [...cart];

      items.forEach(item => {
        const existing = updated.find(c => c.product.id === item.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          updated.push({
            product: {
              id: item.id,
              name: item.name,
              price: item.price,
              shopOwnerId: ownerId,
              available: true,
              category: item.category || '',
              image: item.image || ''
            },
            quantity: 1
          });
        }
      });

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

      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to update cart bulk', err);
    } finally {
      setCartLoading(false);
    }
  };


  const cartCount = cart.reduce(
    (s, c) => s + c.quantity,
    0
  );

  return (
    <div className="w-full h-screen bg-background animate-fade-in relative pb-20 overflow-y-auto">
      {/* Store Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden bg-muted">
        {storePhoto ? (
          <img
            src={storePhoto}
            alt={storeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/30 flex items-center justify-center">
            <Store className="w-16 h-16 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/30" />

        {/* Back Button Overlay */}
        <button
          onClick={() => navigate('/customer/home')}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Cart Button Overlay */}
        {cartCount > 0 && (
          <button
            onClick={() => navigate('/customer/cart')}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 shadow-lg z-10"
          >
            <ShoppingCart className="w-4 h-4" />
            Cart ({cartCount})
          </button>
        )}

        {/* Store Name and Action Buttons Overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-1 drop-shadow-md">{storeName}</h2>
          <p className="text-sm opacity-90 drop-shadow-sm font-medium mb-2">
            {loading ? 'Loading...' : `${products.length} products available`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={scrollToProducts}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-primary text-white rounded-md font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/60 hover:shadow-primary/100 hover:scale-105 animate-pulse"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={() => setIsListModalOpen(true)}
              className="flex items-center justify-center gap-1 px-3 py-2 bg-accent text-foreground rounded-md font-semibold text-sm hover:bg-accent/80 transition-all shadow-lg shadow-accent/60 hover:shadow-accent/100 hover:scale-105 animate-pulse"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 pt-6 mb-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
            className="w-full pl-9 pr-24 py-3 rounded-xl border bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search products in this store..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {search && (
              <button
                onClick={() => setSearch('')}
                className="p-1 text-muted-foreground hover:bg-accent rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsListModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              UPLOAD LIST
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(cat)
              }
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-primary text-white shadow-md'
                : 'bg-white border text-muted-foreground hover:bg-accent'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div ref={productsRef} className="px-4 lg:px-6">

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
          <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Items Added to Cart 🛒
          </div>
        )}

        {/* Grocery List Modal */}
        <GroceryListModal
          isOpen={isListModalOpen}
          onClose={() => setIsListModalOpen(false)}
          ownerId={ownerId}
          onConfirm={handleBulkAdd}
        />
      </div>
    </div>
  );
};

export default CustomerProducts;

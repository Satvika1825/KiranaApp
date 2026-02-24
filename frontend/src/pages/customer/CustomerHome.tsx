import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, Camera, MessageSquare, Heart, Tag,
  Plus, Rocket, Leaf, ShieldCheck, Package,
  Upload, Mic,
  ChevronLeft, ChevronRight, Store, MapPin, Clock
} from "lucide-react";
import { getOrders, getCart, saveCart, type Product } from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";
import ProductCarousel from "@/components/ProductCarousel";
import FavStoreCard from "@/components/FavStoreCard";
import BulkOrderCard from "@/components/BulkOrderCard";
import JoinBulkOrderModal from "@/components/JoinBulkOrderModal";

/* ── Hero image from public folder ── */
const heroImage = "/hero-grocery.jpg";

/* ──────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);

const isOpenNow = (openingTime: string, closingTime: string) => {
  if (!openingTime || !closingTime) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const parseTime = (t: string) => {
    const clean = t.replace(/\s?(AM|PM)/i, "");
    const [h, m] = clean.split(":").map(Number);
    const suffix = t.toUpperCase().includes("PM") ? "PM" : "AM";
    return (suffix === "PM" && h !== 12 ? h + 12 : h === 12 && suffix === "AM" ? 0 : h) * 60 + (m || 0);
  };
  return current >= parseTime(openingTime) && current <= parseTime(closingTime);
};

/* ──────────────────────────────────────────────
   Image Map (from File 2)
─────────────────────────────────────────────── */

const imageMap: Record<string, string> = {
  "Toor Dal": "https://images.unsplash.com/photo-1585996839865-b4fb76d35082?w=300&h=300&fit=crop",
  "Basmati Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
  "Amul Butter": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop",
  "Sugar": "https://images.unsplash.com/photo-1550411294-098c82e1a7be?w=300&h=300&fit=crop",
  "Sunflower Oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop",
  "Wheat Flour": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop",
  "Onion": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop",
  "Dal": "https://images.unsplash.com/photo-1585996839865-b4fb76d35082?w=300&h=300&fit=crop",
  "Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop",
  "Salt": "https://images.unsplash.com/photo-1550411294-098c82e1a7be?w=300&h=300&fit=crop",
};

const resolveImage = (product: any): string => {
  if (product.image) return product.image;
  const match = Object.entries(imageMap).find(([key]) => product.name?.includes(key));
  return match ? match[1] : "";
};

/* ──────────────────────────────────────────────
   Main Component
─────────────────────────────────────────────── */

const CustomerHome = () => {
  const navigate = useNavigate();

  /* ── State ─────────────────────────── */
  const [favStores, setFavStores] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [essentialsProgress, setEssentialsProgress] = useState(0);
  const [popularProgress, setPopularProgress] = useState(0);
  const [bulkOrderInfo, setBulkOrderInfo] = useState<any>(null);
  const [showJoinBulkModal, setShowJoinBulkModal] = useState(false);
  const scrollRefEssentials = useRef<HTMLDivElement>(null);
  const scrollRefPopular = useRef<HTMLDivElement>(null);

  const [favStoreIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("kc_fav_shops") || "[]");
    } catch {
      return [];
    }
  });

  const fetchBulkOrderData = async () => {
    try {
      const customerId = localStorage.getItem("kc_user_id");
      const apartmentId = localStorage.getItem("kc_apartment_id");
      
      console.log('🔍 Fetching bulk order - Customer:', customerId, 'Apartment:', apartmentId);
      
      if (!customerId || !api.bulkOrders?.getCurrentOrder) {
        console.log('⚠️ Missing customerId or API method');
        return;
      }
      
      const bulkOrderResponse = await api.bulkOrders.getCurrentOrder(customerId);
      console.log('📦 Bulk order response:', bulkOrderResponse);
      
      if (bulkOrderResponse?.bulkOrder) {
        console.log('✅ Bulk order found:', bulkOrderResponse.bulkOrder.apartment?.name);
        setBulkOrderInfo(bulkOrderResponse);
      } else {
        console.log('ℹ️ No active bulk order for this apartment');
      }
    } catch (err) {
      console.error('❌ Bulk order fetch error:', err);
    }
  };

  /* ── Fallback Mock Data (File 1 style with Unsplash images) ── */
  const screenshotProducts: Product[] = [
    { id: "1", shopOwnerId: "m1", name: "Toor Dal (1kg)", price: 140, available: true, category: "Pulses", image: "https://images.unsplash.com/photo-1585996839865-b4fb76d35082?w=300&h=300&fit=crop" },
    { id: "2", shopOwnerId: "m1", name: "Basmati Rice (5kg)", price: 450, available: true, category: "Grains", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop" },
    { id: "3", shopOwnerId: "m1", name: "Amul Butter (500g)", price: 280, available: true, category: "Dairy", image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop" },
    { id: "4", shopOwnerId: "m1", name: "Sugar (1kg)", price: 48, available: true, category: "Groceries", image: "https://images.unsplash.com/photo-1550411294-098c82e1a7be?w=300&h=300&fit=crop" },
    { id: "5", shopOwnerId: "m1", name: "Sunflower Oil (1L)", price: 180, available: true, category: "Oil", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop" },
    { id: "6", shopOwnerId: "m1", name: "Wheat Flour (5kg)", price: 220, available: true, category: "Atta", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop" },
    { id: "7", shopOwnerId: "m1", name: "Fresh Onion (1kg)", price: 35, available: true, category: "Vegetables", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop" },
    { id: "8", shopOwnerId: "m1", name: "Green Tea (100g)", price: 190, available: true, category: "Beverages", image: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=300&h=300&fit=crop" },
  ];

  /* ── Fetch from Backend (File 2 pattern) ──────── */
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [storesData, productsData] = await Promise.all([
          api.stores.getAll(),
          api.products.getAll(),
        ]);

        // Fetch bulk order data after 500ms to ensure apartment is set
        setTimeout(() => fetchBulkOrderData(), 500);

        // ── Stores: filter by favs, then inject both mock stores ──
        const shops: any[] = storesData.stores || [];
        const filtered = shops.filter((s: any) => favStoreIds.includes(s._id));

        const ram = {
          _id: "mock_ram",
          ownerId: "mock_owner",
          shopName: "Ram's Kirana Store",
          address: { area: "MG Road, Hyderabad" },
          openingTime: "7:00 AM",
          closingTime: "9:00 PM",
          shopPhoto: null,
        };
        const krishna = {
          _id: "mock_krishna",
          ownerId: "mock_owner2",
          shopName: "Krishna General Store",
          address: { area: "Banjara Hills" },
          openingTime: "8:00 AM",
          closingTime: "10:00 PM",
          shopPhoto: null,
        };

        if (!filtered.find((s: any) => s.shopName?.includes("Ram"))) filtered.unshift(ram);
        if (!filtered.find((s: any) => s.shopName?.includes("Krishna"))) filtered.push(krishna);

        setFavStores(filtered);

        // ── Products: map API data, resolve images via imageMap ──
        if (productsData.products?.length > 0) {
          setDbProducts(
            productsData.products.map((p: any) => ({
              id: p.id || p._id,
              shopOwnerId: p.shopOwnerId,
              name: p.name,
              price: p.price,
              available: p.available,
              category: p.category,
              image: resolveImage(p),
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [favStoreIds]);

  // Refresh bulk order data when page comes into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchBulkOrderData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /* ── Derived Data ────────────────────────── */
  const displayProducts = dbProducts.length > 0 ? dbProducts : screenshotProducts;
  const available = displayProducts.filter((p) => p.available);
  const essentials = available.slice(0, 8);
  const popular = [...available].reverse().slice(0, 8);

  /* ── Cart ───────────────────────────────── */
  const addToCart = (product: Product) => {
    const cart = getCart() || [];
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ product, quantity: 1 });
    saveCart(cart);
    toast.success(`${product.name} added to cart!`);
  };

  /* ── Bulk Order ──────────────────────── */
  const handleJoinBulkOrder = async () => {
    try {
      const customerId = localStorage.getItem("kc_user_id");
      const apartmentId = localStorage.getItem("kc_apartment_id");
      
      if (!customerId || !apartmentId) {
        toast.error("Please set your apartment first");
        return;
      }

      // Get current cart to join bulk order
      const cart = getCart() || [];
      if (cart.length === 0) {
        toast.error("Add items to your cart first");
        return;
      }

      // Calculate totals from cart
      const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const shopOwnerId = cart[0].product.shopOwnerId; // Assuming all from same shop
      
      // Get first order ID if available, otherwise generate temp ID
      const orderId = `order_${Date.now()}`;

      // Join the bulk order
      await api.bulkOrders.joinOrder(
        customerId,
        apartmentId,
        orderId,
        cart.map(item => ({ 
          product: item.product.id, 
          quantity: item.quantity, 
          price: item.product.price 
        })),
        cartTotal,
        shopOwnerId
      );

      toast.success("🎉 You've joined the bulk order!");
      setShowJoinBulkModal(false);
      
      // Refresh bulk order info
      const updated = await api.bulkOrders.getCurrentOrder(customerId);
      if (updated?.bulkOrder) {
        setBulkOrderInfo(updated);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join bulk order");
    }
  };

  /* ── Active Order ────────────────────────── */
  const orders = getOrders() || [];
  const activeOrder = orders.find((o) => o.status !== "Delivered");

  /* ── Scroll Helpers (File 2 pattern) ─────── */
  const handleScroll = (
    ref: React.RefObject<HTMLDivElement>,
    setProgress: (v: number) => void
  ) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    if (scrollWidth <= clientWidth) return;
    setProgress((scrollLeft / (scrollWidth - clientWidth)) * 100);
  };

  const scrollHoriz = (
    ref: React.RefObject<HTMLDivElement>,
    dir: "left" | "right"
  ) => {
    if (!ref.current) return;
    const { scrollLeft, clientWidth } = ref.current;
    const target =
      dir === "left"
        ? scrollLeft - clientWidth * 0.8
        : scrollLeft + clientWidth * 0.8;
    ref.current.scrollTo({ left: target, behavior: "smooth" });
  };

  const trustBadges = [
    { icon: Rocket, label: "Fast Delivery" },
    { icon: Leaf, label: "Fresh Products" },
    { icon: ShieldCheck, label: "Trusted Stores" },
  ];

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">

      {/* ── Hero ───────────────────────────── */}
      <section className="relative h-[75vh] min-h-[480px] overflow-hidden">
        <img
          src={heroImage}
          alt="Fresh groceries"
          className="absolute inset-0 w-full h-full object-cover scale-105"
          style={{ animation: "heroZoom 8s ease-out forwards" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        <style>{`
          @keyframes heroZoom { from { transform: scale(1.08); } to { transform: scale(1); } }
          @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes fadeSlideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2); } 50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3); } }
          @keyframes buttonFloat { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
          @keyframes slideUpEnhanced { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideUpCardBounce { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes textGlow { 0%, 100% { text-shadow: 0 0 10px rgba(34, 197, 94, 0.3); } 50% { text-shadow: 0 0 20px rgba(34, 197, 94, 0.6); } }
          @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.05); } }
          @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
          @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
          .hero-icon { animation: fadeSlideDown 0.6s ease-out 0.1s both; }
          .hero-title { animation: fadeSlideUp 0.7s ease-out 0.25s both; }
          .hero-sub { animation: fadeSlideUp 0.7s ease-out 0.45s both; }
          .hero-btn { animation: fadeSlideUp 0.7s ease-out 0.6s both, pulseGlow 2.5s ease-in-out 1.3s infinite, buttonFloat 3s ease-in-out 1.3s infinite; }
          .section-title { animation: fadeSlideDown 0.6s ease-out both; }
        `}</style>
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-10 px-6 text-center">
          <div className="hero-icon w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl">
            <Package className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="hero-title text-3xl md:text-5xl font-extrabold text-primary-foreground mb-3 font-display">
            KiranaConnect
          </h1>
          <p className="hero-sub text-base md:text-lg text-primary-foreground/80 max-w-md mb-6">
            Fresh groceries from trusted local stores, delivered to your door
          </p>
          <button
            onClick={() => navigate("/customer/stores")}
            className="hero-btn px-9 py-3.5 bg-primary text-primary-foreground font-bold text-base rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            Browse Stores
          </button>
        </div>
      </section>

      {/* ── Upload List CTA Below Hero ─────────────── */}
      <section className="w-full overflow-hidden">
        <div className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 py-6">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 backdrop-blur-sm rounded-3xl p-8 text-center space-y-5 hover:scale-[1.01] transition-transform duration-500" style={{ animation: "slideUpEnhanced 0.8s ease-out 0.2s both" }}>
            <div className="flex justify-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center hover:scale-110 transition-transform" style={{ animation: "pulse 2s ease-in-out infinite" }}>
                <Camera className="w-7 h-7 text-primary" />
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center hover:scale-110 transition-transform" style={{ animation: "pulse 2s ease-in-out 0.3s infinite" }}>
                <Mic className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary font-display">📸 Upload your list</h3>
              <p className="text-muted-foreground mt-2 text-base">Take a photo or speak your items — we'll find everything!</p>
            </div>
            <button
              onClick={() => navigate("/customer/upload-list")}
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all inline-block hover:shadow-xl"
              style={{ animation: "textGlow 2s ease-in-out 1s infinite" }}
            >
              Upload Now →
            </button>
          </div>
        </div>
      </section>

      <div className="w-full max-w-screen-xl mx-auto px-2 sm:px-4 py-8 space-y-10">

        {/* ── Bulk Order Section ──────────────────── */}
        {localStorage.getItem("kc_apartment_id") && (
          <>
            {bulkOrderInfo?.bulkOrder ? (
              <BulkOrderCard
                apartmentName={bulkOrderInfo.bulkOrder.apartment?.name || "Your Apartment"}
                participatingFamilies={bulkOrderInfo.bulkOrder.totalFamilies || 1}
                timeRemaining={bulkOrderInfo.timeRemaining || 30}
                deliveryDiscount={bulkOrderInfo.bulkOrder.deliveryFeeDiscount || 15}
                onJoin={() => setShowJoinBulkModal(true)}
                isActive={true}
                windowStart={bulkOrderInfo.windowStart || "18:00"}
                windowEnd={bulkOrderInfo.windowEnd || "19:00"}
              />
            ) : (
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-3xl p-8 text-center flex flex-col items-center gap-5 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-2 shadow-xl">
                  <Package className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-primary font-display mb-2">Start Exploring Our Stores!</h3>
                <p className="text-muted-foreground text-base mb-4">Bulk ordering is available for your apartment at specific times. Browse stores, add items to your cart, and join the next bulk order window for extra savings!</p>
                <button
                  onClick={() => navigate("/customer/stores")}
                  className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
                >
                  Explore Stores
                </button>
                <div className="text-xs text-muted-foreground mt-2">Bulk order windows are shown here when active.</div>
              </div>
            )}
          </>
        )}

        <JoinBulkOrderModal
          isOpen={showJoinBulkModal}
          onClose={() => setShowJoinBulkModal(false)}
          apartmentName={bulkOrderInfo?.bulkOrder?.apartment?.name || "Your Apartment"}
          onConfirm={handleJoinBulkOrder}
          participatingFamilies={bulkOrderInfo?.bulkOrder?.totalFamilies || 1}
          deliveryDiscount={bulkOrderInfo?.bulkOrder?.deliveryFeeDiscount || 15}
        />

        {/* ── Active Order ─────────────────── */}
        {activeOrder && (
          <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4 hover:scale-[1.02] transition-transform duration-300 border border-primary/20" style={{ animation: "slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center hover:scale-110 transition-transform" style={{ animation: "pulse 2s ease-in-out infinite" }}>
                <Truck className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-card-foreground">
                  Your order is on the way!
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeOrder.status}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/customer/order/${activeOrder.id || activeOrder._id}`
                )
              }
              className="text-primary font-bold text-sm whitespace-nowrap hover:gap-2 transition-all"
            >
              Track →
            </button>
          </div>
        )}

        {/* ── Favourite Shops ────────────────── */}
        <section className="space-y-4">
          <h2 className="section-title">Favourite Shops</h2>

          {loading ? (
            /* Skeleton while loading from backend */
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[200px] h-[160px] rounded-2xl bg-secondary animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          ) : favStores.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {favStores.map((s, i) => (
                /* Use FavStoreCard if available; fallback to inline card */
                typeof FavStoreCard !== "undefined" ? (
                  <FavStoreCard
                    key={s._id}
                    store={s}
                    index={i}
                    onClick={() =>
                      navigate(
                        `/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`
                      )
                    }
                  />
                ) : (
                  <div
                    key={s._id}
                    onClick={() =>
                      navigate(
                        `/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`
                      )
                    }
                    className="min-w-[240px] bg-card rounded-2xl shadow-lg border-2 border-border overflow-hidden flex-shrink-0 snap-start cursor-pointer hover:shadow-2xl hover:scale-[1.04] transition-all duration-300"
                    style={{ animation: `slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 100}ms both` }}
                  >
                    <div className="h-28 bg-gradient-to-br from-secondary/60 to-secondary/30 flex items-center justify-center relative overflow-hidden">
                      {s.shopPhoto ? (
                        <img
                          src={s.shopPhoto}
                          alt={s.shopName}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Store className="w-10 h-10 text-muted-foreground/30" />
                      )}
                      <Heart className="absolute top-3 right-3 w-5 h-5 text-rose-500 fill-rose-500 hover:scale-125 transition-transform" />
                    </div>
                    <div className="p-4 space-y-1.5">
                      <h4 className="font-bold text-card-foreground text-sm leading-tight">
                        {s.shopName}
                      </h4>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin size={12} className="text-primary" />
                        {s.address?.area || "Local Market"}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} className="text-primary" />
                        {s.openingTime} – {s.closingTime}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          isOpenNow(s.openingTime, s.closingTime)
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isOpenNow(s.openingTime, s.closingTime)
                          ? "● Open"
                          : "● Closed"}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No favourite shops yet. Browse stores to add some!
            </div>
          )}
        </section>

        {/* ── Daily Essentials ─────────────── */}
        {loading ? (
          <section className="space-y-4">
            <h2 className="section-title">Daily Essentials</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[160px] h-[220px] rounded-2xl bg-secondary animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          </section>
        ) : (
          /* ── Use ProductCarousel (File 1) if available, else inline carousel ── */
          typeof ProductCarousel !== "undefined" ? (
            <ProductCarousel
              title="Daily Essentials"
              products={essentials}
              onAddToCart={addToCart}
            />
          ) : (
            <section className="space-y-4">
              <h2 className="section-title">Daily Essentials</h2>
              <div className="relative">
                <div
                  ref={scrollRefEssentials}
                  onScroll={() =>
                    handleScroll(scrollRefEssentials, setEssentialsProgress)
                  }
                  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
                >
                  {essentials.map((p) => (
                    <div
                      key={p.id}
                      className="min-w-[160px] bg-card rounded-2xl shadow border border-border overflow-hidden flex-shrink-0 snap-start hover:shadow-md hover:scale-[1.02] transition-all"
                    >
                      <div className="aspect-square bg-secondary/30 flex items-center justify-center m-2 rounded-xl overflow-hidden">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-10 h-10 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm font-semibold text-card-foreground line-clamp-2">
                          {p.name}
                        </p>
                        <p className="text-primary font-bold">
                          {formatPrice(p.price)}
                        </p>
                        <button
                          onClick={() => addToCart(p)}
                          className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => scrollHoriz(scrollRefEssentials, "left")}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${essentialsProgress}%` }}
                    />
                  </div>
                  <button
                    onClick={() => scrollHoriz(scrollRefEssentials, "right")}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </section>
          )
        )}



        {/* ── WhatsApp Bar ────────────────── */}
        <section className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-primary-foreground/10 shadow-xl hover:scale-[1.01] transition-transform duration-300" style={{ animation: "slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center hover:scale-110 transition-transform" style={{ animation: "pulse 2s ease-in-out infinite" }}>
              <MessageSquare className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-primary-foreground text-lg">
                Order via WhatsApp
              </p>
              <p className="text-sm text-primary-foreground/80">
                Send your list — super fast & easy!
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open("https://wa.me/911234567890")}
            className="px-6 py-2.5 bg-primary-foreground text-primary font-bold rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
          >
            Chat Now →
          </button>
        </section>

        {/* ── Popular Near You ─────────────── */}
        {loading ? (
          <section className="space-y-4">
            <h2 className="section-title">Popular Near You</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[160px] h-[220px] rounded-2xl bg-secondary animate-pulse flex-shrink-0"
                />
              ))}
            </div>
          </section>
        ) : typeof ProductCarousel !== "undefined" ? (
          <ProductCarousel
            title="Popular Near You"
            products={popular}
            onAddToCart={addToCart}
            badge="Popular"
          />
        ) : (
          <section className="space-y-4">
            <h2 className="section-title">Popular Near You</h2>
            <div className="relative">
              <div
                ref={scrollRefPopular}
                onScroll={() =>
                  handleScroll(scrollRefPopular, setPopularProgress)
                }
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              >
                {popular.map((p) => (
                  <div
                    key={p.id}
                    className="min-w-[160px] bg-card rounded-2xl shadow border border-border overflow-hidden flex-shrink-0 snap-start hover:shadow-md hover:scale-[1.02] transition-all relative"
                  >
                    <div className="aspect-square bg-secondary/30 flex items-center justify-center m-2 rounded-xl overflow-hidden">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-muted-foreground/30" />
                      )}
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded">
                        Popular
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-sm font-semibold text-card-foreground line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-primary font-bold">
                        {formatPrice(p.price)}
                      </p>
                      <button
                        onClick={() => addToCart(p)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => scrollHoriz(scrollRefPopular, "left")}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${popularProgress}%` }}
                  />
                </div>
                <button
                  onClick={() => scrollHoriz(scrollRefPopular, "right")}
                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Offers Grid ──────────────────── */}
        <section className="space-y-6">
          <h2 className="section-title">Offers & Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: "Unlock extra ₹50 OFF",
                sub: "Shop for ₹599 more",
                gradient: "from-yellow-400 to-yellow-500",
                icon: Tag,
              },
              {
                title: "Flat 20% Discount",
                sub: "Use code FIRST20",
                gradient: "from-primary to-primary/80",
                icon: Tag,
              },
              {
                title: "Free Delivery",
                sub: "On orders above ₹199",
                gradient: "from-purple-500 to-purple-600",
                icon: Truck,
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${c.gradient} rounded-2xl p-6 text-primary-foreground space-y-3 hover:scale-[1.04] hover:shadow-2xl transition-all cursor-pointer border border-white/20`}
                style={{ animation: `slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.1 + i * 0.15}s both` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center hover:scale-110 transition-transform hover:bg-primary-foreground/30">
                  <c.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{c.title}</h3>
                  <p className="text-sm opacity-90 mt-1">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust Badges ─────────────────── */}
        <section className="flex justify-center gap-8 md:gap-16 py-12">
          {trustBadges.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 text-center hover:scale-110 transition-transform duration-300"
              style={{ animation: `slideUpCardBounce 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.2 + i * 0.15}s both` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20 hover:scale-125 transition-transform" style={{ animation: "pulse 2s ease-in-out infinite" }}>
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <span className="text-sm font-bold text-card-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default CustomerHome;
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  Camera,
  MessageSquare,
  Heart,
  Tag,
  ChevronLeft,
  ChevronRight,
  Plus,
  Rocket,
  Leaf,
  ShieldCheck,
  Package,
  MapPin,
  ChevronRight as ChevronRightIcon,
  ShoppingBasket,
  Clock,
  Store,
  ListChecks,
  Upload,
  HelpCircle,
  Mic
} from "lucide-react";
import {
  getProducts,
  getOrders,
  getCart,
  saveCart,
  type Product,
} from "@/lib/store";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  return current >= oh * 60 + om && current <= ch * 60 + cm;
};

/* ──────────────────────────────────────────────
   Main Component
─────────────────────────────────────────────── */

const CustomerHome = () => {
  const navigate = useNavigate();
  const scrollRefEssentials = useRef<HTMLDivElement>(null);
  const scrollRefFavs = useRef<HTMLDivElement>(null);
  /* ── State ─────────────────────────── */
  const [favStores, setFavStores] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const [favStoreIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("kc_fav_shops") || "[]");
    } catch {
      return [];
    }
  });

  // Realistic mock data as seen in the screenshot (preserved as ultimate fallback)
  const screenshotProducts: Product[] = [
    { id: "1", shopOwnerId: "m1", name: "Toor Dal (1kg)", price: 140, available: true, category: "Pulses", image: "/images/pulses.png" },
    { id: "2", shopOwnerId: "m1", name: "Basmati Rice (5kg)", price: 450, available: true, category: "Grains", image: "/images/basmathi.png" },
    { id: "3", shopOwnerId: "m1", name: "Amul Butter (500g)", price: 280, available: true, category: "Dairy", image: "/images/amulbutter.png" },
    { id: "4", shopOwnerId: "m1", name: "Sugar (1kg)", price: 48, available: true, category: "Groceries", image: "/images/sugar.png" },
    { id: "5", shopOwnerId: "m1", name: "Sunflower Oil (1L)", price: 180, available: true, category: "Oil", image: "/images/sunflower.png" },
    { id: "6", shopOwnerId: "m1", name: "Wheat Flour (5kg)", price: 220, available: true, category: "Atta", image: "/images/wheat.png" },
    { id: "7", shopOwnerId: "m1", name: "Onion (1kg)", price: 35, available: true, category: "Vegetables", image: "/images/onion.png" },
  ];

  const imageMap: Record<string, string> = {
    "Toor Dal": "/images/pulses.png",
    "Basmati Rice": "/images/basmathi.png",
    "Amul Butter": "/images/amulbutter.png",
    "Sugar": "/images/sugar.png",
    "Sunflower Oil": "/images/sunflower.png",
    "Wheat Flour": "/images/wheat.png",
    "Onion": "/images/onion.png",
    "Dal": "/images/dal.png",
    "Rice": "/images/rice.png",
    "Salt": "/images/salt.png"
  };

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [storesData, productsData] = await Promise.all([
          api.stores.getAll(),
          api.products.getAll()
        ]);

        // Fav Stores logic
        const shops = storesData.stores || [];
        const filteredShops = shops.filter((s: any) => favStoreIds.includes(s._id));
        const ramStore = { _id: "mock_ram", ownerId: "mock_owner", shopName: "Ram's Kirana & General Store", address: { area: "MG Road, Hyderabad" }, openingTime: "07:00 AM", closingTime: "09:00 PM", shopPhoto: null };
        if (!filteredShops.find((s: any) => s.shopName.includes("Ram"))) filteredShops.unshift(ramStore);
        setFavStores(filteredShops);

        // Products logic
        if (productsData.products && productsData.products.length > 0) {
          const mapped = productsData.products.map((p: any) => ({
            id: p.id || p._id,
            shopOwnerId: p.shopOwnerId,
            name: p.name,
            price: p.price,
            available: p.available,
            category: p.category,
            image: p.image || Object.entries(imageMap).find(([name]) => p.name.includes(name))?.[1] || ""
          }));
          setDbProducts(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, [favStoreIds]);

  const displayProducts = dbProducts.length > 0 ? dbProducts : screenshotProducts;
  const availableProducts = displayProducts.filter((p) => p.available);

  // Carousel items
  const essentials = availableProducts.length > 4 ? availableProducts.slice(0, 8) : [...availableProducts, ...screenshotProducts].slice(0, 8);
  const popular = availableProducts.length > 4 ? availableProducts.slice(Math.max(0, availableProducts.length - 8)) : [...screenshotProducts, ...availableProducts].slice(0, 8);


  const addToCart = (product: Product) => {
    const cart = getCart() || [];
    const existing = cart.find((c) => c.product.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ product, quantity: 1 });
    saveCart(cart);
    toast.success(`${product.name} added!`);
  };

  const orders = getOrders() || [];
  const activeOrder = orders.find((o) => o.status !== "Delivered");


  const handleScroll = (ref: React.RefObject<HTMLDivElement>, setProgress: (val: number) => void) => {
    if (!ref.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = ref.current;
    if (scrollWidth <= clientWidth) return;
    const progress = (scrollLeft / (scrollWidth - clientWidth)) * 100;
    setProgress(progress);
  };

  const scrollHoriz = (ref: React.RefObject<HTMLDivElement>, dir: "left" | "right") => {
    if (!ref.current) return;
    const { scrollLeft, clientWidth } = ref.current;
    const target = dir === "left" ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
    ref.current.scrollTo({ left: target, behavior: "smooth" });
  };

  const quickActions = [
    { label: "Track Order", icon: ListChecks, path: "/customer/orders" },
    { label: "Upload List", icon: Upload, path: "/customer/upload-list" },
    { label: "WhatsApp Order", icon: MessageSquare, path: "https://wa.me/911234567890" },
    { label: "Favourites", icon: Heart, path: "/customer/saved-lists" },
    { label: "Offers", icon: Tag, path: "/customer/home" },
    { label: "Help", icon: HelpCircle, path: "/customer/profile" },
  ];

  return (
    <div className="pb-10 animate-in fade-in duration-500 bg-[#f8fafc]">

      {/* ── 1. Hero Section ────────────────────────────── */}
      <section className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero_bg.png"
            alt="Grocery Store"
            className="w-full h-full object-cover"
          />
          {/* Overlay Filter */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl animate-scale-in">
          {/* Logo Center Box */}
          <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-emerald-600 rounded-[20px] md:rounded-[24px] flex items-center justify-center border-4 border-white/20 shadow-2xl mb-6 animate-float">
            <ShoppingBasket className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>

          <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4 drop-shadow-lg whitespace-nowrap">
            Welcome to <span className="text-emerald-400">KiranaConnect</span>
          </h2>
          <p className="text-lg md:text-2xl text-emerald-50 font-medium mb-12 drop-shadow-md">
            Explore fresh groceries from trusted local stores
          </p>

          <button
            onClick={() => navigate('/customer/stores')}
            className="px-12 py-5 bg-emerald-600 text-white font-black text-xl rounded-full shadow-2xl hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all text-center"
          >
            Browse Stores
          </button>
        </div>
      </section>

      {/* ── 2. Content Sections ───────────────────── */}
      <div className="relative z-20 px-4 md:px-8 py-10 space-y-16">




        {/* Active Order Tracker (Minimal Screenshot Style) */}
        {activeOrder && (
          <section className="animate-scale-in max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 rounded-2xl">
                    <Truck className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">Your order is on the way!</h3>
                    <p className="text-xs text-gray-400 font-medium">{activeOrder.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/customer/order/${activeOrder?.id || activeOrder?._id}`)}
                  className="text-emerald-600 font-bold text-sm tracking-tight"
                >
                  Track →
                </button>
              </div>

              <div className="relative h-2 bg-gray-50 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '45%' }} />
              </div>

              <div className="text-[10px] text-gray-400 font-medium">
                Order #{activeOrder.id || activeOrder._id?.substring(0, 8)}
              </div>
            </div>
          </section>
        )}

        {/* Favourite Shops Section (Minimal Style) */}
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Favourite Shops</h2>

          {favStores.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {favStores.map((s) => (
                <div
                  key={s._id}
                  onClick={() => navigate(`/customer/products?storeId=${s._id}&ownerId=${s.ownerId}`)}
                  className="min-w-[280px] bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden flex-shrink-0 snap-start cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="h-32 bg-[#eefcf4] flex items-center justify-center relative m-2 rounded-[1.5rem] overflow-hidden">
                    {s.shopPhoto ? (
                      <img src={s.shopPhoto} alt={s.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-10 h-10 text-emerald-300" />
                    )}
                    <div className="absolute top-3 right-3">
                      <Heart className="w-6 h-6 text-rose-500 fill-rose-500 transition-all scale-110" />
                    </div>
                  </div>
                  <div className="p-5 pt-1">
                    <h4 className="text-lg font-bold text-gray-900 leading-tight mb-2">{s.shopName}</h4>
                    <div className="flex flex-col gap-1.5 mb-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                        <MapPin size={14} className="text-gray-300" /> {s.address?.area || "Local Market"}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                        <Clock size={14} className="text-gray-300" /> {s.openingTime} – {s.closingTime}
                      </span>
                    </div>
                    <div>
                      <span className="px-3 py-1 bg-[#eefcf4] text-[#2e7d32] rounded-lg text-xs font-black">Open</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-400 font-medium">No favourite shops yet. Add some to see them here!</p>
            </div>
          )}
        </section>

        {/* Daily Essentials (Repositioned After Favourites) */}
        <section className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Daily Essentials</h2>
          </div>

          <div className="relative group/scroll">
            <div
              ref={scrollRefEssentials}
              onScroll={() => handleScroll(scrollRefEssentials, setScrollProgress)}
              className="flex gap-5 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide"
            >
              {essentials.map((p) => (
                <div
                  key={p.id}
                  className="min-w-[200px] bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden flex-shrink-0 snap-start group/card hover:shadow-md transition-all duration-300"
                >
                  <div className="aspect-square bg-emerald-50/20 flex items-center justify-center relative overflow-hidden m-2 rounded-[1.5rem]">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                    ) : (
                      <Package className="w-12 h-12 text-emerald-100" />
                    )}
                  </div>
                  <div className="p-4 pt-1 flex items-end justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1">{p.name}</h4>
                      <span className="text-base font-black text-gray-900">{formatPrice(p.price)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors active:scale-90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2 px-2">
              <button
                onClick={() => scrollHoriz(scrollRefEssentials, "left")}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gray-500 rounded-full transition-all duration-300"
                  style={{ width: "40%", left: `${scrollProgress}%` }}
                />
              </div>
              <button
                onClick={() => scrollHoriz(scrollRefEssentials, "right")}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* Upload List Section (Cleaned & Center Icons) */}
        <section className="w-full">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 md:p-14 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              {/* Centered Icons at Top */}
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <Mic size={28} />
                </div>
                <div className="w-12 h-12 flex items-center justify-center text-gray-300">
                  <Camera size={28} />
                </div>
              </div>

              <div className="space-y-2 max-w-2xl px-4">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  Upload your list 📝
                </h2>
                <p className="text-sm md:text-base text-gray-400 font-medium">
                  Take a photo or speak your items — we'll find them!
                </p>
              </div>

              <button
                onClick={() => navigate('/customer/upload-list')}
                className="px-8 py-3 bg-emerald-600 text-white font-black text-base rounded-full shadow-lg shadow-emerald-50 hover:bg-emerald-700 active:scale-95 transition-all w-full md:w-auto"
              >
                Upload Now
              </button>
            </div>
          </div>
        </section>

        {/* WhatsApp Quick Bar (Simplified Bar Style) */}
        <section className="w-full">
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 px-8 py-5 flex items-center justify-between group">
            <div className="flex items-center gap-5">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <MessageSquare className="text-emerald-600 w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Order via WhatsApp</h3>
                <p className="text-xs text-gray-400 font-medium">Send your list — super fast & easy!</p>
              </div>
            </div>
            <button
              onClick={() => window.open('https://wa.me/911234567890')}
              className="px-8 py-3 bg-emerald-500 text-white font-bold text-base rounded-full hover:bg-emerald-600 transition-colors active:scale-95"
            >
              Chat Now
            </button>
          </div>
        </section>

        {/* Popular Near You (Carousel with Custom Scrollbar) */}
        <section className="animate-fade-in-up">
          <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Popular Near You</h2>
          <div className="relative group/scroll">
            <div
              ref={scrollRefFavs} // Reusing ref or creating new one if needed, using Ref for Popular
              onScroll={() => handleScroll(scrollRefFavs, setScrollProgress)}
              className="flex gap-5 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide"
            >
              {popular.map((p) => (
                <div
                  key={p.id}
                  className="min-w-[200px] bg-white rounded-[2rem] shadow-sm border border-gray-100/50 overflow-hidden flex-shrink-0 snap-start group/card hover:shadow-md transition-all duration-300"
                >
                  <div className="aspect-square bg-emerald-50/20 flex items-center justify-center relative overflow-hidden m-2 rounded-[1.5rem]">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-500" />
                    ) : (
                      <Package className="w-12 h-12 text-emerald-100" />
                    )}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white text-[9px] font-black rounded-lg uppercase">Popular</div>
                  </div>
                  <div className="p-4 pt-1 flex items-end justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 line-clamp-1 mb-1">{p.name}</h4>
                      <span className="text-base font-black text-gray-900">{formatPrice(p.price)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-700 transition-colors active:scale-90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-2 px-2">
              <button
                onClick={() => scrollHoriz(scrollRefFavs, "left")}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gray-500 rounded-full transition-all duration-300"
                  style={{ width: "40%", left: `${scrollProgress}%` }}
                />
              </div>
              <button
                onClick={() => scrollHoriz(scrollRefFavs, "right")}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* ── 4. Offers & Promotions Section ──────────────── */}
        <section className="space-y-12">
          {/* Promotional Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#eefcf4] rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-500 border border-emerald-50">
              <div className="relative z-10 space-y-2">
                <h4 className="text-xl font-black text-gray-900 leading-tight">Dry Fruits & More</h4>
                <div className="inline-block px-3 py-1 bg-emerald-600 text-white rounded-lg text-sm font-bold animate-pulse">
                  ₹389 Only
                </div>
                <p className="text-xs text-gray-500 font-bold">Wonderland Foods Australian Almonds</p>
              </div>
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
                <Package size={120} className="text-emerald-300" />
              </div>
            </div>

            <div className="bg-[#fff4f2] rounded-[2.5rem] p-8 relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-500 border border-orange-50">
              <div className="relative z-10 space-y-2">
                <h4 className="text-xl font-black text-gray-900 leading-tight">Organic & Premium Picks</h4>
                <div className="inline-block px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-bold">
                  UPTO 80% OFF
                </div>
              </div>
              <div className="absolute bottom-0 right-0 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <Leaf size={140} className="text-orange-300" />
              </div>
            </div>

            <div className="md:col-span-1 grid grid-rows-2 gap-6">
              <div className="bg-[#f2f4ff] rounded-[2.5rem] p-6 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all border border-indigo-50">
                <div className="relative z-10">
                  <h4 className="text-lg font-black text-gray-900">Health & Wellness</h4>
                  <span className="text-indigo-600 font-bold text-sm">UPTO 70% OFF</span>
                </div>
                <ShieldCheck size={60} className="absolute bottom-2 right-4 text-indigo-100 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="bg-[#faf2ff] rounded-[2.5rem] p-6 relative overflow-hidden group cursor-pointer hover:shadow-md transition-all border border-violet-50">
                <div className="relative z-10">
                  <h4 className="text-lg font-black text-gray-900">Guilt Free Indulgence</h4>
                  <span className="text-violet-600 font-bold text-sm">Starts at ₹55</span>
                </div>
                <Tag size={60} className="absolute bottom-2 right-4 text-violet-100 group-hover:-rotate-12 transition-transform" />
              </div>
            </div>
          </div>

          {/* Coupons & Offers Carousel */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Coupons & Offers</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {[
                { title: "Unlock extra ₹50 OFF", sub: "Shop for ₹599 more", color: "bg-gray-800", text: "text-white" },
                { title: "Flat 20% Discount", sub: "Use code FIRST20", color: "bg-emerald-600", text: "text-white" },
                { title: "Free Delivery", sub: "On orders above ₹199", color: "bg-indigo-600", text: "text-white" },
              ].map((c, i) => (
                <div
                  key={i}
                  className={`min-w-[320px] ${c.color} ${c.text} rounded-[2rem] p-6 flex items-center justify-between snap-start shadow-xl shadow-gray-200 group cursor-pointer hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Tag size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-black">{c.title}</h4>
                      <p className="text-xs opacity-80 font-medium">{c.sub}</p>
                    </div>
                  </div>
                  <ChevronRight size={24} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USP Trust Badges (Centered) */}
        <section className="flex flex-wrap items-center justify-center gap-12 py-12 bg-white/50 rounded-[3rem] border border-gray-100">
          {[
            { icon: Rocket, label: "Fast Delivery" },
            { icon: Leaf, label: "Fresh Products" },
            { icon: ShieldCheck, label: "Trusted Stores" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center">
                <item.icon size={32} />
              </div>
              <span className="text-xs font-black text-gray-600 uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default CustomerHome;
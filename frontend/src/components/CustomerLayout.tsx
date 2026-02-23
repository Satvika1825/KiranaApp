import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import {
  Bell,
  Home,
  ShoppingBag,
  User,
  ClipboardList,
  Heart,
  ShoppingBasket,
  MapPin,
  ChevronDown
} from "lucide-react";
import { getCustomerProfile, getOrders, getCart } from "@/lib/store";

const CustomerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const customer = getCustomerProfile();
  const customerName = customer?.name || "Sathwika";

  const cart = getCart() || [];
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const orders = getOrders() || [];
  const activeOrdersCount = orders.filter(o => o.status !== "Delivered").length;

  const navItems = [
    { icon: Home, label: "Home", path: "/customer/home", color: "text-emerald-600", bg: "bg-emerald-50" },
    { icon: ShoppingBasket, label: "Stores", path: "/customer/stores", color: "text-blue-600", bg: "bg-blue-50" },
    { icon: ShoppingBag, label: "Cart", path: "/customer/cart", count: cartCount, color: "text-orange-600", bg: "bg-orange-50" },
    { icon: ClipboardList, label: "Orders", path: "/customer/orders", color: "text-purple-600", bg: "bg-purple-50" },
    { icon: Heart, label: "Favourites", path: "/customer/saved-lists", color: "text-rose-600", bg: "bg-rose-50" },
    { icon: User, label: "Profile", path: "/customer/profile", color: "text-gray-600", bg: "bg-gray-100" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 lg:pb-0 font-sans">
      {/* ═══════════════════ FINAL POLISHED HEADER ═══════════════════ */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100 px-4 py-3 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Left: Personalized Greeting & ENLARGED Location */}
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
              Welcome, {customerName} 👋
            </h1>
            <button className="flex items-center gap-2 mt-1 text-[#16a34a] font-bold text-sm md:text-base hover:opacity-80 transition-opacity">
              <MapPin className="w-4 h-4 md:w-5 h-5" />
              <span>Hyderabad, Banjara Hills</span>
              <ChevronDown className="w-4 h-4 md:w-5 h-5" />
            </button>
          </div>

          {/* Right: Tightly Grouped Navigation & Notifications */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Desktop Nav Items */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${isActive
                      ? `${item.bg} ${item.color} shadow-sm`
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? item.color : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                    {/* Cart Badge hidden as per user request */}
                    {/* {item.count !== undefined && item.count > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded-full">
                        {item.count}
                      </span>
                    )} */}
                  </Link>
                );
              })}
            </div>

            {/* Notification Bell (TIGHTLY Grouped) */}
            <div className="flex items-center border-l border-gray-100 ml-1 pl-1">
              <button className="relative p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all group">
                <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {activeOrdersCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full shadow-sm" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════ MAIN CONTENT ═══════════════════ */}
      <main className="max-w-full overflow-x-hidden">
        <Outlet />
      </main>

      {/* ═══════════════════ MOBILE BOTTOM NAVIGATION ═══════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-around py-2 px-1 lg:hidden z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all relative ${isActive ? item.color : "text-gray-400"
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              <span className={`text-[10px] font-bold ${isActive ? "" : "text-gray-400 opacity-60"}`}>
                {item.label}
              </span>
              {isActive && (
                <div className={`absolute top-0 w-8 h-0.5 ${item.color.replace('text-', 'bg-')} rounded-full`} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CustomerLayout;
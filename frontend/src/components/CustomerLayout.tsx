import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, ShoppingCart, Bell, Store, ArrowLeft, Home, Package, User, Loader2 } from 'lucide-react';
import { getCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';

const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const userId = customer?.id || '';

  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLayoutData = async () => {
    if (!userId) return;
    try {
      const [cartData, notifData] = await Promise.all([
        api.cart.get(userId).catch(() => ({ items: [] })),
        // api.customer.getNotifications(userId).catch(() => ({ notifications: [] })) // Uncomment if backend ready
        Promise.resolve({ notifications: [] })
      ]);

      const count = (cartData.items || []).reduce((s: number, c: any) => s + c.quantity, 0);
      setCartCount(count);
      setNotifications(notifData.notifications || []);
      setUnreadCount((notifData.notifications || []).filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch layout data', err);
    }
  };

  useEffect(() => {
    fetchLayoutData();
    // Poll for layout updates (cart/notifs) every 15s
    const interval = setInterval(fetchLayoutData, 15000);
    return () => clearInterval(interval);
  }, [userId, location.pathname]);

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    // if (!showNotifs) api.customer.markNotifsRead(userId).then(() => setUnreadCount(0)); 
  };

  const showBack = location.pathname !== '/customer/home' && location.pathname !== '/customer/stores';

  const navItems = [
    { path: '/customer/home', label: 'Home', icon: Home },
    { path: '/customer/stores', label: 'Stores', icon: Store },
    { path: '/customer/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
    { path: '/customer/orders', label: 'Orders', icon: Package },
    { path: '/customer/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">

      {/* Top Navbar */}
      <header className="sticky top-0 z-20 bg-card border-b px-4 lg:px-10 py-3.5 flex items-center justify-between w-full shadow-sm">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-muted rounded-full text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Link to="/customer/home" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight hidden sm:inline">KiranaConnect</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-3">
          {navItems.map((item, i) => {
            const isActive =
              location.pathname === item.path ||
              (item.label === 'Orders' && location.pathname.startsWith('/customer/order'));

            return (
              <Link
                key={i}
                to={item.path}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="hidden lg:inline">{item.label}</span>

                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-card shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className={`relative p-2.5 rounded-xl transition-all ${showNotifs ? 'bg-primary/5 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 bg-destructive text-white text-[8px] font-bold rounded-full w-2 h-2 border border-card" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <span className="font-heading font-bold text-sm">Notifications</span>
                  {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-4 border-b last:border-0 hover:bg-muted/30 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <p className="text-sm font-medium text-foreground">{n.message}</p>
                        <span className="block text-[10px] text-muted-foreground mt-1.5 font-medium uppercase tracking-wider">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 lg:px-10 py-6 md:py-8 lg:py-10 max-w-7xl mx-auto">
        <Outlet />
      </main>

    </div>
  );
};

export default CustomerLayout;

import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, User, Bell, Menu, X, Store, LogOut, Loader2 } from 'lucide-react';
import { getOwnerProfile } from '@/lib/store';
import { api } from '@/lib/api';

const navItems = [
  { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/owner/products', label: 'Products', icon: Package },
  { path: '/owner/orders', label: 'Orders', icon: ClipboardList },
  { path: '/owner/profile', label: 'Profile', icon: User },
];

const OwnerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const owner = getOwnerProfile();
  const ownerId = owner?.id || '';

  const [shop, setShop] = useState<any>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLayoutData = async () => {
    if (!ownerId) {
      setLoading(false);
      return;
    }
    try {
      const [shopRes, ordersRes] = await Promise.all([
        api.stores.getByOwner(ownerId).catch(() => ({ store: null })),
        api.orders.getByOwner(ownerId).catch(() => ({ orders: [] }))
      ]);

      if (shopRes.store) setShop(shopRes.store);

      const newOrders = (ordersRes.orders || []).filter((o: any) => o.status === 'New').length;
      setNewOrderCount(newOrders);

      // Fetch notifications if backend ready
      // const notifRes = await api.owner.getNotifications(ownerId);
      // setNotifications(notifRes.notifications || []);
      // setUnreadCount((notifRes.notifications || []).filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch owner layout data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayoutData();
    const interval = setInterval(fetchLayoutData, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [ownerId, location.pathname]);

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    // if (!showNotifs) api.owner.markNotifsRead(ownerId).then(() => setUnreadCount(0));
  };

  if (loading && !shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground font-medium">Loading store dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r shadow-sm transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b">
          <Link to="/owner/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <span className="font-heading font-bold text-foreground text-lg tracking-tight">KiranaConnect</span>
          </Link>
        </div>
        <nav className="p-4 space-y-1.5">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${location.pathname === item.path
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.label === 'Orders' && newOrderCount > 0 && (
                <span className="ml-auto bg-destructive text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {newOrderCount} NEW
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <button
            onClick={() => {
              localStorage.clear();
              navigate('/');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-destructive hover:bg-destructive/5 w-full transition-all border border-transparent hover:border-destructive/10"
          >
            <LogOut className="w-5 h-5" /> Logout & Exit
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-muted rounded-lg text-foreground transition-colors">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-heading font-bold text-foreground text-lg tracking-tight">
                {shop?.shopName || 'Dashboard'}
              </h1>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{shop?.shopType || 'Owner'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Actions / Notifs */}
            <div className="relative">
              <button onClick={handleNotifClick} className={`relative p-2.5 rounded-xl transition-all ${showNotifs ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive border-2 border-card rounded-full" />}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-3 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="p-4 border-b bg-muted/30 font-heading font-bold text-sm text-foreground">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-medium">No alerts today</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <p className="text-sm font-medium text-foreground">{n.message}</p>
                          <span className="block text-xs text-muted-foreground mt-1.5 font-medium">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/owner/profile" className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors">
              <User className="w-5 h-5 text-primary" />
            </Link>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t flex lg:hidden z-20 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center py-3 text-[10px] font-bold transition-all relative ${location.pathname === item.path ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${location.pathname === item.path ? 'stroke-[2.5px]' : ''}`} />
            {item.label}
            {location.pathname === item.path && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full shadow-sm shadow-primary/30" />
            )}
            {item.label === 'Orders' && newOrderCount > 0 && (
              <span className="absolute top-2 right-1/4 w-4 h-4 bg-destructive text-white text-[9px] flex items-center justify-center rounded-full border border-card shadow-sm">
                {newOrderCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default OwnerLayout;

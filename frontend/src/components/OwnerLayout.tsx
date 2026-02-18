/**
 * Owner Layout — Sidebar navigation for owner pages.
 * Contains top header with shop name, notifications, orders, profile.
 * Sidebar for desktop, bottom nav for mobile.
 */
import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, User, Bell, Menu, X, Store, LogOut } from 'lucide-react';
import { getShop, getOwnerNotifications, markOwnerNotifsRead, getOrders } from '@/lib/store';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/owner/products', label: 'Products', icon: Package },
  { path: '/owner/orders', label: 'Orders', icon: ClipboardList },
  { path: '/owner/profile', label: 'Profile', icon: User },
];

const OwnerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const shop = getShop();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const notifications = getOwnerNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const newOrderCount = getOrders().filter(o => o.status === 'New').length;

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) markOwnerNotifsRead();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-card border-r transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="w-4 h-4 text-primary" />
            </div>
            <span className="font-heading font-bold text-foreground text-sm">KiranaConnect</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground w-full transition-colors">
            <LogOut className="w-4 h-4" /> Exit
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-60">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-card border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-foreground">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-heading font-bold text-foreground text-sm md:text-base truncate">
              {shop?.shopName || 'My Shop'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Orders shortcut */}
            <Link to="/owner/orders" className="relative p-2 rounded-lg hover:bg-accent transition-colors text-foreground">
              <ClipboardList className="w-5 h-5" />
              {newOrderCount > 0 && <span className="kc-badge">{newOrderCount}</span>}
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button onClick={handleNotifClick} className="relative p-2 rounded-lg hover:bg-accent transition-colors text-foreground">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="kc-badge">{unreadCount}</span>}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto animate-fade-in">
                  <div className="p-3 border-b font-heading font-bold text-sm text-foreground">Notifications</div>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} className="p-3 border-b last:border-0 text-sm text-foreground">
                        {n.message}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <Link to="/owner/profile" className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground">
              <User className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t flex lg:hidden z-20">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
              location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <item.icon className="w-5 h-5 mb-0.5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default OwnerLayout;

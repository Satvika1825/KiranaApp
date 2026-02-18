/**
 * Customer Layout — Top navbar (full width)
 */
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingBag, ShoppingCart, Bell, Store, ArrowLeft, Home, Package, User } from 'lucide-react';
import { getCart, getCustomerNotifications, markCustomerNotifsRead } from '@/lib/store';

const CustomerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cart = getCart();
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifications = getCustomerNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) markCustomerNotifsRead();
  };

  const showBack = location.pathname !== '/customer/home';

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
      <header className="sticky top-0 z-20 bg-card border-b px-6 py-4 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => navigate(-1)} className="p-1 text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">KiranaConnect</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-3">
          {navItems.map((item, i) => {
            const isActive =
              location.pathname === item.path ||
              (item.label === 'Orders' &&
                location.pathname.startsWith('/customer/order'));

            return (
              <Link
                key={i}
                to={item.path}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>

                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotifClick}
              className="relative p-2 rounded-lg hover:bg-accent transition"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto animate-fade-in">
                <div className="p-3 border-b font-bold text-sm">
                  Notifications
                </div>

                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No notifications
                  </p>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div
                      key={n.id}
                      className="p-3 border-b last:border-0 text-sm"
                    >
                      {n.message}
                      <span className="block text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content (FULL WIDTH) */}
      <main className="w-full px-6 lg:px-10 py-8">
        <Outlet />
      </main>

    </div>
  );
};

export default CustomerLayout;

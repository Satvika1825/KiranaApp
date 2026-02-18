/**
 * Owner Dashboard
 * Shows summary cards: Total Orders, Active Products, Today's Revenue.
 */
import { ShoppingCart, Package, IndianRupee, TrendingUp } from 'lucide-react';
import { getOrders, getProducts } from '@/lib/store';

const OwnerDashboard = () => {
  const orders = getOrders();
  const products = getProducts();

  // Simple stats
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  const activeProducts = products.filter(p => p.available).length;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Products', value: activeProducts, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: "Today's Revenue", value: `₹${todayRevenue}`, icon: IndianRupee, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Dashboard</h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="kc-card-flat p-4">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <h3 className="text-lg font-heading font-bold text-foreground mt-6 mb-3">Recent Orders</h3>
      {orders.length === 0 ? (
        <div className="kc-card-flat p-8 text-center text-muted-foreground text-sm">
          No orders yet. They'll appear here when customers place orders.
        </div>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 5).map(order => (
            <div key={order.id} className="kc-card-flat p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground text-sm">#{order.id}</p>
                <p className="text-xs text-muted-foreground">{order.customerName} · {order.items.length} items</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground text-sm">₹{order.totalPrice}</p>
                <span className={`kc-status-${order.status === 'New' ? 'new' : order.status === 'Accepted' ? 'accepted' : order.status === 'Preparing' ? 'preparing' : order.status === 'Out for Delivery' ? 'delivery' : 'delivered'}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;

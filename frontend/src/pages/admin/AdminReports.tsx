/**
 * Admin Reports — Stats cards + top stores table, indigo theme.
 */
import { IndianRupee, Package, TrendingUp, Store, Users } from 'lucide-react';
import { getOrders, getProducts, getShop, getCustomerProfile } from '@/lib/store';

const AdminReports = () => {
  const orders = getOrders();
  const products = getProducts();
  const shop = getShop();
  const customer = getCustomerProfile();

  const totalRevenue = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const activeStores = shop ? 1 : 0;
  const activeCustomers = customer ? 1 : 0;

  const stats = [
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-violet-100 text-violet-600' },
    { label: 'Total Orders', value: totalOrders, icon: Package, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Avg Order Value', value: `₹${avgOrderValue}`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Active Stores', value: activeStores, icon: Store, color: 'bg-amber-100 text-amber-600' },
    { label: 'Active Customers', value: activeCustomers, icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  ];

  const topStores = shop
    ? [{ name: shop.shopName, revenue: totalRevenue, orders: totalOrders, products: products.length }]
    : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="admin-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top stores */}
      <div className="admin-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-heading font-bold text-gray-900">Top Stores by Revenue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Store</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Products</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topStores.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No data yet</td></tr>
              ) : (
                topStores.map((s, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.products}</td>
                    <td className="px-6 py-4 text-gray-600">{s.orders}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{s.revenue.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;

import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Store, ShoppingCart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, ordersData] = await Promise.all([
          api.admin.getStats(),
          api.orders.getAll()
        ]);
        setStats(statsData);
        setRecentOrders((ordersData.orders || []).slice(0, 5));
      } catch (err) {
        console.error('Dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statusColor: Record<string, string> = {
    Delivered: 'bg-green-100 text-green-700',
    New: 'bg-slate-100 text-slate-700',
    Preparing: 'bg-amber-100 text-amber-700',
    'Out for Delivery': 'bg-purple-100 text-purple-700',
    Accepted: 'bg-blue-100 text-blue-700',
    'Ready for Pickup': 'bg-orange-100 text-orange-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading dashboard…
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <Store className="text-indigo-600" />
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Stores</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalStores ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <Users className="text-indigo-600" />
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Customers</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalCustomers ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <ShoppingCart className="text-indigo-600" />
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Orders</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalOrders ?? 0}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <TrendingUp className="text-indigo-600" />
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Platform Revenue</h2>
          <p className="text-3xl font-bold mt-2">₹{(stats?.totalRevenue ?? 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Revenue by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(v: any) => `₹${v}`} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Orders by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.ordersData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr className="text-gray-500 text-sm">
                <th className="py-3">Order ID</th>
                <th>Customer</th>
                <th>Shop</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No orders yet</td></tr>
              ) : (
                recentOrders.map((o: any) => {
                  const oid = o._id || o.id;
                  return (
                    <tr key={oid} className="border-b hover:bg-gray-50">
                      <td className="py-3 font-mono text-xs text-gray-600">#{oid.substring(0, 8)}</td>
                      <td>{o.customerName}</td>
                      <td className="text-gray-500 text-xs">{o.shopName || '—'}</td>
                      <td>₹{o.totalPrice}</td>
                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

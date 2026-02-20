/**
 * Admin Reports — Real-time stats and top stores from DB.
 */
import { useState, useEffect } from 'react';
import { IndianRupee, Package, TrendingUp, Store, Users, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const AdminReports = () => {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getReports()
      .then(data => setReports(data))
      .catch(err => console.error('Failed to fetch reports', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading reports…
      </div>
    );
  }

  const stats = [
    { label: 'Total Revenue', value: `₹${(reports?.totalRevenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'bg-violet-100 text-violet-600' },
    { label: 'Total Orders', value: reports?.totalOrders ?? 0, icon: Package, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Avg Order Value', value: `₹${reports?.avgOrderValue ?? 0}`, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Active Stores', value: reports?.activeStores ?? 0, icon: Store, color: 'bg-amber-100 text-amber-600' },
    { label: 'Active Customers', value: reports?.activeCustomers ?? 0, icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  ];

  const topStores: any[] = reports?.topStores || [];

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

      {/* Top Stores */}
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
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Orders</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topStores.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 text-gray-400">No data yet</td></tr>
              ) : (
                topStores.map((s: any, i: number) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
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

/**
 * Admin Orders — Table with status filter + manual status change dropdown.
 */
import { useState } from 'react';
import { Package } from 'lucide-react';
import { getOrders, updateOrderStatus, getShop, type Order } from '@/lib/store';

const statuses: Order['status'][] = ['New', 'Accepted', 'Preparing', 'Out for Delivery', 'Delivered'];

const statusStyle: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Accepted': 'bg-yellow-100 text-yellow-800',
  'Preparing': 'bg-orange-100 text-orange-800',
  'Out for Delivery': 'bg-purple-100 text-purple-800',
  'Delivered': 'bg-green-100 text-green-800',
};

const AdminOrders = () => {
  const [filter, setFilter] = useState('All');
  const [, setTick] = useState(0);

  const orders = getOrders();
  const shop = getShop();
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    updateOrderStatus(orderId, newStatus);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      {/* Filter + Stats Bar */}
<div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
  
  <div className="flex items-center gap-3 text-sm text-gray-600">
    <Package className="w-4 h-4 text-indigo-600" />
    <span className="font-medium">
      {filtered.length} Orders
    </span>
  </div>

  <div className="flex items-center gap-2">
    <label className="text-xs text-gray-500 font-medium">
      Filter:
    </label>

    <select
      value={filter}
      onChange={e => setFilter(e.target.value)}
      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
    >
      <option value="All">All</option>
      {statuses.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  </div>

</div>


      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Order ID</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Shop</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Change</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : (
                filtered.map(o => (
                  <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-700">#{o.id}</td>
                    <td className="px-6 py-4 text-gray-700">{o.customerName}</td>
                    <td className="px-6 py-4 text-gray-500">{shop?.shopName || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">₹{o.totalPrice}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[o.status] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {o.status !== 'Delivered' ? (
                        <select
                          value={o.status}
                          onChange={e => handleStatusChange(o.id, e.target.value as Order['status'])}
                          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-400">Completed</span>
                      )}
                    </td>
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

export default AdminOrders;

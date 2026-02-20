/**
 * Admin Customers — Fetches all customers from DB with block/unblock.
 */
import { useState, useEffect } from 'react';
import { Users, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ customer: any; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getCustomers();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const toggleBlock = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await api.admin.blockCustomer(confirm.customer._id || confirm.customer.id);
      setConfirm(null);
      await fetchCustomers();
    } catch (err) {
      console.error('Block toggle failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading customers…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{customers.length} customer(s)</span>
        </div>
        <button onClick={fetchCustomers} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Mobile</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total Orders</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No customers yet</td></tr>
              ) : (
                customers.map((c: any) => {
                  const cid = c._id || c.id;
                  const isBlocked = !c.isActive;
                  return (
                    <tr key={cid} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{c.mobile}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{c.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{c.totalOrders}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isBlocked ? 'admin-badge-suspended' : 'admin-badge-active'}>
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirm({ customer: c, action: isBlocked ? 'Unblock' : 'Block' })}
                          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${isBlocked
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{confirm.action} Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="lowercase font-medium">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.customer.name || confirm.customer.mobile}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={toggleBlock}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 ${confirm.action === 'Block' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  } disabled:opacity-60`}
              >
                {actionLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Yes, {confirm.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;

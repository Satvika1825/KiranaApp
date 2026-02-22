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

      {customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No customers yet</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {customers.map((c: any) => {
            const cid = c._id || c.id;
            const isBlocked = !c.isActive;
            const initials = (c.name || c.mobile || '?').charAt(0).toUpperCase();
            return (
              <div
                key={cid}
                className="admin-card flex flex-col gap-3 p-5 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] hover:shadow-md transition-shadow"
              >
                {/* Avatar + Name + Status */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{c.name || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{c.mobile}</p>
                  </div>
                  <span className={isBlocked ? 'admin-badge-suspended' : 'admin-badge-active'}>
                    {isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                {/* Details */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p><span className="font-medium text-gray-700">Email:</span> {c.email || '—'}</p>
                  <p><span className="font-medium text-gray-700">Orders:</span> {c.totalOrders ?? 0}</p>
                  <p><span className="font-medium text-gray-700">Joined:</span> {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}</p>
                </div>

                {/* Action */}
                <div className="mt-auto pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setConfirm({ customer: c, action: isBlocked ? 'Unblock' : 'Block' })}
                    className={`w-full text-xs font-semibold px-4 py-2 rounded-lg transition-all ${isBlocked
                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

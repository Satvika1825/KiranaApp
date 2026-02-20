/**
 * Admin Owners — Fetches all kirana owners from DB with suspend/activate.
 */
import { useState, useEffect } from 'react';
import { UserCog, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const AdminOwners = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ owner: any; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getOwners();
      setOwners(data.owners || []);
    } catch (err) {
      console.error('Failed to fetch owners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOwners(); }, []);

  const toggleSuspend = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await api.admin.suspendOwner(confirm.owner._id || confirm.owner.id);
      setConfirm(null);
      await fetchOwners();
    } catch (err) {
      console.error('Suspend toggle failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading owners…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <UserCog className="w-4 h-4" />
          <span>{owners.length} owner(s)</span>
        </div>
        <button onClick={fetchOwners} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Owner Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Shop Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Mobile</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No owners yet</td></tr>
              ) : (
                owners.map((o: any) => {
                  const oid = o._id || o.id;
                  const isSuspended = !o.isActive;
                  return (
                    <tr key={oid} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{o.name || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{o.shopName}</td>
                      <td className="px-6 py-4 text-gray-600">{o.mobile}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{o.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'Recently'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isSuspended ? 'admin-badge-suspended' : 'admin-badge-active'}>
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirm({ owner: o, action: isSuspended ? 'Activate' : 'Suspend' })}
                          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${isSuspended
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
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
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{confirm.action} Owner?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="lowercase font-medium">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.owner.name || confirm.owner.mobile}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={toggleSuspend}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 ${confirm.action === 'Suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
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

export default AdminOwners;

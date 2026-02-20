/**
 * Admin Stores — Fetches all stores from DB with suspend/activate toggle.
 */
import { useState, useEffect } from 'react';
import { Search, Store as StoreIcon, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const AdminStores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{ store: any; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getStores();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const filtered = stores.filter(s =>
    (s.shopName || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.address?.area || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.ownerName || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async () => {
    if (!confirm) return;
    setActionLoading(true);
    try {
      await api.admin.suspendStore(confirm.store._id || confirm.store.id);
      setConfirm(null);
      await fetchStores();
    } catch (err) {
      console.error('Store suspend toggle failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading stores…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by store name, area, or owner…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <StoreIcon className="w-4 h-4" />
          <span>{filtered.length} store(s)</span>
        </div>
        <button onClick={fetchStores} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Shop Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Owner</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Area / Pin</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Hours</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No stores found</td></tr>
              ) : (
                filtered.map((s: any) => {
                  const sid = s._id || s.id;
                  const isActive = s.status !== 'suspended';
                  return (
                    <tr key={sid} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{s.shopName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        <p>{s.ownerName}</p>
                        <p className="text-xs text-gray-400">{s.ownerMobile}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {s.address?.area || '—'}
                        {s.address?.pinCode ? `, ${s.address.pinCode}` : ''}
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">
                        {s.openingTime && s.closingTime
                          ? `${formatTime(s.openingTime)} – ${formatTime(s.closingTime)}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={isActive ? 'admin-badge-active' : 'admin-badge-suspended'}>
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setConfirm({ store: s, action: isActive ? 'Suspend' : 'Activate' })}
                          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${isActive
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                        >
                          {isActive ? 'Suspend' : 'Activate'}
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
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{confirm.action} Store?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="font-medium lowercase">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.store.shopName}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white flex items-center gap-2 transition-colors ${confirm.action === 'Suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
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

export default AdminStores;

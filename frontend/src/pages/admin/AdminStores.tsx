/**
 * Admin Stores — Searchable table with suspend/activate toggle + confirmation modal.
 */
import { useState } from 'react';
import { Search, Store as StoreIcon } from 'lucide-react';
import { getShop, getOwnerProfile, saveShop, type Shop } from '@/lib/store';

interface ShopWithStatus extends Shop {
  status?: 'active' | 'suspended';
}

const AdminStores = () => {
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);
  const [confirm, setConfirm] = useState<{ shop: ShopWithStatus; action: string } | null>(null);

  const shop = getShop() as ShopWithStatus | null;
  const owner = getOwnerProfile();

  const stores: { shop: ShopWithStatus; ownerName: string }[] = [];
  if (shop) {
    if (!shop.status) shop.status = 'active';
    stores.push({ shop, ownerName: owner?.fullName || 'Unknown' });
  }

  const filtered = stores.filter(s =>
    s.shop.shopName.toLowerCase().includes(search.toLowerCase()) ||
    s.shop.address.area.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = () => {
    if (!confirm) return;
    confirm.shop.status = confirm.shop.status === 'active' ? 'suspended' : 'active';
    saveShop(confirm.shop);
    setConfirm(null);
    setTick(t => t + 1);
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by store name or area…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <StoreIcon className="w-4 h-4" />
          <span>{filtered.length} store(s)</span>
        </div>
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
                filtered.map((item, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.shop.shopName}</td>
                    <td className="px-6 py-4 text-gray-600">{item.ownerName}</td>
                    <td className="px-6 py-4 text-gray-600">{item.shop.address.area}, {item.shop.address.pinCode}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {formatTime(item.shop.openingTime)} – {formatTime(item.shop.closingTime)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={item.shop.status === 'active' ? 'admin-badge-active' : 'admin-badge-suspended'}>
                        {item.shop.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setConfirm({
                          shop: item.shop,
                          action: item.shop.status === 'active' ? 'Suspend' : 'Activate'
                        })}
                        className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                          item.shop.status === 'active'
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {item.shop.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">
              {confirm.action} Store?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="font-medium lowercase">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.shop.shopName}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleStatus}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                  confirm.action === 'Suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
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

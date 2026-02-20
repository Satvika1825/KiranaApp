/**
 * Admin Owners — Table of store owners with suspend/activate + confirmation modal.
 */
import { useState } from 'react';
import { UserCog } from 'lucide-react';
import { getOwnerProfile, getShop } from '@/lib/store';

const AdminOwners = () => {
  const [, setTick] = useState(0);
  const [confirm, setConfirm] = useState<{ name: string; action: string } | null>(null);

  const owner = getOwnerProfile();
  const shop = getShop();
  const isSuspended = localStorage.getItem('kc_owner_suspended') === 'true';

  const toggleSuspend = () => {
    localStorage.setItem('kc_owner_suspended', isSuspended ? 'false' : 'true');
    setConfirm(null);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <UserCog className="w-4 h-4" />
        <span>{owner ? 1 : 0} owner(s)</span>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Owner Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Shop Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Mobile</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!owner ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No owners yet</td></tr>
              ) : (
                <tr className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{owner.fullName}</td>
                  <td className="px-6 py-4 text-gray-600">{shop?.shopName || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{owner.mobile}</td>
                  <td className="px-6 py-4">
                    <span className={isSuspended ? 'admin-badge-suspended' : 'admin-badge-active'}>
                      {isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setConfirm({ name: owner.fullName, action: isSuspended ? 'Activate' : 'Suspend' })}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                        isSuspended
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {isSuspended ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{confirm.action} Owner?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="lowercase font-medium">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={toggleSuspend}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
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

export default AdminOwners;

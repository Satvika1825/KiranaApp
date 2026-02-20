/**
 * Admin Customers — Table of customers with block/unblock + confirmation modal.
 */
import { useState } from 'react';
import { Users } from 'lucide-react';
import { getCustomerProfile, getOrders } from '@/lib/store';

const AdminCustomers = () => {
  const [, setTick] = useState(0);
  const [confirm, setConfirm] = useState<{ name: string; action: string } | null>(null);

  const customer = getCustomerProfile();
  const orders = getOrders();

  const isBlocked = localStorage.getItem('kc_customer_blocked') === 'true';
  const customerOrders = customer ? orders.filter(o => o.customerId === customer.id).length : 0;

  const toggleBlock = () => {
    localStorage.setItem('kc_customer_blocked', isBlocked ? 'false' : 'true');
    setConfirm(null);
    setTick(t => t + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>{customer ? 1 : 0} customer(s)</span>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Mobile</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total Orders</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Joined</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!customer ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No customers yet</td></tr>
              ) : (
                <tr className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                  <td className="px-6 py-4 text-gray-600">{customer.mobile}</td>
                  <td className="px-6 py-4 text-gray-600">{customerOrders}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">Recently</td>
                  <td className="px-6 py-4">
                    <span className={isBlocked ? 'admin-badge-suspended' : 'admin-badge-active'}>
                      {isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setConfirm({ name: customer.name, action: isBlocked ? 'Unblock' : 'Block' })}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                        isBlocked
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {isBlocked ? 'Unblock' : 'Block'}
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
            <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">{confirm.action} Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to <span className="lowercase font-medium">{confirm.action}</span>{' '}
              <span className="font-semibold text-gray-900">{confirm.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
              <button
                onClick={toggleBlock}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                  confirm.action === 'Block' ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
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

export default AdminCustomers;

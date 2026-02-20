/**
 * Admin Orders — Full delivery monitoring with agent info + manual override.
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Package, Truck, RefreshCw, AlertTriangle } from 'lucide-react';

const ALL_STATUSES = ['New', 'Accepted', 'Preparing', 'Ready for Pickup', 'Out for Delivery', 'Delivered'];

const statusStyle: Record<string, string> = {
  'New': 'bg-slate-100 text-slate-700',
  'Accepted': 'bg-blue-100 text-blue-700',
  'Preparing': 'bg-amber-100 text-amber-700',
  'Ready for Pickup': 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  'Delivered': 'bg-green-100 text-green-700',
};

const deliveryStatusStyle: Record<string, string> = {
  'Pending': 'text-slate-400',
  'Assigned': 'text-blue-600 font-semibold',
  'Picked Up': 'text-amber-600 font-semibold',
  'Out for Delivery': 'text-purple-600 font-semibold',
  'Delivered': 'text-green-600 font-semibold',
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overrideOrderId, setOverrideOrderId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [ordersData, agentsData] = await Promise.all([
        api.orders.getAll(),
        api.delivery.getAgents()
      ]);
      setOrders(ordersData.orders || []);
      setAgents(agentsData.agents || []);
    } catch (err) {
      console.error('Admin fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOverride = async () => {
    if (!overrideOrderId || !selectedAgentId) return;
    try {
      await api.delivery.assignAgent(overrideOrderId, selectedAgentId);
      setOverrideOrderId(null);
      setSelectedAgentId('');
      fetchData(true);
    } catch (err: any) {
      alert(err.message || 'Override failed');
    }
  };

  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div className="p-8 text-center text-gray-400 animate-pulse">Loading orders...</div>
  );

  return (
    <div className="space-y-4">
      {/* Override Modal */}
      {overrideOrderId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h3 className="font-bold text-lg text-gray-900">Override Assignment</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select an agent to manually assign this order to.</p>
            <select
              value={selectedAgentId}
              onChange={e => setSelectedAgentId(e.target.value)}
              className="w-full border rounded-xl p-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Agent --</option>
              {agents.map((a: any) => (
                <option key={a._id || a.id} value={a._id || a.id}>
                  {a.name} ({a.agentStatus} · {a.activeDeliveries} active)
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => { setOverrideOrderId(null); setSelectedAgentId(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={!selectedAgentId}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Package className="w-4 h-4 text-indigo-600" />
          <span className="font-medium">{filtered.length} Orders</span>
          <span className="text-xs text-gray-400">·</span>
          <Truck className="w-4 h-4 text-purple-500" />
          <span className="text-xs text-gray-500">{agents.filter((a: any) => a.agentStatus !== 'offline').length} agents online</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchData(true)} className="p-2 text-gray-400 hover:text-gray-600">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Order</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Shop Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Agent</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Delivery</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Override</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No orders found</td></tr>
              ) : (
                filtered.map((o: any) => {
                  const oid = o._id || o.id;
                  return (
                    <tr key={oid} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-gray-600">#{(o.id || oid).substring(0, 8)}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-800 font-medium">{o.customerName}</p>
                        <p className="text-xs text-gray-400">{o.shopName || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-gray-700">{o.deliveryAgentName || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs ${deliveryStatusStyle[o.deliveryStatus] || 'text-gray-400'}`}>
                          {o.deliveryStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">₹{o.totalPrice}</p>
                        <p className="text-xs text-gray-400 uppercase">{o.paymentMethod}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {o.deliveryStatus !== 'Delivered' && (
                          <button
                            onClick={() => setOverrideOrderId(oid)}
                            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold transition-colors"
                          >
                            Override
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="admin-card p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-500" /> Delivery Agents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {agents.map((a: any) => (
            <div key={a._id || a.id} className="bg-gray-50 rounded-xl p-3 border">
              <p className="font-semibold text-gray-800 text-sm truncate">{a.name}</p>
              <p className="text-xs text-gray-500">{a.mobile}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${a.agentStatus === 'available' ? 'bg-green-100 text-green-700' :
                  a.agentStatus === 'busy' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                  {a.agentStatus}
                </span>
                <span className="text-xs text-gray-500">{a.activeDeliveries} active</span>
              </div>
            </div>
          ))}
          {agents.length === 0 && <p className="text-xs text-gray-400 col-span-4">No agents registered.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;

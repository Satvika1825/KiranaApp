import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
    MapPin, Phone, Truck, CheckCircle2, Package, Navigation,
    Power, PowerOff, IndianRupee, RefreshCw, Clock, AlertCircle
} from 'lucide-react';

interface Order {
    _id: string;
    id: string;
    customerName: string;
    shopName: string;
    shopAddress: string;
    shopLocation?: { lat: number; lng: number };
    customerAddress?: { text: string; lat: number; lng: number };
    totalPrice: number;
    paymentMethod: string;
    deliveryStatus: string;
    deliveryBatchId?: string;
    codConfirmed?: boolean;
    createdAt: string;
    items: any[];
}

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [agent, setAgent] = useState<any>(null);
    const [agentStatus, setAgentStatus] = useState<'available' | 'busy' | 'offline'>('available');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [codOrderId, setCodOrderId] = useState<string | null>(null); // COD confirmation modal
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('kc_delivery_agent');
        if (stored) {
            const parsed = JSON.parse(stored);
            setAgent(parsed);
            setAgentStatus(parsed.agentStatus || 'available');
            fetchOrders(parsed.id);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchOrders = async (agentId: string, silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await api.delivery.getOrders(agentId);
            setOrders(data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleAvailability = async () => {
        if (!agent) return;
        const newStatus = agentStatus === 'offline' ? 'available' : 'offline';
        try {
            await api.delivery.updateAgentStatus(agent.id, newStatus);
            setAgentStatus(newStatus as any);
            const updated = { ...agent, agentStatus: newStatus };
            setAgent(updated);
            localStorage.setItem('kc_delivery_agent', JSON.stringify(updated));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const updateStatus = async (orderId: string, currentStatus: string, codConfirmed = false) => {
        if (!agent) return;

        const nextStatus: Record<string, string> = {
            'Assigned': 'Picked Up',
            'Picked Up': 'Out for Delivery',
            'Out for Delivery': 'Delivered',
        };
        const newStatus = nextStatus[currentStatus];
        if (!newStatus) return;

        // COD check before completing
        const order = orders.find(o => (o._id || o.id) === orderId);
        if (newStatus === 'Delivered' && order?.paymentMethod === 'cod' && !codConfirmed) {
            setCodOrderId(orderId);
            return;
        }

        setUpdatingId(orderId);
        const prev = [...orders];
        setOrders(orders.map(o => (o._id || o.id) === orderId ? { ...o, deliveryStatus: newStatus } : o));

        try {
            await api.delivery.updateStatus(orderId, newStatus, agent.id, codConfirmed);
            fetchOrders(agent.id, true);
        } catch (err: any) {
            setOrders(prev);
            alert(err.message || 'Failed to update status');
        } finally {
            setUpdatingId(null);
            setCodOrderId(null);
        }
    };

    const openMaps = (lat: number, lng: number, label: string) => {
        if (lat && lng && (lat !== 0 || lng !== 0)) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`, '_blank');
        } else {
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(label)}`, '_blank');
        }
    };

    const logout = () => {
        if (agent) api.delivery.updateAgentStatus(agent.id, 'offline').catch(() => { });
        localStorage.removeItem('kc_delivery_agent');
        navigate('/delivery/login');
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const map: Record<string, { bg: string; text: string; dot: string }> = {
            'Assigned': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
            'Picked Up': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
            'Out for Delivery': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
            'Delivered': { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
        };
        const s = map[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {status}
            </span>
        );
    };

    // COD Confirmation Modal
    const CodModal = () => (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IndianRupee className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Collect Cash First</h3>
                <p className="text-slate-500 text-center text-sm mb-6">
                    This is a <strong>Cash on Delivery</strong> order. Confirm you have collected the payment from the customer before completing.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setCodOrderId(null)}
                        className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => codOrderId && updateStatus(codOrderId, 'Out for Delivery', true)}
                        className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-600/25"
                    >
                        Cash Collected ✓
                    </button>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading your orders...</p>
            </div>
        </div>
    );

    if (!agent) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center max-w-sm">
                <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900">Please Login First</h2>
                <button onClick={() => navigate('/delivery/login')} className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-bold">
                    Go to Login
                </button>
            </div>
        </div>
    );

    const activeOrders = orders.filter(o => o.deliveryStatus !== 'Delivered');
    const batches = [...new Set(activeOrders.map(o => o.deliveryBatchId).filter(Boolean))];

    return (
        <div className="pb-24 bg-slate-50 min-h-screen">
            {codOrderId && <CodModal />}

            {/* ── Header ── */}
            <div className="bg-white px-5 pt-6 pb-5 shadow-sm border-b sticky top-0 z-20">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Delivery Partner</p>
                        <h1 className="text-2xl font-heading font-extrabold text-slate-900">{agent.name}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/delivery/bulk-deliveries')}
                            className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors"
                        >
                            Bulk Orders
                        </button>
                        <button
                            onClick={() => fetchOrders(agent.id, true)}
                            className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center"
                        >
                            <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={logout}
                            className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center"
                        >
                            <PowerOff className="w-4 h-4 text-red-500" />
                        </button>
                    </div>
                </div>

                {/* Stats + Availability toggle */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-primary/5 border border-primary/10 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Active</p>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-2xl font-bold text-slate-700">{orders.filter(o => o.deliveryStatus === 'Delivered').length}</p>
                        <p className="text-xs text-slate-500 font-semibold uppercase">Done Today</p>
                    </div>
                    <button
                        onClick={toggleAvailability}
                        className={`flex-1 rounded-2xl p-3 flex flex-col items-center justify-center border transition-all ${agentStatus === 'offline'
                                ? 'bg-red-50 border-red-100 text-red-600'
                                : 'bg-green-50 border-green-100 text-green-700'
                            }`}
                    >
                        {agentStatus === 'offline'
                            ? <><PowerOff className="w-5 h-5 mb-1" /><span className="text-xs font-bold uppercase">Offline</span></>
                            : <><Power className="w-5 h-5 mb-1" /><span className="text-xs font-bold uppercase">Online</span></>
                        }
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {activeOrders.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-24 h-24 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <Package className="w-12 h-12 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">All caught up!</h3>
                        <p className="text-slate-400 mt-2 text-sm">No active deliveries right now.</p>
                    </div>
                ) : (
                    activeOrders.map(order => {
                        const orderId = order._id || order.id;
                        const isBusy = updatingId === orderId;
                        const hasBatch = batches.length > 1 && order.deliveryBatchId;

                        return (
                            <div
                                key={orderId}
                                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100"
                            >
                                {/* Batch indicator */}
                                {hasBatch && (
                                    <div className="bg-indigo-600 px-4 py-1.5 flex items-center gap-2">
                                        <Package className="w-3.5 h-3.5 text-white/80" />
                                        <span className="text-xs font-bold text-white">Batched Delivery</span>
                                    </div>
                                )}

                                {/* Status color bar */}
                                <div className={`h-1 ${order.deliveryStatus === 'Assigned' ? 'bg-blue-500' :
                                        order.deliveryStatus === 'Picked Up' ? 'bg-amber-500' : 'bg-purple-600'
                                    }`} />

                                <div className="p-5">
                                    {/* Top row */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-mono text-xs text-slate-400 mb-1">#{orderId.substring(0, 8).toUpperCase()}</p>
                                            <h3 className="font-bold text-lg text-slate-900 leading-tight">{order.customerName}</h3>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs text-slate-400">
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <StatusBadge status={order.deliveryStatus || 'Assigned'} />
                                    </div>

                                    {/* Addresses */}
                                    <div className="space-y-2 mb-4">
                                        {/* Pickup */}
                                        <div className="bg-blue-50/60 rounded-2xl p-3 flex items-start gap-3">
                                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Package className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">Pickup</p>
                                                <p className="text-sm font-semibold text-slate-800">{order.shopName || 'Kirana Store'}</p>
                                                <p className="text-xs text-slate-500 truncate">{order.shopAddress || 'Shop address'}</p>
                                            </div>
                                            <button
                                                onClick={() => openMaps(order.shopLocation?.lat || 0, order.shopLocation?.lng || 0, order.shopAddress || order.shopName || '')}
                                                className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"
                                            >
                                                <Navigation className="w-4 h-4 text-blue-600" />
                                            </button>
                                        </div>

                                        {/* Drop */}
                                        <div className="bg-slate-50 rounded-2xl p-3 flex items-start gap-3">
                                            <div className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Drop</p>
                                                <p className="text-sm font-semibold text-slate-800">{order.customerName}</p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {order.customerAddress?.text || 'Customer address'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => openMaps(
                                                    order.customerAddress?.lat || 0,
                                                    order.customerAddress?.lng || 0,
                                                    order.customerAddress?.text || order.customerName
                                                )}
                                                className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0"
                                            >
                                                <Navigation className="w-4 h-4 text-slate-600" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Payment info */}
                                    <div className="flex items-center justify-between mb-5 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                                                <span className="text-green-700 font-bold text-xs">₹</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase font-semibold">Amount</p>
                                                <p className="font-bold text-slate-900">₹{order.totalPrice}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wide ${order.paymentMethod === 'cod'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'bg-green-50 text-green-700 border border-green-100'
                                            }`}>
                                            {order.paymentMethod === 'cod' ? '💵 Collect Cash' : '✅ Prepaid'}
                                        </span>
                                    </div>

                                    {/* COD warning */}
                                    {order.paymentMethod === 'cod' && order.deliveryStatus === 'Out for Delivery' && (
                                        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <p className="text-xs text-amber-700 font-medium">Remember to collect cash before confirming delivery.</p>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    {order.deliveryStatus === 'Assigned' && (
                                        <button
                                            disabled={isBusy}
                                            onClick={() => updateStatus(orderId, 'Assigned')}
                                            className="w-full h-13 bg-amber-500 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/25 disabled:opacity-60"
                                        >
                                            {isBusy ? 'Updating...' : '📦 Picked Up from Shop'}
                                        </button>
                                    )}
                                    {order.deliveryStatus === 'Picked Up' && (
                                        <button
                                            disabled={isBusy}
                                            onClick={() => updateStatus(orderId, 'Picked Up')}
                                            className="w-full h-13 bg-purple-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-purple-700 active:scale-[0.98] transition-all shadow-lg shadow-purple-600/25 disabled:opacity-60"
                                        >
                                            {isBusy ? 'Updating...' : '🛵 Out for Delivery'}
                                        </button>
                                    )}
                                    {order.deliveryStatus === 'Out for Delivery' && (
                                        <button
                                            disabled={isBusy}
                                            onClick={() => updateStatus(orderId, 'Out for Delivery')}
                                            className="w-full h-13 bg-green-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-600/25 disabled:opacity-60 flex items-center justify-center gap-2"
                                        >
                                            {isBusy ? 'Completing...' : <><CheckCircle2 className="w-5 h-5" /> Complete Delivery</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DeliveryDashboard;

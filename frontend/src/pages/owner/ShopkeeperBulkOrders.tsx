import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Package, Users, DollarSign, MapPin, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface BulkOrder {
  _id: string;
  bulkOrderId: string;
  apartment: { name: string; address: string };
  totalFamilies: number;
  totalItems: number;
  totalAmount: number;
  deliveryFeeDiscount: number;
  status: string;
  participatingCustomers: any[];
  estimatedDeliveryDate: string;
}

const ShopkeeperBulkOrders = () => {
  const [bulkOrders, setBulkOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "CONFIRMED" | "PREPARING" | "READY">("CONFIRMED");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const shopId = localStorage.getItem("kc_shop_id") || localStorage.getItem("kc_user_id") || "";
  const apartmentId = localStorage.getItem("kc_apartment_id");

  useEffect(() => {
    fetchBulkOrders();
  }, [shopId]);

  const fetchBulkOrders = async () => {
    try {
      setLoading(true);
      const data = await api.bulkOrders.getShopkeeperBulkOrders(shopId);
      setBulkOrders(data || []);
    } catch (err) {
      toast.error("Failed to fetch bulk orders");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (bulkOrderId: string, newStatus: string) => {
    try {
      await api.bulkOrders.updateBulkOrderStatus(bulkOrderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      fetchBulkOrders();
    } catch (err) {
      toast.error("Failed to update order status");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-50 border-yellow-200 text-yellow-800",
      CONFIRMED: "bg-blue-50 border-blue-200 text-blue-800",
      PREPARING: "bg-orange-50 border-orange-200 text-orange-800",
      READY: "bg-green-50 border-green-200 text-green-800",
      OUT_FOR_DELIVERY: "bg-purple-50 border-purple-200 text-purple-800",
      DELIVERED: "bg-emerald-50 border-emerald-200 text-emerald-800",
    };
    return colors[status] || "bg-gray-50 border-gray-200 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "READY":
      case "DELIVERED":
        return <CheckCircle2 size={16} />;
      case "PREPARING":
        return <Clock size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const filteredOrders = filter === "all" ? bulkOrders : bulkOrders.filter(o => o.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {apartmentId ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-card-foreground mb-2">Bulk Orders</h1>
            <p className="text-muted-foreground">Manage apartment group orders</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Package className="text-blue-600" size={20} />
                <span className="text-muted-foreground text-sm">Total Orders</span>
              </div>
              <p className="text-3xl font-bold text-card-foreground">{bulkOrders.length}</p>
            </div>

            <div className="bg-white border border-orange-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-600" size={20} />
                <span className="text-muted-foreground text-sm">Preparing</span>
              </div>
              <p className="text-3xl font-bold text-card-foreground">
                {bulkOrders.filter(o => o.status === "PREPARING").length}
              </p>
            </div>

            <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="text-green-600" size={20} />
                <span className="text-muted-foreground text-sm">Ready</span>
              </div>
              <p className="text-3xl font-bold text-card-foreground">
                {bulkOrders.filter(o => o.status === "READY").length}
              </p>
            </div>

            <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="text-purple-600" size={20} />
                <span className="text-muted-foreground text-sm">Revenue</span>
              </div>
              <p className="text-3xl font-bold text-card-foreground">
                ₹{bulkOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["all", "CONFIRMED", "PREPARING", "READY"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === s
                    ? 'bg-primary text-white'
                    : 'bg-white border border-gray-200 text-card-foreground hover:border-primary'
                }`}
              >
                {s === "all" ? "All Orders" : s}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground mt-4">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No bulk orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div
                  key={order._id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-card-foreground">{order.bulkOrderId}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={16} />
                        <span>{order.apartment.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-card-foreground">₹{order.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-muted-foreground">Discount: ₹{order.deliveryFeeDiscount}</p>
                    </div>
                  </div>

                  {/* Order Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-gray-100">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Families</p>
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        <span className="text-lg font-bold">{order.totalFamilies}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Items</p>
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-green-600" />
                        <span className="text-lg font-bold">{order.totalItems}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                      <p className="text-lg font-bold text-card-foreground">
                        {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Expand/Collapse Customers */}
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="text-primary hover:underline text-sm font-medium mb-3"
                  >
                    {expandedOrder === order._id
                      ? "Hide Customers ▼"
                      : `Show ${order.totalFamilies} Customers ▶`}
                  </button>

                  {/* Customers List */}
                  {expandedOrder === order._id && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {order.participatingCustomers.map((pc, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-2 bg-white rounded border border-gray-100"
                          >
                            <div>
                              <p className="font-medium text-card-foreground">
                                {pc.customer?.name || "Customer"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pc.items?.length || 0} items • ₹{pc.totalAmount || 0}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-green-600">{pc.customer?.mobile}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Update Buttons */}
                  <div className="flex gap-2">
                    {order.status === "CONFIRMED" && (
                      <button
                        onClick={() => updateOrderStatus(order._id, "PREPARING")}
                        className="px-4 py-2 bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 font-medium text-sm"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === "PREPARING" && (
                      <button
                        onClick={() => updateOrderStatus(order._id, "READY")}
                        className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 font-medium text-sm"
                      >
                        Mark as Ready
                      </button>
                    )}
                    {order.status === "READY" && (
                      <button
                        onClick={() => updateOrderStatus(order._id, "OUT_FOR_DELIVERY")}
                        className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 font-medium text-sm"
                      >
                        Out for Delivery
                      </button>
                    )}
                    <button
                      onClick={() => fetchBulkOrders()}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium text-sm"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Bulk order is only available for apartment residents. Please set your apartment profile in your customer profile section.</p>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperBulkOrders;

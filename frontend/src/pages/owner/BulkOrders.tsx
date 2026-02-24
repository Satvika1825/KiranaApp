import { useState, useEffect } from "react";
import { Package, Users, MapPin, Clock, Truck, CheckCircle } from "lucide-react";

interface BulkOrderItem {
  _id: string;
  bulkOrderId: string;
  apartment: { name: string; address: string };
  totalFamilies: number;
  totalItems: number;
  totalAmount: number;
  deliveryFeeDiscount: number;
  status: string;
  participatingCustomers: any[];
  createdAt: string;
}

const ShopkeeperBulkOrders = () => {
  const [bulkOrders, setBulkOrders] = useState<BulkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<BulkOrderItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("CONFIRMED");

  useEffect(() => {
    fetchBulkOrders();
  }, [statusFilter]);

  const fetchBulkOrders = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockOrders: BulkOrderItem[] = [
        {
          _id: "1",
          bulkOrderId: "BULK-APT-001-20250224",
          apartment: { name: "Prestige Park Apartments", address: "Marathahalli, Bangalore" },
          totalFamilies: 8,
          totalItems: 45,
          totalAmount: 3200,
          deliveryFeeDiscount: 120,
          status: "CONFIRMED",
          participatingCustomers: [
            { customer: { name: "Rajesh Kumar", mobile: "9876543210" }, totalAmount: 450 },
            { customer: { name: "Priya Sharma", mobile: "9876543211" }, totalAmount: 380 },
            { customer: { name: "Amit Singh", mobile: "9876543212" }, totalAmount: 420 },
            { customer: { name: "Neha Gupta", mobile: "9876543213" }, totalAmount: 380 },
            { customer: { name: "Vikram Chopra", mobile: "9876543214" }, totalAmount: 400 },
            { customer: { name: "Anjali Reddy", mobile: "9876543215" }, totalAmount: 360 },
            { customer: { name: "Rohit Patel", mobile: "9876543216" }, totalAmount: 410 },
            { customer: { name: "Divya Nair", mobile: "9876543217" }, totalAmount: 400 },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          bulkOrderId: "BULK-APT-002-20250224",
          apartment: { name: "Lotus Residency", address: "HSR Layout, Bangalore" },
          totalFamilies: 5,
          totalItems: 28,
          totalAmount: 1850,
          deliveryFeeDiscount: 75,
          status: "PREPARING",
          participatingCustomers: [
            { customer: { name: "Suresh Kumar", mobile: "9876543220" }, totalAmount: 420 },
            { customer: { name: "Deepa Menon", mobile: "9876543221" }, totalAmount: 380 },
            { customer: { name: "Arjun Singh", mobile: "9876543222" }, totalAmount: 450 },
            { customer: { name: "Sneha Desai", mobile: "9876543223" }, totalAmount: 320 },
            { customer: { name: "Karthik Rao", mobile: "9876543224" }, totalAmount: 280 },
          ],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setBulkOrders(mockOrders.filter((o) => o.status === statusFilter));
    } catch (err) {
      console.error("Failed to fetch bulk orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setBulkOrders(
        bulkOrders.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      // API call would go here
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PREPARING":
        return "bg-orange-100 text-orange-800";
      case "READY":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-card-foreground font-display mb-2">
            🏘️ Bulk Apartment Orders
          </h1>
          <p className="text-muted-foreground">
            View and manage orders grouped by apartment for faster fulfillment
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {["CONFIRMED", "PREPARING", "READY"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary text-card-foreground hover:bg-secondary/80"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-secondary rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bulkOrders.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-2xl">
            <Package size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bulk orders in {statusFilter} status</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bulkOrders.map((order) => (
              <div
                key={order._id}
                className="bg-card rounded-2xl shadow-lg border-2 border-border p-6 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <h3 className="text-xl font-bold text-card-foreground">{order.apartment.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {order.apartment.address}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-primary">#{order.bulkOrderId.split("-").pop()}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-primary/10 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Families</p>
                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                      <Users size={16} />
                      {order.totalFamilies}
                    </p>
                  </div>

                  <div className="bg-purple-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Items</p>
                    <p className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                      <Package size={16} />
                      {order.totalItems}
                    </p>
                  </div>

                  <div className="bg-green-100 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-600">₹{order.totalAmount}</p>
                  </div>
                </div>

                {/* Discount Badge */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-3 mb-5">
                  <p className="text-sm font-bold text-indigo-800">
                    💚 ₹{order.deliveryFeeDiscount} savings (bulk discount)
                  </p>
                </div>

                {/* Customers Preview */}
                <div className="mb-5">
                  <p className="text-xs font-bold text-muted-foreground mb-2">Customers ({order.participatingCustomers.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {order.participatingCustomers.slice(0, 4).map((pc, i) => (
                      <span key={i} className="text-xs bg-secondary px-2 py-1 rounded-full truncate">
                        {pc.customer.name.split(" ")[0]}
                      </span>
                    ))}
                    {order.participatingCustomers.length > 4 && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        +{order.participatingCustomers.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  className={`w-full py-3 font-bold rounded-xl transition-all ${
                    order.status === "CONFIRMED"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : order.status === "PREPARING"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-primary hover:bg-primary/80 text-primary-foreground"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus =
                      order.status === "CONFIRMED" ? "PREPARING" : order.status === "PREPARING" ? "READY" : "READY";
                    updateOrderStatus(order._id, nextStatus);
                  }}
                >
                  {order.status === "CONFIRMED"
                    ? "Start Preparing"
                    : order.status === "PREPARING"
                    ? "Mark Ready"
                    : "View Details"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Detailed Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
            <div
              className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-card-foreground font-display">
                    {selectedOrder.apartment.name}
                  </h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-2">
                    <MapPin size={16} />
                    {selectedOrder.apartment.address}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-2xl text-muted-foreground hover:text-card-foreground"
                >
                  ×
                </button>
              </div>

              {/* Customers List */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-card-foreground mb-4">📝 Participating Customers</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedOrder.participatingCustomers.map((pc: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-bold text-card-foreground">{pc.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{pc.customer.mobile}</p>
                      </div>
                      <span className="font-bold text-primary">₹{pc.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t-2 border-border pt-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-card-foreground">₹{selectedOrder.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold">Bulk Discount</p>
                    <p className="text-2xl font-bold text-green-600">-₹{selectedOrder.deliveryFeeDiscount}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopkeeperBulkOrders;

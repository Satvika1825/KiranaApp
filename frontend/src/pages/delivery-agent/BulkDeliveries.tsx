import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, CheckCircle2, MapPin, Users, Package, Phone, Truck, Route } from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  mobile: string;
  apartmentUnit: string;
}

interface ParticipatingCustomer {
  customer: Customer;
  items: any[];
  totalAmount: number;
}

interface BulkDelivery {
  _id: string;
  bulkOrderId: string;
  apartment: { name: string; address: string; area: string };
  status: string;
  totalFamilies: number;
  totalItems: number;
  totalAmount: number;
  participatingCustomers: ParticipatingCustomer[];
  deliverySlot: { startTime: string; endTime: string };
  estimatedDeliveryDate: string;
}

const DeliveryAgentBulkDeliveries = () => {
  const [bulkDeliveries, setBulkDeliveries] = useState<BulkDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizedOrder, setOptimizedOrder] = useState<string[]>([]);
  const [deliveredCustomers, setDeliveredCustomers] = useState<Set<string>>(new Set());
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  const agentId = localStorage.getItem("kc_agent_id") || localStorage.getItem("kc_user_id") || "";

  useEffect(() => {
    fetchBulkDeliveries();
  }, [agentId]);

  const fetchBulkDeliveries = async () => {
    try {
      setLoading(true);
      const data = await api.bulkOrders.getDeliveryAgentBulk(agentId);
      setBulkDeliveries(data || []);
    } catch (err) {
      toast.error("Failed to fetch deliveries");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const optimizeRoute = (deliveryId: string) => {
    const delivery = bulkDeliveries.find(d => d._id === deliveryId);
    if (!delivery) return;

    // Sort customers by apartment unit for sequential delivery
    const sorted = [...delivery.participatingCustomers]
      .sort((a, b) => (a.customer.apartmentUnit || "").localeCompare(b.customer.apartmentUnit || ""))
      .map(pc => pc.customer._id);

    setOptimizedOrder(sorted);
    toast.success("Route optimized for efficient delivery!");
  };

  const markCustomerDelivered = (customerId: string) => {
    const newDelivered = new Set(deliveredCustomers);
    if (newDelivered.has(customerId)) {
      newDelivered.delete(customerId);
    } else {
      newDelivered.add(customerId);
    }
    setDeliveredCustomers(newDelivered);
  };

  const markAllDelivered = async (deliveryId: string) => {
    try {
      const delivery = bulkDeliveries.find(d => d._id === deliveryId);
      if (!delivery) return;

      await api.bulkOrders.markBulkDelivered(deliveryId);
      toast.success("Bulk delivery marked as complete!");
      fetchBulkDeliveries();
      setDeliveredCustomers(new Set());
    } catch (err) {
      toast.error("Failed to mark delivery complete");
    }
  };

  const getDeliveryProgress = (deliveryId: string) => {
    const delivery = bulkDeliveries.find(d => d._id === deliveryId);
    if (!delivery) return 0;
    return (deliveredCustomers.size / delivery.totalFamilies) * 100;
  };

  const activeDeliveries = bulkDeliveries.filter(d => d.status !== "DELIVERED");
  const selectedDeliveryData = bulkDeliveries.find(d => d._id === selectedDelivery);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">Bulk Deliveries</h1>
              <p className="text-muted-foreground text-sm mt-1">Apartment group orders</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{activeDeliveries.length}</p>
              <p className="text-xs text-muted-foreground">Active Deliveries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Loading deliveries...</p>
          </div>
        ) : activeDeliveries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Truck size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No deliveries assigned yet</p>
            <button
              onClick={fetchBulkDeliveries}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deliveries List */}
            <div className="lg:col-span-2 space-y-4">
              {activeDeliveries.map(delivery => {
                const isSelected = selectedDelivery === delivery._id;
                const customers = optimizedOrder.length > 0 && isSelected
                  ? delivery.participatingCustomers.sort((a, b) => {
                      const aIdx = optimizedOrder.indexOf(a.customer._id);
                      const bIdx = optimizedOrder.indexOf(b.customer._id);
                      return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
                    })
                  : delivery.participatingCustomers;

                const progress = (deliveredCustomers.size / delivery.totalFamilies) * 100;

                return (
                  <div
                    key={delivery._id}
                    onClick={() => setSelectedDelivery(isSelected ? null : delivery._id)}
                    className={`bg-white border rounded-xl p-6 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    {/* Delivery Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-card-foreground">{delivery.bulkOrderId}</h3>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin size={14} />
                          <span className="text-sm">{delivery.apartment.name}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {delivery.totalFamilies} Units
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground mb-1">Families</p>
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-blue-600" />
                          <span className="font-bold text-card-foreground">{delivery.totalFamilies}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground mb-1">Items</p>
                        <div className="flex items-center gap-1">
                          <Package size={14} className="text-green-600" />
                          <span className="font-bold text-card-foreground">{delivery.totalItems}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-muted-foreground mb-1">Amount</p>
                        <p className="font-bold text-card-foreground">₹{delivery.totalAmount}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Progress</span>
                        <span className="text-xs font-bold text-primary">
                          {deliveredCustomers.size}/{delivery.totalFamilies}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isSelected && (
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => optimizeRoute(delivery._id)}
                          className="w-full px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-medium text-sm flex items-center justify-center gap-2"
                        >
                          <Route size={16} />
                          Optimize Route
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail Panel */}
            {selectedDeliveryData && (
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-card-foreground mb-4">
                    Delivery Details
                  </h3>

                  <div className="space-y-4 mb-6">
                    {/* Apartment Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Apartment</p>
                      <p className="font-bold text-card-foreground">
                        {selectedDeliveryData.apartment.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedDeliveryData.apartment.address}
                      </p>
                    </div>

                    {/* Time Slot */}
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Delivery Window</p>
                      <p className="font-bold text-card-foreground">
                        {selectedDeliveryData.deliverySlot.startTime} - {selectedDeliveryData.deliverySlot.endTime}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(selectedDeliveryData.estimatedDeliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Customers List */}
                  <div className="mb-6">
                    <p className="text-sm font-bold text-card-foreground mb-3">
                      Customers ({deliveredCustomers.size}/{selectedDeliveryData.totalFamilies})
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(optimizedOrder.length > 0
                        ? selectedDeliveryData.participatingCustomers.sort((a, b) => {
                            const aIdx = optimizedOrder.indexOf(a.customer._id);
                            const bIdx = optimizedOrder.indexOf(b.customer._id);
                            return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
                          })
                        : selectedDeliveryData.participatingCustomers
                      ).map((pc, idx) => {
                        const isDelivered = deliveredCustomers.has(pc.customer._id);
                        const stopNumber = optimizedOrder.length > 0 ? optimizedOrder.indexOf(pc.customer._id) + 1 : idx + 1;

                        return (
                          <div
                            key={pc.customer._id}
                            className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                              isDelivered
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200 hover:border-primary"
                            }`}
                            onClick={() => markCustomerDelivered(pc.customer._id)}
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isDelivered
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}>
                                {stopNumber}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-card-foreground">
                                  {pc.customer.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Unit: {pc.customer.apartmentUnit}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {pc.items?.length || 0} items • ₹{pc.totalAmount}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isDelivered ? (
                                <CheckCircle2 size={20} className="text-green-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Complete Button */}
                  <button
                    onClick={() => markAllDelivered(selectedDeliveryData._id)}
                    disabled={deliveredCustomers.size !== selectedDeliveryData.totalFamilies}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                      deliveredCustomers.size === selectedDeliveryData.totalFamilies
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Complete Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAgentBulkDeliveries;

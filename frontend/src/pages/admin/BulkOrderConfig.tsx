import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Settings, TrendingUp, Loader } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Apartment {
  _id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  postalCode: string;
  totalFamilies: number;
  registeredFamilies: number;
  isActive: boolean;
  deliveryRadius: number;
}

interface OrderWindow {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  apartmentId: string;
  isActive: boolean;
}

interface Statistics {
  totalBulkOrders: number;
  totalApartments: number;
  totalParticipants: number;
  totalRevenue: number;
}

const AdminBulkOrderDashboard = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [orderWindows, setOrderWindows] = useState<OrderWindow[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [activeTab, setActiveTab] = useState<"apartments" | "windows" | "stats">("apartments");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptData, statsData] = await Promise.all([
        api.bulkOrders.getAllApartments(),
        api.bulkOrders.getStatistics(),
      ]);
      
      setApartments(aptData || []);
      setStatistics(statsData || null);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load bulk order data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddApartment = async () => {
    try {
      if (editingItem) {
        await api.bulkOrders.updateApartment(editingItem._id, formData);
        toast.success("Apartment updated successfully");
      } else {
        await api.bulkOrders.createApartment(formData);
        toast.success("Apartment created successfully");
      }
      setShowAddModal(false);
      setFormData({});
      setEditingItem(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save apartment");
    }
  };

  const toggleApartmentStatus = async (id: string, currentStatus: boolean) => {
    try {
      await api.bulkOrders.updateApartment(id, { isActive: !currentStatus });
      toast.success(`Apartment ${!currentStatus ? "activated" : "deactivated"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update apartment status");
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      address: item.address,
      area: item.area,
      city: item.city,
      totalFamilies: item.totalFamilies,
      deliveryRadius: item.deliveryRadius,
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingItem(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-card-foreground font-display mb-2 flex items-center gap-3">
            <Settings size={40} className="text-primary" />
            Bulk Ordering Management
          </h1>
          <p className="text-muted-foreground">
            Configure apartments, order windows, and monitor bulk ordering metrics
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[
              { label: "Bulk Orders", value: statistics.totalBulkOrders, icon: "📦", color: "from-blue-100 to-blue-50" },
              { label: "Active Apartments", value: statistics.totalApartments, icon: "🏘️", color: "from-purple-100 to-purple-50" },
              { label: "Total Participants", value: statistics.totalParticipants, icon: "👥", color: "from-green-100 to-green-50" },
              { label: "Revenue Generated", value: `₹${statistics.totalRevenue.toLocaleString('en-IN')}`, icon: "💰", color: "from-orange-100 to-orange-50" },
            ].map((stat, i) => (
              <div
                key={i}
                className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 border-2 border-border`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase">{stat.label}</p>
                    <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-3 mb-8 border-b-2 border-border">
          {["apartments", "windows", "stats"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-bold transition-all border-b-4 -mb-[2px] ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-card-foreground"
              }`}
            >
              {tab === "apartments"
                ? "Apartments"
                : tab === "windows"
                ? "Order Windows"
                : "Statistics"}
            </button>
          ))}
        </div>

        {/* Apartments Section */}
        {activeTab === "apartments" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground">Residential Apartments</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFormData({});
                  setShowAddModal(true);
                }}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                Add Apartment
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader size={32} className="mx-auto animate-spin text-primary" />
              </div>
            ) : apartments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-muted-foreground">No apartments configured yet</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {apartments.map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-card rounded-2xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-card-foreground">{apt.name}</h3>
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full ${
                              apt.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {apt.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{apt.address}, {apt.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(apt)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Total Families</p>
                        <p className="text-2xl font-bold text-primary">{apt.totalFamilies}</p>
                      </div>
                      <div className="bg-green-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Registered</p>
                        <p className="text-2xl font-bold text-green-600">{apt.registeredFamilies}</p>
                      </div>
                      <div className="bg-purple-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Enrollment</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round((apt.registeredFamilies / apt.totalFamilies) * 100)}%
                        </p>
                      </div>
                      <div className="bg-orange-100 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Delivery Radius</p>
                        <p className="text-2xl font-bold text-orange-600">{apt.deliveryRadius}km</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleApartmentStatus(apt._id, apt.isActive)}
                      className={`w-full py-2 font-bold rounded-lg transition-colors ${
                        apt.isActive
                          ? "bg-red-100 text-red-600 hover:bg-red-200"
                          : "bg-green-100 text-green-600 hover:bg-green-200"
                      }`}
                    >
                      {apt.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Windows Section */}
        {activeTab === "windows" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-card-foreground">Bulk Order Time Windows</h2>
               <button className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2">
                <Plus size={18} />
                Add Window
              </button>
            </div>
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-muted-foreground">Order windows management coming soon</p>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        {activeTab === "stats" && (
          <div>
            <h2 className="text-2xl font-bold text-card-foreground mb-6">Bulk Ordering Analytics</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-card rounded-2xl p-6 border-2 border-border text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Average Order Value</p>
                <p className="text-3xl font-bold text-card-foreground">
                  ₹{statistics ? Math.round(statistics.totalRevenue / (statistics.totalBulkOrders || 1)) : 0}
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 border-2 border-border text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Avg Families per Order</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {statistics ? Math.round(statistics.totalParticipants / (statistics.totalBulkOrders || 1)) : 0}
                </p>
              </div>

              <div className="bg-card rounded-2xl p-6 border-2 border-border text-center">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Total Savings Given</p>
                <p className="text-3xl font-bold text-green-600">
                  ₹{statistics ? ((statistics.totalBulkOrders * 15) || 0).toLocaleString('en-IN') : 0}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-card-foreground mb-6">
              {editingItem ? "Edit Apartment" : "Add Apartment"}
            </h2>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Apartment Name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <input
                type="text"
                placeholder="Area"
                value={formData.area || ""}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <input
                type="text"
                placeholder="City"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <input
                type="number"
                placeholder="Total Families"
                value={formData.totalFamilies || ""}
                onChange={(e) => setFormData({ ...formData, totalFamilies: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
              <input
                type="number"
                placeholder="Delivery Radius (km)"
                value={formData.deliveryRadius || "5"}
                onChange={(e) => setFormData({ ...formData, deliveryRadius: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 border-2 border-border text-card-foreground font-bold rounded-xl hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddApartment}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkOrderDashboard;

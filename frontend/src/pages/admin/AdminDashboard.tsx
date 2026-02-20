import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp, Users, Store, ShoppingCart } from "lucide-react";

const revenueData = [
  { day: "Mon", revenue: 2000 },
  { day: "Tue", revenue: 3000 },
  { day: "Wed", revenue: 2500 },
  { day: "Thu", revenue: 4000 },
  { day: "Fri", revenue: 3500 },
  { day: "Sat", revenue: 5000 },
  { day: "Sun", revenue: 4200 },
];

const ordersData = [
  { day: "Mon", orders: 5 },
  { day: "Tue", orders: 8 },
  { day: "Wed", orders: 6 },
  { day: "Thu", orders: 10 },
  { day: "Fri", orders: 7 },
  { day: "Sat", orders: 12 },
  { day: "Sun", orders: 9 },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">

      {/* Page Title */}
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {/* Stores */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <Store className="text-indigo-600" />
            <span className="text-green-600 text-sm font-medium">+2.5%</span>
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Stores</h2>
          <p className="text-3xl font-bold mt-2">1</p>
        </div>

        {/* Customers */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <Users className="text-indigo-600" />
            <span className="text-green-600 text-sm font-medium">+12%</span>
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Customers</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <ShoppingCart className="text-indigo-600" />
            <span className="text-green-600 text-sm font-medium">+8.1%</span>
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Total Orders</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <TrendingUp className="text-indigo-600" />
            <span className="text-green-600 text-sm font-medium">+15%</span>
          </div>
          <h2 className="text-gray-500 text-sm mt-4">Platform Revenue</h2>
          <p className="text-3xl font-bold mt-2">₹25,000</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-8">

        {/* Revenue Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="font-semibold mb-4">Weekly Orders</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Recent Orders Section */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="font-semibold mb-4">Recent Orders</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b">
              <tr className="text-gray-500 text-sm">
                <th className="py-3">Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b hover:bg-gray-50">
                <td className="py-3">#ORD001</td>
                <td>Sathwika</td>
                <td>₹450</td>
                <td>
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                    Delivered
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3">#ORD002</td>
                <td>Divija</td>
                <td>₹820</td>
                <td>
                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                    Pending
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";

const AdminLayout = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("kc_session");
    navigate("/");
  };

  const menu = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Stores", path: "/admin/stores", icon: Store },
    { name: "Owners", path: "/admin/owners", icon: Users },
    { name: "Customers", path: "/admin/customers", icon: Users },
    { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
    { name: "Reports", path: "/admin/reports", icon: FileText },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
        <div className="p-6 text-xl font-bold border-b border-indigo-700">
          Kirana Admin
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menu.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-indigo-700"
                    : "hover:bg-indigo-800"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="m-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-8 animate-fade-in">
        <Outlet />
      </div>
    </div>
  );
};
import { getAdminProfile } from '@/lib/store';

const profile = getAdminProfile();

<div className="flex items-center gap-3">
  <img
    src={profile?.photo || 'https://via.placeholder.com/40'}
    className="w-10 h-10 rounded-full"
  />
  <span className="font-semibold">{profile?.name}</span>
</div>

export default AdminLayout;

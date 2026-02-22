import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { getAdminProfile } from '@/lib/store';

const AdminLayout = () => {
  const navigate = useNavigate();
  const profile = getAdminProfile();

  const logout = () => {
    localStorage.clear();
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 text-2xl font-black border-b border-slate-800 tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg" />
          KiranaAdmin
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-4">
          {menu.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl font-bold text-sm transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar for profile */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-slate-400 font-bold text-xs uppercase tracking-widest">Administrator Control Panel</h2>

          <div className="flex items-center gap-4 bg-slate-50 pl-2 pr-4 py-1.5 rounded-full border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 overflow-hidden">
              {profile?.photo ? (
                <img src={profile.photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-none">{profile?.name || 'Admin User'}</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Super Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 animate-fade-in bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

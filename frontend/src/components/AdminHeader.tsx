import { Moon, Sun, Bell } from "lucide-react";
import { useState, useEffect } from "react";

const AdminHeader = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("kc_dark");
    if (saved === "true") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    const newMode = !dark;
    setDark(newMode);
    localStorage.setItem("kc_dark", newMode.toString());
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <input
        type="text"
        placeholder="Search..."
        className="px-4 py-2 rounded-lg border w-72"
      />

      <div className="flex items-center gap-4">
        <Bell className="cursor-pointer" />
        <button onClick={toggleDark}>
          {dark ? <Sun /> : <Moon />}
        </button>

        <div className="flex items-center gap-2 cursor-pointer">
          <img
            src="/admin-avatar.png"
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium">Admin</span>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;

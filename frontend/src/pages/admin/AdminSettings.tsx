/**
 * Admin Settings — Simple placeholder settings page.
 */
import { Settings, Shield, Bell, Globe } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-indigo-600" />
          <h3 className="font-heading font-bold text-gray-900">General Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Platform Name</p>
                <p className="text-xs text-gray-500">KiranaConnect</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Notifications</p>
                <p className="text-xs text-gray-500">Email alerts for new orders</p>
              </div>
            </div>
            <span className="admin-badge-active">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Security</p>
                <p className="text-xs text-gray-500">Admin session management</p>
              </div>
            </div>
            <span className="admin-badge-active">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

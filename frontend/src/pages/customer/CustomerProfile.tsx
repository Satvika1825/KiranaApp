/**
 * Customer Profile Page
 * View/edit name, email, mobile. Manage addresses.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile, saveCustomerProfile, getCustomerAddresses } from '@/lib/store';
import { User, MapPin, ChevronRight, LogOut } from 'lucide-react';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getCustomerProfile());
  const addresses = getCustomerAddresses();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: profile?.name || '', email: profile?.email || '' });

  const handleSave = () => {
    if (!profile) return;
    const updated = { ...profile, name: form.name, email: form.email };
    saveCustomerProfile(updated);
    setProfile(updated);
    setEditing(false);
  };

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">My Profile</h2>

      <div className="kc-card-flat p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-foreground">{profile?.name || 'Guest'}</p>
            <p className="text-sm text-muted-foreground">{profile?.mobile || 'Not set'}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email (optional)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="For receipts" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg font-semibold text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {profile?.email && (
              <p className="text-sm text-muted-foreground">Email: {profile.email}</p>
            )}
            <button onClick={() => setEditing(true)}
              className="text-sm text-primary font-semibold hover:underline">Edit Profile</button>
          </div>
        )}
      </div>

      {/* Addresses */}
      <button onClick={() => navigate('/customer/address')}
        className="kc-card-flat p-4 w-full text-left flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-foreground text-sm">Saved Addresses</p>
            <p className="text-xs text-muted-foreground">{addresses.length} address{addresses.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>

      <button onClick={() => navigate('/')}
        className="w-full flex items-center justify-center gap-2 py-3 text-destructive bg-destructive/10 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity mt-4">
        <LogOut className="w-4 h-4" /> Exit App
      </button>
    </div>
  );
};

export default CustomerProfile;

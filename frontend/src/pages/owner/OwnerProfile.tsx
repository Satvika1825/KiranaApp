/**
 * Owner Profile Page
 * Editable: Full Name, Email, Shop Details, Timings.
 */
import { useState } from 'react';
import { getOwnerProfile, saveOwnerProfile, getShop, saveShop } from '@/lib/store';
import { User, Store, Clock, Check } from 'lucide-react';

const OwnerProfile = () => {
  const owner = getOwnerProfile();
  const shop = getShop();

  const [form, setForm] = useState({
    fullName: owner?.fullName || '',
    email: owner?.email || '',
    shopName: shop?.shopName || '',
    shopType: shop?.shopType || 'Kirana',
    openingTime: shop?.openingTime || '07:00',
    closingTime: shop?.closingTime || '21:00',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (owner) saveOwnerProfile({ ...owner, fullName: form.fullName, email: form.email });
    if (shop) saveShop({ ...shop, shopName: form.shopName, shopType: form.shopType, openingTime: form.openingTime, closingTime: form.closingTime });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in max-w-lg">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Profile</h2>

      <div className="space-y-4">
        <div className="kc-card-flat p-5 space-y-4">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" /> Personal Info
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
            <input type="text" value={form.fullName} onChange={e => update('fullName', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
            <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Mobile</label>
            <input type="text" value={owner?.mobile || ''} readOnly
              className="w-full px-3 py-2.5 rounded-lg border bg-muted text-muted-foreground text-sm" />
          </div>
        </div>

        <div className="kc-card-flat p-5 space-y-4">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm">
            <Store className="w-4 h-4 text-primary" /> Shop Details
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Shop Name</label>
            <input type="text" value={form.shopName} onChange={e => update('shopName', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Shop Type</label>
            <select value={form.shopType} onChange={e => update('shopType', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option>Kirana</option>
              <option>General Store</option>
              <option>Provision Store</option>
            </select>
          </div>
        </div>

        <div className="kc-card-flat p-5 space-y-4">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-primary" /> Timings
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Opening</label>
              <input type="time" value={form.openingTime} onChange={e => update('openingTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Closing</label>
              <input type="time" value={form.closingTime} onChange={e => update('closingTime', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default OwnerProfile;

import { useState, useEffect } from 'react';
import { getOwnerProfile, saveOwnerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { User, Store, Clock, Check, Loader2, AlertCircle } from 'lucide-react';

const OwnerProfile = () => {
  const owner = getOwnerProfile();
  const ownerId = owner?.id || '';

  const [form, setForm] = useState({
    fullName: owner?.fullName || '',
    email: owner?.email || '',
    shopName: '',
    shopType: 'Kirana',
    openingTime: '07:00',
    closingTime: '21:00',
  });

  const [shop, setShop] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Fetch shop data on mount
  useEffect(() => {
    const fetchShop = async () => {
      if (!ownerId) {
        setFetching(false);
        return;
      }
      try {
        const data = await api.stores.getByOwner(ownerId);
        if (data.store) {
          setShop(data.store);
          setForm(prev => ({
            ...prev,
            shopName: data.store.shopName || '',
            shopType: data.store.shopType || 'Kirana',
            openingTime: data.store.openingTime || '07:00',
            closingTime: data.store.closingTime || '21:00',
          }));
        }
      } catch (err) {
        console.error('Failed to fetch shop:', err);
        setError('Could not load shop details');
      } finally {
        setFetching(false);
      }
    };
    fetchShop();
  }, [ownerId]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSaved(false);

    try {
      // 1. Update Owner Info (Name, Email)
      if (owner) {
        const updatedOwner = await api.auth.registerOwner({
          fullName: form.fullName,
          email: form.email,
          mobile: owner.mobile,
          password: ''
        });
        saveOwnerProfile({ ...owner, fullName: updatedOwner.user.fullName, email: updatedOwner.user.email });
      }

      // 2. Update Shop Details
      const updatedShop = await api.stores.create({
        ownerId,
        shopName: form.shopName,
        shopType: form.shopType,
        openingTime: form.openingTime,
        closingTime: form.closingTime,
        shopPhoto: shop?.shopPhoto || '',
        address: shop?.address || { houseNumber: '', area: '', landmark: '', pinCode: '' },
        gpsLocation: shop?.gpsLocation || '',
        weeklyOff: shop?.weeklyOff || ''
      });

      setShop(updatedShop.store);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0 animate-fade-in max-w-lg">
      <h2 className="text-xl font-heading font-bold text-foreground mb-4">Profile</h2>

      <div className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

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
              <option>Bakery</option>
              <option>Pharmacy</option>
              <option>Supermarket</option>
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

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  );
};

export default OwnerProfile;

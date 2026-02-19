/**
 * Shop Setup Page
 * Owner fills in shop details — saves to both localStorage and backend.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Clock, Camera } from 'lucide-react';
import { saveShop, getOwnerProfile, getShop } from '@/lib/store';
import { api } from '@/lib/api';
import { syncService } from '@/lib/sync';

const ShopSetup = () => {
  const navigate = useNavigate();
  const owner = getOwnerProfile();
  const existingShop = getShop();

  const [form, setForm] = useState({
    shopName: existingShop?.shopName || '',
    shopType: existingShop?.shopType || 'Kirana',
    shopPhoto: existingShop?.shopPhoto || '',
    houseNumber: existingShop?.address.houseNumber || '',
    area: existingShop?.address.area || '',
    landmark: existingShop?.address.landmark || '',
    pinCode: existingShop?.address.pinCode || '',
    gpsLocation: existingShop?.gpsLocation || '',
    openingTime: existingShop?.openingTime || '07:00',
    closingTime: existingShop?.closingTime || '21:00',
    weeklyOff: existingShop?.weeklyOff || '',
  });

  const [photoPreview, setPhotoPreview] = useState(existingShop?.shopPhoto || '');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setForm({ ...form, shopPhoto: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetectGPS = () => {
    setForm({ ...form, gpsLocation: '12.9716° N, 77.5946° E' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.area) return;

    const shopData = {
      ownerId: owner?.id || 'owner1',
      shopName: form.shopName,
      shopType: form.shopType,
      shopPhoto: form.shopPhoto,
      address: {
        houseNumber: form.houseNumber,
        area: form.area,
        landmark: form.landmark,
        pinCode: form.pinCode,
      },
      gpsLocation: form.gpsLocation,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      weeklyOff: form.weeklyOff,
    };

    // Save to localStorage
    saveShop(shopData);

    // Save to backend
    try {
      await api.stores.create(shopData);
      console.log('Store synced to backend');
    } catch {
      console.log('Backend save failed, scheduling sync');
      syncService.syncOwnerData();
    }

    navigate('/owner/dashboard');
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  return (
    <div className="min-h-screen bg-background p-4 pb-8">
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-heading font-bold text-foreground">Shop Setup</h1>
          <p className="text-sm text-muted-foreground">Tell us about your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Shop Identity */}
          <div className="kc-card-flat p-5 space-y-4">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" /> Shop Identity
            </h2>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Shop Name *</label>
              <input type="text" value={form.shopName} onChange={e => update('shopName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Rajesh General Store" required />
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
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Shop Photo</label>
              <div className="flex items-center gap-3">
                {photoPreview ? (
                  <img src={photoPreview} alt="Shop" className="w-16 h-16 rounded-lg object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <label className="px-3 py-2 rounded-lg border text-sm cursor-pointer hover:bg-accent transition-colors text-foreground">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="kc-card-flat p-5 space-y-4">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" /> Address
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">House No.</label>
                <input type="text" value={form.houseNumber} onChange={e => update('houseNumber', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="42" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Pin Code</label>
                <input type="text" value={form.pinCode} onChange={e => update('pinCode', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="560001" maxLength={6} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Area *</label>
              <input type="text" value={form.area} onChange={e => update('area', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="MG Road" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Landmark</label>
              <input type="text" value={form.landmark} onChange={e => update('landmark', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Near Bus Stand" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">GPS Location</label>
              <div className="flex gap-2">
                <input type="text" value={form.gpsLocation} readOnly
                  className="flex-1 px-3 py-2.5 rounded-lg border bg-muted text-foreground text-sm" placeholder="Auto-detect" />
                <button type="button" onClick={handleDetectGPS}
                  className="px-3 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  Detect
                </button>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="kc-card-flat p-5 space-y-4">
            <h2 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Timings
            </h2>
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
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Weekly Off</label>
              <select value={form.weeklyOff} onChange={e => update('weeklyOff', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">No weekly off</option>
                <option>Monday</option>
                <option>Tuesday</option>
                <option>Wednesday</option>
                <option>Thursday</option>
                <option>Friday</option>
                <option>Saturday</option>
                <option>Sunday</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopSetup;

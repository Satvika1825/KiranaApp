import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Clock, Camera, Loader2, AlertCircle } from 'lucide-react';
import { getOwnerProfile } from '@/lib/store';
import { api } from '@/lib/api';

const ShopSetup = () => {
  const navigate = useNavigate();
  const owner = getOwnerProfile();

  const [form, setForm] = useState({
    shopName: '',
    shopType: 'Kirana',
    shopPhoto: '',
    houseNumber: '',
    area: '',
    landmark: '',
    pinCode: '',
    gpsLocation: '',
    openingTime: '07:00',
    closingTime: '21:00',
    weeklyOff: '',
  });

  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchShop = async () => {
      if (!owner?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await api.stores.getById(owner.id); // Or getByOwner
        const shop = data.store;
        if (shop) {
          setForm({
            shopName: shop.shopName || '',
            shopType: shop.shopType || 'Kirana',
            shopPhoto: shop.shopPhoto || '',
            houseNumber: shop.address?.houseNumber || '',
            area: shop.address?.area || '',
            landmark: shop.address?.landmark || '',
            pinCode: shop.address?.pinCode || '',
            gpsLocation: shop.gpsLocation || '',
            openingTime: shop.openingTime || '07:00',
            closingTime: shop.closingTime || '21:00',
            weeklyOff: shop.weeklyOff || '',
          });
          setPhotoPreview(shop.shopPhoto || '');
        }
      } catch (err) {
        console.error('Failed to fetch shop', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [owner?.id]);

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
    setForm({ ...form, gpsLocation: '12.9716, 77.5946' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName || !form.area) return;

    setSaving(true);
    setError('');
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

    try {
      await api.stores.create(shopData);
      navigate('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save shop details');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading your shop details...</p>
    </div>
  );

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

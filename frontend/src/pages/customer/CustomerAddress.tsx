import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { MapPin, Plus, Navigation, Home, Briefcase, Tag, Loader2, Trash2 } from 'lucide-react';

const labelIcons = { Home, Office: Briefcase, Other: Tag };

const CustomerAddress = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    houseNumber: '', street: '', landmark: '', pinCode: '', gpsLocation: '', label: 'Home' as 'Home' | 'Office' | 'Other',
  });

  const fetchAddresses = async () => {
    if (!customer?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.customer.getAddresses(customer.id);
      setAddresses(data.addresses || []);
      if (data.addresses?.length === 0) setShowForm(true);
    } catch (err) {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.id) return;
    if (!form.houseNumber || !form.street || !form.pinCode) return;

    setSaving(true);
    setError('');
    try {
      await api.customer.addAddress({
        userId: customer.id,
        ...form
      });
      await fetchAddresses();
      setShowForm(false);
      setForm({ houseNumber: '', street: '', landmark: '', pinCode: '', gpsLocation: '', label: 'Home' });
    } catch (err: any) {
      setError(err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!customer?.id) return;
    try {
      await api.customer.deleteAddress(customer.id, addressId);
      await fetchAddresses();
    } catch (err) {
      setError('Failed to delete address');
    }
  };

  const simulateGPS = () => {
    setForm({ ...form, gpsLocation: '12.9716, 77.5946' });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading addresses...</p>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Delivery Addresses</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage your saved addresses</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {/* Saved addresses */}
      {addresses.length > 0 && !showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {addresses.map((a: any) => {
            const Icon = (labelIcons as any)[a.label] || Home;
            return (
              <div key={a._id} className="kc-card-flat p-4 flex items-start gap-3 relative group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="font-heading font-bold text-foreground text-sm leading-tight">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {a.houseNumber}, {a.street}{a.landmark ? `, ${a.landmark}` : ''} - {a.pinCode}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a._id)}
                  className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!showForm ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowForm(true)}
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-5 h-5" /> Add New Address
          </button>
          {addresses.length > 0 && (
            <button onClick={() => navigate('/customer/stores')}
              className="flex-1 h-12 bg-white border border-input text-foreground rounded-xl text-sm font-bold hover:bg-muted transition-all">
              Continue Shopping
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="kc-card p-5 space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-bold text-lg">New Address</h3>
            {addresses.length > 0 && (
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">House / Flat No.*</label>
              <input type="text" value={form.houseNumber} onChange={e => setForm({ ...form, houseNumber: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. 42-B" required />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Street / Area *</label>
              <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="e.g. MG Road" required />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Landmark (Optional)</label>
            <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. Near bus stand" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Pin Code *</label>
              <input type="text" value={form.pinCode} onChange={e => setForm({ ...form, pinCode: e.target.value.replace(/\D/g, '') })}
                className="w-full h-11 px-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="560001" maxLength={6} required />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">GPS Location</label>
              <div className="flex gap-2">
                <button type="button" onClick={simulateGPS}
                  className="w-full h-11 bg-accent text-accent-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 border border-input">
                  <Navigation className="w-3.5 h-3.5" /> Detect
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Save As</label>
            <div className="flex gap-2">
              {(['Home', 'Office', 'Other'] as const).map(l => (
                <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold border transition-all ${form.label === l ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' : 'bg-white border-input text-muted-foreground hover:bg-muted'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            Save Address
          </button>
        </form>
      )}
    </div>
  );
};

export default CustomerAddress;

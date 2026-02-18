/**
 * Customer Address Setup Page
 * Allows saving multiple delivery addresses with labels (Home/Office/Other).
 * Addresses stored in localStorage and used during checkout.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerAddresses, addCustomerAddress, generateId, getCustomerProfile } from '@/lib/store';
import { MapPin, Plus, Navigation, Home, Briefcase, Tag } from 'lucide-react';

const labelIcons = { Home, Office: Briefcase, Other: Tag };

const CustomerAddress = () => {
  const navigate = useNavigate();
  const customer = getCustomerProfile();
  const [addresses, setAddresses] = useState(getCustomerAddresses());
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [form, setForm] = useState({
    houseNumber: '', street: '', landmark: '', pinCode: '', gpsLocation: '', label: 'Home' as 'Home' | 'Office' | 'Other',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.houseNumber || !form.street || !form.pinCode) return;
    const addr = {
      ...form,
      id: generateId(),
      customerId: customer?.id || 'guest',
    };
    addCustomerAddress(addr);
    setAddresses([...addresses, addr]);
    setShowForm(false);
    setForm({ houseNumber: '', street: '', landmark: '', pinCode: '', gpsLocation: '', label: 'Home' });
  };

  const simulateGPS = () => {
    setForm({ ...form, gpsLocation: '12.9716, 77.5946' });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-heading font-bold text-foreground mb-1">Delivery Addresses</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage your saved addresses</p>

      {/* Saved addresses */}
      {addresses.length > 0 && (
        <div className="space-y-2 mb-4">
          {addresses.map(a => {
            const Icon = labelIcons[a.label] || Home;
            return (
              <div key={a.id} className="kc-card-flat p-3 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.houseNumber}, {a.street}{a.landmark ? `, ${a.landmark}` : ''} - {a.pinCode}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!showForm ? (
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Address
          </button>
          {addresses.length > 0 && (
            <button onClick={() => navigate('/customer/stores')}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Continue Shopping
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="kc-card-flat p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">House / Flat Number *</label>
            <input type="text" value={form.houseNumber} onChange={e => setForm({ ...form, houseNumber: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 42-B" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Street / Area *</label>
            <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. MG Road" required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Landmark</label>
            <input type="text" value={form.landmark} onChange={e => setForm({ ...form, landmark: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Near bus stand" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Pin Code *</label>
            <input type="text" value={form.pinCode} onChange={e => setForm({ ...form, pinCode: e.target.value.replace(/\D/g, '') })}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="560001" maxLength={6} required />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">GPS Location</label>
            <div className="flex gap-2">
              <input type="text" value={form.gpsLocation} readOnly
                className="flex-1 px-3 py-2.5 rounded-lg border bg-muted text-foreground text-sm"
                placeholder="Click detect" />
              <button type="button" onClick={simulateGPS}
                className="px-3 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1">
                <Navigation className="w-3 h-3" /> Detect
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Save As</label>
            <div className="flex gap-2">
              {(['Home', 'Office', 'Other'] as const).map(l => (
                <button key={l} type="button" onClick={() => setForm({ ...form, label: l })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${form.label === l ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
              Save Address
            </button>
            {addresses.length > 0 && (
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 bg-muted text-muted-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default CustomerAddress;

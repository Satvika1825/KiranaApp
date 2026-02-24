import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile, saveCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { User, MapPin, ChevronRight, LogOut, Loader2, CheckCircle2, AlertCircle, Home, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const sessionUser = getCustomerProfile();
  const userId = sessionUser?.id || '';

  const [profile, setProfile] = useState<any>(null);
  const [addressCount, setAddressCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });

  const [apartments, setApartments] = useState<any[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [editingApartment, setEditingApartment] = useState(false);
  const [loadingApartments, setLoadingApartments] = useState(false);

  const fetchProfileData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [pRes, aRes, aptRes] = await Promise.all([
        api.customer.getProfile(userId),
        api.customer.getAddresses(userId),
        api.bulkOrders.getApartments()
      ]);
      if (pRes.customer) {
        setProfile(pRes.customer);
        setForm({
          name: pRes.customer.name || '',
          email: pRes.customer.email || ''
        });
        // Set apartment from profile
        if (pRes.customer.apartment) {
          setSelectedApartment(pRes.customer.apartment);
          setApartmentUnit(pRes.customer.apartmentUnit || '');
          // Store in localStorage for persistence
          localStorage.setItem('kc_apartment_id', pRes.customer.apartment._id);
          localStorage.setItem('kc_apartment_unit', pRes.customer.apartmentUnit || '');
        }
        // Fallback: check localStorage if not in profile
        else {
          const savedAptId = localStorage.getItem('kc_apartment_id');
          const savedAptUnit = localStorage.getItem('kc_apartment_unit');
          if (savedAptId && aptRes && Array.isArray(aptRes)) {
            const savedApt = aptRes.find((a: any) => a._id === savedAptId);
            if (savedApt) {
              setSelectedApartment(savedApt);
              setApartmentUnit(savedAptUnit || '');
            }
          }
        }
      }
      setAddressCount(aRes.addresses?.length || 0);
      setApartments(Array.isArray(aptRes) ? aptRes : []);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.customer.saveProfile({
        userId,
        mobile: profile?.mobile || sessionUser?.mobile || '',
        name: form.name,
        email: form.email
      });
      if (res.customer) {
        setProfile(res.customer);
        // Also update local session for display consistency
        saveCustomerProfile({
          ...sessionUser!,
          name: res.customer.name,
          email: res.customer.email
        });
      }
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApartment = async () => {
    if (!userId || !selectedApartment) {
      toast.error('Please select an apartment');
      return;
    }
    
    try {
      setSaving(true);
      const response = await api.bulkOrders.updateCustomerApartment(userId, selectedApartment._id, apartmentUnit);
      console.log('Apartment save response:', response);
      
      // Update profile locally with the apartment data
      const updatedProfile = {
        ...profile,
        apartment: selectedApartment,
        apartmentUnit,
        enrolledInBulkOrdering: true
      };
      setProfile(updatedProfile);
      
      // Store in localStorage for persistence across page refreshes
      localStorage.setItem('kc_apartment_id', selectedApartment._id);
      localStorage.setItem('kc_apartment_unit', apartmentUnit || '');
      
      toast.success(`✅ Apartment saved! ${selectedApartment.name}`);
      setEditingApartment(false);
    } catch (err) {
      console.error('Error saving apartment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save apartment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-base text-muted-foreground font-heading font-semibold">Loading profile...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-12 px-4 bg-gradient-to-b from-background to-secondary/20 min-h-screen py-6">
      <h2 className="text-3xl font-heading font-bold text-foreground mb-8">My Profile</h2>

      <div className="kc-card p-7 mb-6 border-2 border-secondary rounded-2xl">
        <div className="flex items-center gap-4 mb-7">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-3 border-primary/20 flex-shrink-0">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-2xl text-foreground">{profile?.name || sessionUser?.name || 'Guest User'}</p>
            <p className="text-base text-muted-foreground font-semibold mt-1 font-body">{profile?.mobile || sessionUser?.mobile || 'No mobile linked'}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-5 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border-2 border-secondary focus:border-primary bg-white text-base font-body outline-none transition-all" 
                placeholder="Enter your full name"/>
            </div>
            <div>
              <label className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Email Address (Optional)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border-2 border-secondary focus:border-primary bg-white text-base font-body outline-none transition-all"
                placeholder="For digital receipts" />
            </div>
            <div className="flex gap-3 pt-3">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-12 rounded-xl font-bold hover:shadow-lg transition-all text-base shadow-md shadow-primary/40 flex items-center justify-center disabled:opacity-50 font-heading">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="px-6 h-12 bg-secondary text-muted-foreground rounded-xl font-bold text-base hover:bg-secondary/80 transition-all border-2 border-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile?.email && (
              <div className="flex items-center justify-between py-3 border-b-2 border-secondary/40">
                <span className="text-base font-body text-muted-foreground font-semibold">Email</span>
                <span className="text-base font-heading font-bold text-foreground">{profile.email}</span>
              </div>
            )}
            <button onClick={() => setEditing(true)}
              className="w-full h-12 border-2 border-primary text-primary font-heading font-bold rounded-xl hover:bg-primary/10 transition-all text-base">
              Edit Account Details
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border-2 border-green-200 text-green-700 text-base flex items-center gap-3 animate-in fade-in duration-300 font-body font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/15 border-2 border-destructive/30 text-destructive text-base flex items-center gap-3 animate-in fade-in duration-300 font-body font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Apartment Selection */}
      <div className="kc-card p-6 mb-6 border-2 border-secondary rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6 text-purple-600" />
            <h3 className="font-heading font-bold text-lg text-foreground">Apartment Profile</h3>
          </div>
          {selectedApartment && !editingApartment && (
            <button
              onClick={() => setEditingApartment(true)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {editingApartment ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Select Your Apartment
              </label>
              <select
                value={selectedApartment?._id || ''}
                onChange={(e) => {
                  const apt = apartments.find(a => a._id === e.target.value);
                  setSelectedApartment(apt);
                }}
                className="w-full h-12 px-4 rounded-xl border-2 border-secondary focus:border-primary bg-white text-base font-body outline-none transition-all"
              >
                <option value="">Choose an apartment...</option>
                {apartments.map(apt => (
                  <option key={apt._id} value={apt._id}>
                    {apt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                Apartment Unit/Block (e.g., A-101)
              </label>
              <input
                type="text"
                value={apartmentUnit}
                onChange={e => setApartmentUnit(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border-2 border-secondary focus:border-primary bg-white text-base font-body outline-none transition-all"
                placeholder="e.g., A-101, Block B-202"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                onClick={handleSaveApartment}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-12 rounded-xl font-bold hover:shadow-lg transition-all text-base shadow-md shadow-primary/40 flex items-center justify-center disabled:opacity-50 font-heading"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Apartment'}
              </button>
              <button
                onClick={() => setEditingApartment(false)}
                disabled={saving}
                className="px-6 h-12 bg-secondary text-muted-foreground rounded-xl font-bold text-base hover:bg-secondary/80 transition-all border-2 border-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selectedApartment ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b-2 border-secondary/40">
              <span className="text-sm font-body text-muted-foreground font-semibold">Apartment</span>
              <span className="text-base font-heading font-bold text-foreground">{selectedApartment.name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b-2 border-secondary/40">
              <span className="text-sm font-body text-muted-foreground font-semibold">Unit Number</span>
              <span className="text-base font-heading font-bold text-foreground">{apartmentUnit || 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-body text-muted-foreground font-semibold">Location</span>
              <span className="text-base font-heading font-bold text-foreground">{selectedApartment.area}</span>
            </div>
            {selectedApartment.isActive && (
              <div className="mt-4 p-3 bg-green-50 border-2 border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Bulk ordering available for this apartment!</span>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setEditingApartment(true)}
            className="w-full h-12 border-2 border-primary text-primary font-heading font-bold rounded-xl hover:bg-primary/10 transition-all text-base"
          >
            Set Your Apartment
          </button>
        )}
      </div>

      {/* Addresses */}
      <button onClick={() => navigate('/customer/address')}
        className="kc-card p-6 w-full text-left flex items-center justify-between mb-6 group hover:border-primary/50 transition-all border-2 border-secondary rounded-2xl hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors border-2 border-blue-100">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-heading font-bold text-foreground text-lg">Saved Addresses</p>
            <p className="text-base text-muted-foreground font-body mt-1">{addressCount} location{addressCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </button>

      <button onClick={() => {
        localStorage.clear();
        navigate('/');
      }}
        className="w-full flex items-center justify-center gap-2 h-14 text-destructive bg-destructive/10 border-2 border-destructive/20 rounded-2xl font-heading font-bold text-base hover:bg-destructive/15 transition-all mt-8 shadow-sm">
        <LogOut className="w-5 h-5" /> Logout & Exit
      </button>

      <p className="text-center text-xs text-muted-foreground mt-10 font-body font-semibold uppercase tracking-widest opacity-50">
        KiranaConnect v2.0 · MongoDB Powered
      </p>
    </div>
  );
};

export default CustomerProfile;

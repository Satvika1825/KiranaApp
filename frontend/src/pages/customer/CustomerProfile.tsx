import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerProfile, saveCustomerProfile } from '@/lib/store';
import { api } from '@/lib/api';
import { User, MapPin, ChevronRight, LogOut, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const fetchProfileData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [pRes, aRes] = await Promise.all([
        api.customer.getProfile(userId),
        api.customer.getAddresses(userId)
      ]);
      if (pRes.customer) {
        setProfile(pRes.customer);
        setForm({
          name: pRes.customer.name || '',
          email: pRes.customer.email || ''
        });
      }
      setAddressCount(aRes.addresses?.length || 0);
    } catch (err) {
      setError('Failed to load profile');
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading profile...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-lg mx-auto pb-10">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">My Profile</h2>

      <div className="kc-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-heading font-bold text-xl text-foreground">{profile?.name || sessionUser?.name || 'Guest User'}</p>
            <p className="text-sm text-muted-foreground font-medium">{profile?.mobile || sessionUser?.mobile || 'No mobile linked'}</p>
          </div>
        </div>

        {editing ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary bg-background text-sm font-medium outline-none transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block px-1">Email Address (Optional)</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border-2 border-border focus:border-primary bg-background text-sm font-medium outline-none transition-all"
                placeholder="For digital receipts" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:opacity-95 transition-all text-sm shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(false)} disabled={saving}
                className="px-6 h-12 bg-muted text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {profile?.email && (
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-bold text-foreground">{profile.email}</span>
              </div>
            )}
            <button onClick={() => setEditing(true)}
              className="w-full h-12 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-all text-sm">
              Edit Account Details
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2 animate-in fade-in duration-300">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Addresses */}
      <button onClick={() => navigate('/customer/address')}
        className="kc-card p-5 w-full text-left flex items-center justify-between mb-4 group hover:border-primary/50 transition-all border-2 border-transparent">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">Saved Addresses</p>
            <p className="text-xs text-muted-foreground font-medium">{addressCount} active location{addressCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </button>

      <button onClick={() => {
        localStorage.clear();
        navigate('/');
      }}
        className="w-full flex items-center justify-center gap-2 h-14 text-destructive bg-destructive/5 border-2 border-destructive/10 rounded-2xl font-bold text-sm hover:bg-destructive/10 transition-all mt-6 shadow-sm">
        <LogOut className="w-5 h-5" /> Logout & Exit
      </button>

      <p className="text-center text-[10px] text-muted-foreground mt-8 font-medium uppercase tracking-widest opacity-40">
        KiranaConnect v2.0 · MongoDB Powered
      </p>
    </div>
  );
};

export default CustomerProfile;

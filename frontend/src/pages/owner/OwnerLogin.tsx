import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveOwnerProfile, getOwnerProfile, generateId } from '@/lib/store';
import { api } from '@/lib/api';
import { syncService } from '@/lib/sync';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const existing = getOwnerProfile();

  const [mode, setMode] = useState<'login' | 'register'>(existing ? 'login' : 'register');
  const [step, setStep] = useState<'form' | 'otp' | 'verified'>('form');
  const [form, setForm] = useState({ fullName: '', mobile: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');

  // Login state (mobile + password — no OTP)
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');

  // Step 1: Send OTP for registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.mobile) return;
    try {
      const data = await api.auth.sendOtp(form.mobile);
      if (data.otp) setServerOtp(data.otp);
      setStep('otp');
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      console.error(err);
    }
  };

  // Login with mobile + password directly (no OTP)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginMobile || !loginPassword) return;
    try {
      const mobile = loginMobile.replace(/\D/g, '');
      const data = await api.auth.loginOwner(mobile, loginPassword);
      if (data.token) localStorage.setItem('token', data.token);
      const newOwnerId = data.user?.id || generateId();

      // Clear stale shop/products if a different owner was stored before
      if (existing && existing.id !== newOwnerId) {
        localStorage.removeItem('kc_shop');
        localStorage.removeItem('kc_products');
        localStorage.removeItem('kc_orders');
        localStorage.removeItem('kc_owner_notifs');
      }

      saveOwnerProfile({
        id: newOwnerId,
        fullName: data.user?.fullName || data.user?.name || '',
        mobile,
        email: data.user?.email || '',
        password: ''
      });

      await syncService.syncOwnerData();
      setStep('verified');
      setTimeout(() => navigate('/owner/dashboard'), 1000);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  // Step 2: Verify OTP then register
  const handleVerifyOtp = async () => {
    if (otp.length < 4) return;
    setError('');

    try {
      const mobile = form.mobile.replace(/\D/g, '');
      const data = await api.auth.verifyOtp(mobile, otp, form.fullName, form.email, 'kirana_owner', form.password);
      if (data.token) localStorage.setItem('token', data.token);
      const newOwnerId = data.user?.id || generateId();

      // Clear stale shop/products if a different owner was stored before
      if (existing && existing.id !== newOwnerId) {
        localStorage.removeItem('kc_shop');
        localStorage.removeItem('kc_products');
        localStorage.removeItem('kc_orders');
        localStorage.removeItem('kc_owner_notifs');
      }

      saveOwnerProfile({
        id: newOwnerId,
        fullName: data.user?.name || form.fullName,
        mobile,
        email: data.user?.email || form.email,
        password: ''
      });

      await syncService.syncOwnerData();
      setStep('verified');
      setTimeout(() => navigate('/owner/shop-setup'), 1000);

    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <Store className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            {mode === 'register' ? 'Register Your Store' : 'Owner Login'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'register' ? 'Set up your kirana store account' : 'Welcome back!'}
          </p>
        </div>

        <div className="kc-card-flat p-6">
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* ---- REGISTER: Step 1 — Fill form ---- */}
          {step === 'form' && mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Rajesh Kumar"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number *</label>
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Email (optional)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">PIN / Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter 4-digit PIN"
                  maxLength={10}
                />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ---- LOGIN: Mobile + Password (no OTP) ---- */}
          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={loginMobile}
                  onChange={e => setLoginMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Password / PIN</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Login <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ---- OTP STEP (register only) ---- */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enter the OTP sent to <strong>{form.mobile}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-3 rounded-lg border bg-background text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="• • • •"
                maxLength={4}
              />
              {serverOtp && (
                <p className="text-xs text-muted-foreground font-semibold">Dev OTP: {serverOtp}</p>
              )}
              <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 4}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Verify OTP
              </button>
              <button
                onClick={() => { setStep('form'); setOtp(''); setError(''); }}
                className="text-sm text-muted-foreground underline"
              >
                Go back
              </button>
            </div>
          )}

          {step === 'verified' && (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <p className="font-heading font-bold text-foreground">Verified!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'register' ? (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setStep('form'); setError(''); }} className="text-primary font-semibold">Login</button>
            </>
          ) : (
            <>New here?{' '}
              <button onClick={() => { setMode('register'); setStep('form'); setError(''); }} className="text-primary font-semibold">Register</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;
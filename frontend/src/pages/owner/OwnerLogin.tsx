import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  saveOwnerProfile,
  getOwnerProfile,
  generateId
} from '@/lib/store';
import { api } from '@/lib/api';


const OwnerLogin = () => {
  const navigate = useNavigate();
  const existing = getOwnerProfile();

  const [mode, setMode] = useState<'login' | 'register'>(
    existing ? 'login' : 'register'
  );

  const [step, setStep] = useState<'form' | 'otp' | 'verified'>('form');

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
  });

  const [loginData, setLoginData] = useState({
    mobile: '',
    password: '',
  });

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  // ================= REGISTER =================

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile || !form.password) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const data = await api.auth.sendOtp(form.mobile);
      if (data.otp) console.log('Dev OTP:', data.otp);
      setError('');
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setError('Enter valid 4 digit OTP');
      return;
    }

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
        password: '' // Don't store plain password locally
      });


      setStep('verified');

      setTimeout(() => navigate('/owner/shop-setup'), 1000);

    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Verification failed. Please try again.');
    }
  };

  // ================= LOGIN =================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const mobile = loginData.mobile.replace(/\D/g, '');
    const password = loginData.password;

    if (!mobile || !password) {
      setError('Please enter mobile and password');
      return;
    }

    try {
      const data = await api.auth.loginOwner(mobile, password);
      if (data.token) localStorage.setItem('token', data.token);
      const newOwnerId = data.user?.id || generateId();

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


      setStep('verified');
      setTimeout(() => navigate('/owner/dashboard'), 1000);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <Store className="w-10 h-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">
            {mode === 'register' ? 'Register Store' : 'Owner Login'}
          </h1>
        </div>

        <div className="kc-card-flat p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          {/* ---- REGISTER: Step 1 — Fill form ---- */}
          {step === 'form' && mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />

              <input
                type="tel"
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                maxLength={10}
                required
              />

              <input
                type="email"
                placeholder="Email (Optional)"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
              />

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />

              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Continue <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
            </form>
          )}

          {/* ---- LOGIN: Mobile + Password (no OTP) ---- */}
          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Restored Mobile Login */}
              <input
                type="tel"
                placeholder="Mobile Number"
                value={loginData.mobile}
                onChange={e => setLoginData({ ...loginData, mobile: e.target.value.replace(/\D/g, '') })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                maxLength={10}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />

              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Login <ArrowRight className="inline w-4 h-4 ml-1" />
              </button>
            </form>
          )}

          {/* ---- OTP Verification (Register Only) ---- */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enter the OTP sent to <strong>{form.mobile}</strong>
              </p>

              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border px-3 py-3 text-center text-2xl tracking-widest rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-mono"
                placeholder="• • • •"
              />

              <button
                onClick={handleVerifyOtp}
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Verify & Create Account
              </button>

              <button
                onClick={() => setStep('form')}
                className="text-sm text-muted-foreground hover:underline"
              >
                Go back
              </button>
            </div>
          )}

          {/* ---- Verified Success State ---- */}
          {step === 'verified' && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 animate-bounce" />
              <p className="font-bold text-lg">Verified! Redirecting...</p>
            </div>
          )}
        </div>

        {/* Toggle between Login / Register */}
        <p className="text-center mt-4 text-sm text-muted-foreground">
          {mode === 'register' ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => { setMode('login'); setStep('form'); setError(''); }}
                className="text-primary font-semibold hover:underline"
              >
                Login here
              </button>
            </>
          ) : (
            <>
              New to KiranaApp?{' '}
              <button
                onClick={() => { setMode('register'); setStep('form'); setError(''); }}
                className="text-primary font-semibold hover:underline"
              >
                Register here
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;
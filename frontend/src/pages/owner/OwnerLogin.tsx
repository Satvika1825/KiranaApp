import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, CheckCircle2 } from 'lucide-react';
import {
  saveOwnerProfile,
  getOwnerProfile,
  generateId
} from '@/lib/store';

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
    email: '',
    password: '',
  });

  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');

  // Login state (mobile + password — no OTP)
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [error, setError] = useState('');

  // ================= REGISTER =================

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.mobile || !form.email || !form.password) {
      setError('Please fill all required fields');
      return;
    }

    setError('');
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      setError('Enter valid 4 digit OTP');
      return;
    }

    setStep('verified');

    setTimeout(() => {
      saveOwnerProfile({
        id: generateId(),
        ...form,
      });

      localStorage.setItem(
        'kc_session',
        JSON.stringify({ role: 'owner', email: form.email })
      );

      navigate('/owner/shop-setup');
    }, 1000);
  };

  // ================= LOGIN =================

  const handleLogin = (e: React.FormEvent) => {
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Store className="w-10 h-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">
            {mode === 'register' ? 'Register Store' : 'Owner Login'}
          </h1>
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
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <input
                type="text"
                placeholder="Full Name"
                value={form.fullName}
                onChange={e =>
                  setForm({ ...form, fullName: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              <input
                type="tel"
                placeholder="Mobile"
                value={form.mobile}
                onChange={e =>
                  setForm({ ...form, mobile: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              {/* ✅ ADDED EMAIL FIELD */}
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg"
              >
                Continue
              </button>
            </form>
          )}

          {/* LOGIN FORM */}
          {/* ---- LOGIN: Mobile + Password (no OTP) ---- */}
          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}

              {/* ✅ LOGIN WITH EMAIL */}
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={e =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={e =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className="w-full border px-3 py-2 rounded-lg"
              />

              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg"
              >
                Login
              </button>
            </form>
          )}

          {/* ---- OTP STEP (register only) ---- */}
          {/* OTP */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enter the OTP sent to <strong>{form.mobile}</strong>
              </p>
              <p>Enter any 4-digit OTP</p>

              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={e =>
                  setOtp(e.target.value.replace(/\D/g, ''))
                }
                className="w-full border px-3 py-3 text-center text-xl rounded-lg"
              />

              <button
                onClick={handleVerifyOtp}
                className="w-full bg-primary text-white py-2 rounded-lg"
              >
                Verify
              </button>
            </div>
          )}

          {/* VERIFIED */}
          {step === 'verified' && (
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-green-500" />
              <p>Verified! Redirecting...</p>
            </div>
          )}
        </div>

        {/* Toggle */}
        <p className="text-center mt-4 text-sm">
          {mode === 'register' ? (
            <>
              Already have account?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setStep('form');
                  setError('');
                }}
                className="text-primary font-semibold"
              >
                Login
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                onClick={() => {
                  setMode('register');
                  setStep('form');
                  setError('');
                }}
                className="text-primary font-semibold"
              >
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;
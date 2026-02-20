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

    const owner = getOwnerProfile();

    if (!owner) {
      setError('No account found. Please register.');
      return;
    }

    if (
      owner.email === loginData.email &&
      owner.password === loginData.password
    ) {
      localStorage.setItem(
        'kc_session',
        JSON.stringify({ role: 'owner', email: owner.email })
      );

      navigate('/owner/dashboard');
    } else {
      setError('Invalid email or password');
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

          {/* REGISTER FORM */}
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

          {/* OTP */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
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
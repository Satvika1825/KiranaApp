/**
 * Owner Registration + Login Page
 * Simulates OTP verification UI.
 * Saves owner profile to localStorage.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveOwnerProfile, getOwnerProfile, generateId } from '@/lib/store';

const OwnerLogin = () => {
  const navigate = useNavigate();
  const existing = getOwnerProfile();

  const [mode, setMode] = useState<'login' | 'register'>(existing ? 'login' : 'register');
  const [step, setStep] = useState<'form' | 'otp' | 'verified'>('form');
  const [form, setForm] = useState({ fullName: '', mobile: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loginMobile, setLoginMobile] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.mobile) return;
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) return;
    setStep('verified');
    setTimeout(() => {
      if (mode === 'register') {
        saveOwnerProfile({ id: generateId(), ...form });
        navigate('/owner/shop-setup');
      } else {
        navigate('/owner/dashboard');
      }
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginMobile) return;
    setStep('otp');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
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
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
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

          {step === 'form' && mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number</label>
                <input
                  type="tel"
                  value={loginMobile}
                  onChange={e => setLoginMobile(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210"
                  maxLength={10}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* OTP Verification Step */}
          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Enter the OTP sent to your mobile</p>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-3 rounded-lg border bg-background text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="• • • •"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">Hint: Enter any 4 digits</p>
              <button onClick={handleVerifyOtp} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Verify OTP
              </button>
            </div>
          )}

          {/* Verified */}
          {step === 'verified' && (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <p className="font-heading font-bold text-foreground">Verified!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>

        {/* Toggle mode */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === 'register' ? (
            <>Already have an account? <button onClick={() => { setMode('login'); setStep('form'); }} className="text-primary font-semibold">Login</button></>
          ) : (
            <>New here? <button onClick={() => { setMode('register'); setStep('form'); }} className="text-primary font-semibold">Register</button></>
          )}
        </p>
      </div>
    </div>
  );
};

export default OwnerLogin;

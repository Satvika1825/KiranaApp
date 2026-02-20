/**
 * Customer Login Page
 * OTP-based login with mobile number — connected to backend API.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveCustomerProfile, generateId } from '@/lib/store';
import { api } from '@/lib/api';
import { syncService } from '@/lib/sync';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'otp' | 'password'>('password'); // Default to password login
  const [step, setStep] = useState<'form' | 'otp' | 'verified'>('form');

  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mobile || !name || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const data = await api.auth.sendOtp(mobile);
      if (data.otp) setServerOtp(data.otp); // Dev mode: auto-fill OTP
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send OTP");
    }
  };

  const handleVerify = async () => {
    if (otp.length < 4) return;
    setError('');
    try {
      // Pass password to verifyOtp to update/set it
      const data = await api.auth.verifyOtp(mobile, serverOtp || otp, name, undefined, 'customer', password);

      const userId = data.user?._id || data.user?.id || generateId();
      saveCustomerProfile({ id: userId, mobile, name, email: data.user?.email || '' });

      // Also save profile to backend (though verifyOtp already does this mostly)
      // await api.customer.saveProfile({ userId, mobile, name }); // verifyOtp handles creation/update now

      // Trigger full sync
      await syncService.syncCustomerData();

      setStep('verified');
      setTimeout(() => navigate('/customer/home'), 1000);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!mobile || !password) {
      setError("Mobile and Password are required");
      return;
    }

    try {
      const data = await api.auth.loginCustomer(mobile, password);
      if (data.token) localStorage.setItem('token', data.token);

      const userId = data.user?.id || generateId();
      saveCustomerProfile({
        id: userId,
        mobile: data.user.mobile,
        name: data.user.name,
        email: data.user.email
      });

      await syncService.syncCustomerData();
      setStep('verified');
      setTimeout(() => navigate('/customer/home'), 1000);
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <ShoppingBag className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Customer Login</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'password' ? 'Login with your password' : 'Register or Login via OTP'}
          </p>
        </div>

        <div className="kc-card-flat p-6">
          {error && <div className="mb-4 p-2 text-sm text-destructive bg-destructive/10 rounded-md text-center">{error}</div>}

          {/* Toggle Modes */}
          {step === 'form' && (
            <div className="flex border rounded-lg overflow-hidden mb-6">
              <button
                onClick={() => { setMode('password'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'password' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                Password
              </button>
              <button
                onClick={() => { setMode('otp'); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === 'otp' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                OTP / Register
              </button>
            </div>
          )}

          {step === 'form' && mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210" maxLength={10} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="******" required />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Login <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'form' && mode === 'otp' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210" maxLength={10} required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Set Password (Optional)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Set a password for easier login" />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                Send OTP <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Enter the OTP sent to your mobile</p>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-3 rounded-lg border bg-background text-foreground text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="• • • •" maxLength={4} />
              {serverOtp && <p className="text-xs text-muted-foreground">Dev OTP: {serverOtp}</p>}
              <button onClick={handleVerify} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Verify OTP
              </button>
              <button onClick={() => setStep('form')} className="text-sm text-muted-foreground hover:underline">
                Back
              </button>
            </div>
          )}

          {step === 'verified' && (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <p className="font-heading font-bold text-foreground">Welcome!</p>
              <p className="text-sm text-muted-foreground">Redirecting to stores...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;

/**
 * Customer Login Page
 * Simulates OTP-based login with mobile number.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { saveCustomerProfile, generateId } from '@/lib/store';

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'otp' | 'verified'>('form');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile || !name) return;
    setStep('otp');
  };

  const handleVerify = () => {
    if (otp.length < 4) return;
    saveCustomerProfile({ id: generateId(), mobile, name });
    setStep('verified');
    setTimeout(() => navigate('/customer/home'), 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-3">
            <ShoppingBag className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Customer Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Enter your details to start shopping</p>
        </div>

        <div className="kc-card-flat p-6">
          {step === 'form' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Your Name *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name" required />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Mobile Number *</label>
                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9876543210" maxLength={10} required />
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
              <p className="text-xs text-muted-foreground">Hint: Enter any 4 digits</p>
              <button onClick={handleVerify} className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Verify OTP
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

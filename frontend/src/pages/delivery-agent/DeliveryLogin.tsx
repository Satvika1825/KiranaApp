import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

const DeliveryLogin = () => {
    const navigate = useNavigate();
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!mobile || !password) {
            setError('Please enter mobile and password');
            setLoading(false);
            return;
        }

        try {
            const data = await api.delivery.login(mobile, password);
            // Store token
            if (data.token) localStorage.setItem('token', data.token);
            // Store profile
            localStorage.setItem('kc_delivery_agent', JSON.stringify(data.user));

            navigate('/delivery/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />

            <div className="w-full max-w-md animate-fade-in relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-lg shadow-primary/5 mb-6 ring-1 ring-black/5">
                        <Truck className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Delivery Partner</h1>
                    <p className="text-slate-500 text-base">Welcome back! Login to check your specific deliveries.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-slate-50 border-slate-200 px-4 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                    maxLength={10}
                                    placeholder="98765 43210"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 px-4 py-3.5 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-medium text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 mt-4"
                        >
                            {loading ? (
                                <span className="opacity-80">Logging in...</span>
                            ) : (
                                <>
                                    <span>Login</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-400 text-sm mt-8">
                    KiranaConnect Delivery App
                </p>
            </div>
        </div>
    );
};

export default DeliveryLogin;

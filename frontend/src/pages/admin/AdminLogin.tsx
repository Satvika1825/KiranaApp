import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ADMIN_USERS = [
  {
    email: 'patnamsatvika@gmail.com',
    password: '1234',
    name: 'Satvika'
  },
  {
    email: 'sathwikayalla34@gmail.com', // fixed typo gmail
    password: '1234',
    name: 'SathwikaReddy'
  },
  {
    email: 'divijayellanki@gmail.com',
    password: '1234',
    name: 'Divija'
  }
];

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 Correct logic: check inside ADMIN_USERS
    const admin = ADMIN_USERS.find(
      user => user.email === email && user.password === password
    );

    if (admin) {
      localStorage.setItem(
        'kc_session',
        JSON.stringify({
          role: 'admin',
          email: admin.email,
          name: admin.name
        })
      );

      navigate('/admin/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            KiranaConnect Administration
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter admin email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>

            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/25"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Only registered admin emails can login
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;

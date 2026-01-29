import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from './AuthLayout';
import { supabase } from '../../services/supabase';

interface LoginPageProps {
  onLogin: (email: string) => void;
  onNavigate: (page: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [method, setMethod] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    // Pre-fill with common admin credentials for dev ease if current values are empty
    if (!email && !password) {
      setEmail('miguelkwan56@gmail.com');
      setPassword('11223344!');
    }
  }, []);
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (method === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });
        if (error) throw error;
        setMagicSent(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Wait a moment for auth state change to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
        onLogin(email);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <AuthLayout title="Check Inbox" subtitle="Magic Link Sent">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-bgMain rounded-full border border-borderColor flex items-center justify-center mx-auto mb-6 text-green-500">
            <iconify-icon icon="solar:letter-linear" width="32"></iconify-icon>
          </div>
          <p className="text-textMuted text-sm font-medium leading-relaxed mb-8">
            We've sent a temporary login link to <span className="text-textMain font-bold">{email}</span>. Please check your email to access your account.
          </p>
          <button
            onClick={() => setMagicSent(false)}
            className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted hover:text-textMain transition-colors flex items-center justify-center gap-2"
          >
            <iconify-icon icon="solar:arrow-left-linear" width="14"></iconify-icon>
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Client Login" subtitle="Access Global Logistics">
      {/* Tabs */}
      <div className="flex border-b border-borderColor mb-8">
        <button
          onClick={() => setMethod('password')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${method === 'password' ? 'text-red-600' : 'text-textMuted hover:text-textMain'}`}
        >
          Password
          {method === 'password' && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600" />}
        </button>
        <button
          onClick={() => setMethod('magic')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${method === 'magic' ? 'text-red-600' : 'text-textMuted hover:text-textMain'}`}
        >
          Magic Link
          {method === 'magic' && <motion.div layoutId="auth-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600" />}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-600/10 border border-red-600/20 rounded text-[10px] text-red-500 font-bold text-center uppercase tracking-wider"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:user-circle-linear" width="16"></iconify-icon>
            </div>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bgMain border border-borderColor rounded-sm pl-10 pr-4 py-3.5 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain placeholder:text-textMuted/30"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {method === 'password' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Password</label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-[9px] font-bold text-red-600 uppercase tracking-wider hover:text-red-500"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
                  <iconify-icon icon="solar:lock-keyhole-linear" width="16"></iconify-icon>
                </div>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bgMain border border-borderColor rounded-sm pl-10 pr-12 py-3.5 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain placeholder:text-textMuted/30"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted hover:text-textMain transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <iconify-icon icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="18"></iconify-icon>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          disabled={loading}
          className="w-full py-4 bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <iconify-icon icon="solar:refresh-linear" width="16" class="animate-spin"></iconify-icon>
          ) : (
            <iconify-icon icon={method === 'magic' ? "solar:magic-stick-3-linear" : "solar:login-2-linear"} width="16"></iconify-icon>
          )}
          {loading ? 'Processing...' : method === 'magic' ? 'Send Magic Link' : 'Secure Login'}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-borderColor/50">
        <p className="text-[10px] text-textMuted uppercase tracking-wider font-bold">
          New Customer?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-textMain hover:text-red-600 transition-colors"
          >
            Create Account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
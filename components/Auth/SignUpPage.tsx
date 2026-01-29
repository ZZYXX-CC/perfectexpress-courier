import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { supabase } from '../../services/supabase';

interface SignUpPageProps {
  onNavigate: (page: string) => void;
  onLogin: (email: string) => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate, onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
          }
        }
      });
      if (error) throw error;
      onLogin(formData.email);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Register" subtitle="Join The Network">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:user-id-linear" width="16"></iconify-icon>
            </div>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-bgMain border border-borderColor rounded-sm pl-10 pr-4 py-3.5 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain placeholder:text-textMuted/30"
              placeholder="COMPANY OR NAME"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:mention-circle-linear" width="16"></iconify-icon>
            </div>
            <input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-bgMain border border-borderColor rounded-sm pl-10 pr-4 py-3.5 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain placeholder:text-textMuted/30"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:lock-password-linear" width="16"></iconify-icon>
            </div>
            <input
              required
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
        </div>

        <div className="flex items-start gap-3 py-2">
          <div className="mt-1">
            <input type="checkbox" required className="accent-red-600 bg-bgMain border-borderColor" />
          </div>
          <p className="text-[9px] text-textMuted font-medium leading-relaxed">
            I agree to the <a href="#" className="text-textMain hover:underline">Terms of Service</a> and <a href="#" className="text-textMain hover:underline">Privacy Policy</a>.
          </p>
        </div>

        <button
          disabled={loading}
          className="w-full py-4 bg-white text-black hover:bg-neutral-200 disabled:opacity-70 disabled:cursor-not-allowed rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-borderColor/50">
        <p className="text-[10px] text-textMuted uppercase tracking-wider font-bold">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-textMain hover:text-red-600 transition-colors"
          >
            Sign In
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;
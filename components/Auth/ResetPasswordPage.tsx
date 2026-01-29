import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { supabase } from '../../services/supabase';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid session (from the email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError('Invalid or expired reset link. Please request a new password reset.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Success">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-bgMain rounded-full border border-borderColor flex items-center justify-center mx-auto mb-6 text-green-500">
            <iconify-icon icon="solar:shield-check-linear" width="32"></iconify-icon>
          </div>
          <p className="text-textMuted text-sm font-medium leading-relaxed mb-8">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Account Recovery">
      <p className="text-textMuted text-xs font-medium leading-relaxed mb-8 border-l-2 border-red-600 pl-4">
        Enter your new password below. Make sure it's at least 6 characters long.
      </p>

      {error && (
        <div className="p-3 bg-red-600/10 border border-red-600/20 rounded text-[10px] text-red-500 font-bold text-center uppercase tracking-wider mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:lock-password-linear" width="16"></iconify-icon>
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
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-textMuted/80 uppercase tracking-widest">Confirm New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-textMuted">
              <iconify-icon icon="solar:lock-keyhole-linear" width="16"></iconify-icon>
            </div>
            <input
              required
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bgMain border border-borderColor rounded-sm pl-10 pr-12 py-3.5 focus:border-textMuted outline-none transition-all text-xs font-bold uppercase tracking-widest text-textMain placeholder:text-textMuted/30"
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-textMuted hover:text-textMain transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <iconify-icon icon={showConfirmPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} width="18"></iconify-icon>
            </button>
          </div>
        </div>

        <button
          disabled={loading}
          className="w-full py-4 bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-sm font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <iconify-icon icon="solar:refresh-linear" width="16" class="animate-spin"></iconify-icon>
              Resetting Password...
            </>
          ) : (
            <>
              <iconify-icon icon="solar:shield-check-linear" width="16"></iconify-icon>
              Reset Password
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-borderColor/50">
        <button
          onClick={() => navigate('/login')}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted hover:text-textMain transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <iconify-icon icon="solar:arrow-left-linear" width="14"></iconify-icon>
          Back to Login
        </button>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;

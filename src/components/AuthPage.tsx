/**
 * Authentication Page - Premium Edition
 * 
 * Glass morphism, gradients, and premium textures.
 * White & Blue color palette.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode?: AuthMode;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode: initialMode = 'login' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signIn, signUp, error, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Clear errors when mode changes
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [mode, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email || !password) {
      setLocalError('请填写所有必填项');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('两次输入的密码不一致');
        return;
      }

      if (password.length < 6) {
        setLocalError('密码长度至少为6位');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName || undefined);
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  const displayError = localError || error;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary-300/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-100/30 via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/25 mb-4 transform hover:scale-105 transition-transform duration-300">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t('auth.title', { defaultValue: 'ESS Financial' })}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {mode === 'login'
              ? t('auth.loginSubtitle', { defaultValue: '登录您的账户' })
              : t('auth.registerSubtitle', { defaultValue: '创建新账户' })}
          </p>
        </div>

        {/* Auth Card with Glass Effect */}
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/5 border border-white/60 p-6 overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-300/50 to-transparent" />

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-3 bg-error-50/90 border border-error-200/80 rounded-xl flex items-center gap-2 backdrop-blur-sm">
              <svg className="w-4 h-4 text-error-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-error-700">{displayError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {/* Display Name (register only) */}
            {mode === 'register' && (
              <div className="group">
                <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('auth.displayName', { defaultValue: '显示名称' })}
                </label>
                <div className="relative">
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/60 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                    placeholder={t('auth.displayNamePlaceholder', { defaultValue: '请输入您的名称' })}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-focus-within:from-primary-500/5 group-focus-within:via-primary-500/10 group-focus-within:to-primary-500/5 pointer-events-none transition-all duration-300" />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.email', { defaultValue: '邮箱' })}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white/60 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                  placeholder={t('auth.emailPlaceholder', { defaultValue: '请输入邮箱' })}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-focus-within:from-primary-500/5 group-focus-within:via-primary-500/10 group-focus-within:to-primary-500/5 pointer-events-none transition-all duration-300" />
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                {t('auth.password', { defaultValue: '密码' })}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 bg-white/60 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                  placeholder={t('auth.passwordPlaceholder', { defaultValue: '请输入密码' })}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-focus-within:from-primary-500/5 group-focus-within:via-primary-500/10 group-focus-within:to-primary-500/5 pointer-events-none transition-all duration-300" />
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-1.5">
                  {t('auth.confirmPassword', { defaultValue: '确认密码' })}
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 bg-white/60 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200"
                    placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: '请再次输入密码' })}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/0 group-focus-within:from-primary-500/5 group-focus-within:via-primary-500/10 group-focus-within:to-primary-500/5 pointer-events-none transition-all duration-300" />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 relative overflow-hidden group ${
                submitting
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5'
              }`}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">
                {submitting
                  ? t('auth.submitting', { defaultValue: '提交中...' })
                  : mode === 'login'
                  ? t('auth.signIn', { defaultValue: '登录' })
                  : t('auth.signUp', { defaultValue: '注册' })}
              </span>
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center relative">
            <p className="text-sm text-neutral-500">
              {mode === 'login'
                ? t('auth.noAccount', { defaultValue: '还没有账户？' })
                : t('auth.hasAccount', { defaultValue: '已有账户？' })}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-1 text-primary-600 hover:text-primary-700 font-medium hover:underline underline-offset-2 transition-all"
              >
                {mode === 'login'
                  ? t('auth.signUp', { defaultValue: '立即注册' })
                  : t('auth.signIn', { defaultValue: '立即登录' })}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-400">
            {t('auth.footerText', { defaultValue: '继续使用即表示您同意我们的服务条款和隐私政策' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

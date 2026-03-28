/**
 * Authentication Page
 *
 * Handles user login and registration.
 * Switches between login and registration modes.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * Auth mode type
 */
type AuthMode = 'login' | 'register';

/**
 * AuthPage Props
 */
interface AuthPageProps {
  mode?: AuthMode;
}

/**
 * AuthPage Component
 */
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

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validate inputs
    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
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
      // Navigation will be handled by the useEffect above
    } catch (err) {
      // Error is already set in context
      console.error('Auth error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Toggle between login and register
   */
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  /**
   * Display error message
   */
  const displayError = localError || error;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t('auth.title', { defaultValue: 'ESS Financial' })}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login'
              ? t('auth.loginSubtitle', { defaultValue: 'Sign in to your account' })
              : t('auth.registerSubtitle', { defaultValue: 'Create a new account' })}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">{displayError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Display Name (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.displayName', { defaultValue: 'Display Name' })}
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder={t('auth.displayNamePlaceholder', { defaultValue: 'Enter your name' })}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.email', { defaultValue: 'Email' })}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder={t('auth.emailPlaceholder', { defaultValue: 'Enter your email' })}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password', { defaultValue: 'Password' })}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder={t('auth.passwordPlaceholder', { defaultValue: 'Enter your password' })}
              />
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.confirmPassword', { defaultValue: 'Confirm Password' })}
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: 'Confirm your password' })}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting
                ? t('auth.submitting', { defaultValue: 'Submitting...' })
                : mode === 'login'
                ? t('auth.signIn', { defaultValue: 'Sign In' })
                : t('auth.signUp', { defaultValue: 'Create Account' })}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login'
                ? t('auth.noAccount', { defaultValue: "Don't have an account?" })
                : t('auth.hasAccount', { defaultValue: 'Already have an account?' })}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
              >
                {mode === 'login'
                  ? t('auth.signUp', { defaultValue: 'Sign Up' })
                  : t('auth.signIn', { defaultValue: 'Sign In' })}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('auth.footerText', { defaultValue: 'By continuing, you agree to our Terms of Service and Privacy Policy.' })}</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

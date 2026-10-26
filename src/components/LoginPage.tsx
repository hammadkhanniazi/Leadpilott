import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginPage: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'reset' | 'request'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Financial Advisory');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const result = await loginWithEmail(email, password);
    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Failed to authenticate. Please check your credentials.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email) {
      setErrorMessage('Please enter your firm email address.');
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(email);
    setIsLoading(false);
    if (result.success) {
      setSuccessMessage('Password reset instructions have been sent to your email.');
    } else {
      setErrorMessage(result.error || 'Could not send password reset email.');
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    const result = await registerWithEmail(name, email, password, title, department);
    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Registration request failed.');
    } else {
      setSuccessMessage('Access request submitted successfully! Your account is queued in the administrator pending review roster.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface sm:py-12">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Practice Branding Header */}
        <div className="p-6 pb-5 text-center bg-surface-container-low/60 border-b border-surface-container">
          <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="material-symbols-outlined text-[26px]">account_balance</span>
          </div>
          <h1 className="text-xl font-bold text-on-surface tracking-tight">LeadPilot Financial CRM</h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Secure Administrator-Controlled Practice Workspace
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed/60 text-primary text-[11px] font-bold mt-2.5">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            <span>Invite-Only & Admin Approval Required</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-surface-container bg-surface-container-low text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-all ${
              mode === 'signin'
                ? 'border-b-2 border-primary text-primary font-bold bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('request');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-center transition-all ${
              mode === 'request'
                ? 'border-b-2 border-primary text-primary font-bold bg-surface-container-lowest'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Request Access
          </button>
        </div>

        {/* Notification / Error alerts */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-xs text-error">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-tertiary-fixed/60 border border-tertiary/20 flex items-start gap-2.5 text-xs text-on-tertiary-fixed">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-tertiary">check_circle</span>
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Team Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="advisor@leadpilot.co"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-on-surface-variant">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                    key
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Sign In to CRM</span>
                  </>
                )}
              </button>

            </form>
          )}

          {/* PASSWORD RESET FORM */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant leading-relaxed">
                Enter your firm email address below. If an account is associated with your email, you will receive password reset instructions.
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Firm Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="advisor@leadpilot.co"
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="flex-1 h-10 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* REQUEST ACCESS / REGISTRATION SUBMISSION */}
          {mode === 'request' && (
            <form onSubmit={handleRequestAccess} className="space-y-3">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Notice:</strong> Registering creates an account in a <strong className="text-primary font-bold">Pending Approval</strong> state. The practice administrator must explicitly review and authorize your account before CRM data can be accessed.
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Firm Email <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@leadpilot.co"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Password <span className="text-error">*</span> (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a secure password"
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. CPA Strategist"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Tax & Advisory"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Submit Access Request</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Notice Footer */}
          <div className="pt-3 border-t border-surface-container flex items-center gap-2 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-[16px]">verified_user</span>
            <span>Protected by Firebase Auth & Firestore Zero-Trust Security.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

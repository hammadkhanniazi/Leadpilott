import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { UserAvatar } from './UserAvatar';

export const AuthPortalModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    users,
    loginWithEmail,
    registerWithEmail,
    currentUser,
    switchUser,
    showToast,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('advisor');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Financial Advisory');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    const res = await loginWithEmail(email, password);
    setIsLoading(false);
    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      showToast(res.error || 'Failed to sign in');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setIsLoading(true);
    const res = await registerWithEmail(name, email, password, title, department);
    setIsLoading(false);
    if (res.success) {
      showToast('Registration submitted! Access requires administrator approval.');
      setIsAuthModalOpen(false);
    } else {
      showToast(res.error || 'Failed to register account');
    }
  };

  if (!isAuthModalOpen) return null;

  return (
    <div
      aria-labelledby="authPortalTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
    >
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface" id="authPortalTitle">
                Team Access Portal
              </h2>
              <p className="text-xs text-on-surface-variant">
                Real-time multi-user synchronization
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-surface-container bg-surface-container-low px-6">
          <button
            onClick={() => setMode('signin')}
            className={`py-3 text-xs font-semibold flex-1 text-center transition-all ${
              mode === 'signin'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Sign In to Practice
          </button>
          <button
            onClick={() => setMode('register')}
            className={`py-3 text-xs font-semibold flex-1 text-center transition-all ${
              mode === 'register'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Create Team Account
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Team Email Address
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest outline-none"
                  placeholder="e.g. sarah.jenkins@leadpilot.co"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Password
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest outline-none"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                Sign In to Workspace
              </button>

              {/* Registered Team Switcher */}
              {users.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Registered Team Accounts:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setIsAuthModalOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                          currentUser && u.id === currentUser.id
                            ? 'border-primary bg-primary-fixed text-primary font-bold'
                            : 'border-surface-container hover:bg-surface-container-low text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <UserAvatar name={u.name} avatarUrl={u.avatar} size="xs" />
                          <div>
                            <div className="font-semibold leading-tight">{u.name}</div>
                            <div className="text-[10px] text-on-surface-variant">{u.title} • {u.email}</div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-container">
                          {u.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                  placeholder="e.g. Rachel Adams"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Firm Email <span className="text-error">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                  placeholder="e.g. rachel@leadpilot.co"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Role & Permissions
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 outline-none"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                  >
                    <option value="advisor">Advisor (Standard)</option>
                    <option value="admin">Admin / Partner</option>
                    <option value="associate">Associate (Intake)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Department
                  </label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 outline-none"
                    placeholder="e.g. Corporate Tax"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Professional Title
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40 outline-none"
                  placeholder="e.g. CPA & Senior Tax Strategist"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-[11px] text-on-surface-variant">
                <span className="font-bold text-on-surface">Role Notice:</span>{' '}
                {role === 'admin'
                  ? 'Full administrative control over leads, KPI reports, and team management.'
                  : role === 'advisor'
                  ? 'Access to manage assigned leads, log notes, and schedule client follow-ups.'
                  : 'Limited intake access for logging leads and notes.'}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-[0.98] transition-all"
              >
                Create Account & Join Practice
              </button>
            </form>
          )}

          {/* Sync Information */}
          <div className="pt-2 border-t border-surface-container flex items-center gap-2 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-[16px]">sync</span>
            <span>Real-time cloud database across all computers and devices.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

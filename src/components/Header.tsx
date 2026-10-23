import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserAvatar } from './UserAvatar';

export const Header: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    activeTab,
    unreadNotificationsCount,
    setIsNotificationsOpen,
    setIsAuthModalOpen,
    isLiveSynced,
    setActiveTab,
    logout,
    uploadProfilePhoto,
    showToast,
  } = useApp();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, or WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        await uploadProfilePhoto(base64);
      }
    };
    reader.readAsDataURL(file);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const getSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'leads': return 'Leads';
      case 'follow-ups': return 'Follow Ups';
      case 'reports': return 'KPI Analytics';
      case 'team': return 'Team & RBAC';
      default: return 'Practice Suite';
    }
  };

  return (
    <header className="fixed top-0 w-full z-40 pt-safe bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container/60">
      <div className="h-16 px-gutter max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm">
            <span className="material-symbols-outlined text-[20px]">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base text-on-surface tracking-tight leading-none">
              LeadPilot
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-on-surface-variant font-medium">
                {getSubtitle()}
              </span>
              <span className="inline-block w-1 h-1 rounded-full bg-outline-variant"></span>
              {/* Real-time multi-device sync indicator */}
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${isLiveSynced ? 'text-tertiary' : 'text-error'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLiveSynced ? 'bg-tertiary animate-pulse' : 'bg-error'}`}></span>
                {isLiveSynced ? 'Real-time Sync' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-space-xs">
          {/* Quick tab shortcuts for desktop */}
          <div className="hidden md:flex items-center gap-1 mr-2 bg-surface-container-low p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'leads' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Leads
            </button>
            <button
              onClick={() => setActiveTab('follow-ups')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'follow-ups' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Follow-ups
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reports' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'team' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Team & RBAC
            </button>
          </div>

          {/* Automated Email Notifications Bell */}
          <button
            aria-label="Notifications"
            onClick={() => setIsNotificationsOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container-low"
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile & Role Selector Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <button
              aria-label="Profile and team switcher"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer"
              type="button"
            >
              <div className="relative">
                <UserAvatar
                  name={currentUser.name}
                  avatarUrl={currentUser.avatar}
                  size="sm"
                  className="ring-2 ring-primary/20"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-surface-container-lowest ${
                    currentUser.role === 'admin'
                      ? 'bg-primary'
                      : currentUser.role === 'advisor'
                      ? 'bg-tertiary'
                      : 'bg-secondary'
                  }`}
                  title={`Role: ${currentUser.role}`}
                ></span>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-surface-container-lowest shadow-xl border border-surface-container p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Active user header */}
                <div className="p-3 bg-surface-container-low rounded-xl mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => avatarInputRef.current?.click()}
                      title="Click to upload profile photo"
                    >
                      <UserAvatar
                        name={currentUser.name}
                        avatarUrl={currentUser.avatar}
                        size="md"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[16px] text-white">photo_camera</span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-on-surface truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">
                        {currentUser.email}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            currentUser.role === 'admin'
                              ? 'bg-primary text-on-primary'
                              : currentUser.role === 'advisor'
                              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                              : 'bg-secondary-container text-on-secondary-container'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                        <span className="text-[11px] text-outline font-medium">
                          {currentUser.title}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="mt-2.5 w-full py-1 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">upload</span>
                    <span>Upload Profile Photo</span>
                  </button>
                </div>

                {/* Team Switcher for testing multi-user roles */}
                <div className="px-2 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Switch Active Account
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsProfileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        u.id === currentUser.id
                          ? 'bg-surface-container text-primary font-semibold'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar
                          name={u.name}
                          avatarUrl={u.avatar}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{u.name}</div>
                          <div className="text-[10px] text-on-surface-variant truncate">
                            {u.role.toUpperCase()} • {u.department}
                          </div>
                        </div>
                      </div>
                      {u.id === currentUser.id && (
                        <span className="material-symbols-outlined text-[16px] text-primary">
                          check
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="border-t border-surface-container my-2"></div>

                {/* Navigation and Login portal triggers */}
                <button
                  onClick={() => {
                    setActiveTab('team');
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    admin_panel_settings
                  </span>
                  <span>Manage Team & Access Roles</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition-colors mt-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    logout
                  </span>
                  <span>Sign Out of Practice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

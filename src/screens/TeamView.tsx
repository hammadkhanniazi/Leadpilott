import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole, UserApprovalStatus } from '../types';
import { UserAvatar } from '../components/UserAvatar';

export const TeamView: React.FC = () => {
  const {
    users,
    currentUser,
    switchUser,
    updateUserRole,
    updateUserStatus,
    inviteUser,
    canManageTeam,
    showToast,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'denied' | 'revoked'>('all');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('advisor');
  const [inviteTitle, setInviteTitle] = useState('Financial Advisor');
  const [inviteDept, setInviteDept] = useState('Client Strategy');
  const [isInviting, setIsInviting] = useState(false);

  // Revocation confirmation modal state
  const [userToRevoke, setUserToRevoke] = useState<User | null>(null);
  const [revokeActionType, setRevokeActionType] = useState<'revoked' | 'disabled'>('revoked');
  const [isRevoking, setIsRevoking] = useState(false);

  // Automated notification settings
  const [notifLeadAssigned, setNotifLeadAssigned] = useState(true);
  const [notifFollowupDue, setNotifFollowupDue] = useState(true);
  const [notifConverted, setNotifConverted] = useState(true);
  const [notifHighValue, setNotifHighValue] = useState(true);

  const pendingUsers = users.filter((u) => u.approvalStatus === 'pending');
  const pendingCount = pendingUsers.length;
  const approvedCount = users.filter((u) => u.approvalStatus === 'approved').length;
  const deniedCount = users.filter((u) => u.approvalStatus === 'denied').length;
  const revokedCount = users.filter((u) => u.approvalStatus === 'revoked' || u.approvalStatus === 'disabled').length;

  const filteredUsers = users.filter((u) => {
    if (activeFilter === 'pending') return u.approvalStatus === 'pending';
    if (activeFilter === 'approved') return u.approvalStatus === 'approved';
    if (activeFilter === 'denied') return u.approvalStatus === 'denied';
    if (activeFilter === 'revoked') return u.approvalStatus === 'revoked' || u.approvalStatus === 'disabled';
    return true;
  });

  const handleApprove = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      await updateUserStatus(userId, 'approved');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeny = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      await updateUserStatus(userId, 'denied');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    setIsInviting(true);
    const success = await inviteUser(inviteName, inviteEmail, inviteRole, inviteTitle, inviteDept);
    setIsInviting(false);
    if (success) {
      setInviteName('');
      setInviteEmail('');
    }
  };

  const getStatusBadge = (status: UserApprovalStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-tertiary-fixed text-on-tertiary-fixed">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Pending Review</span>
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/15 text-error">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            <span>Request Denied</span>
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-error/15 text-error">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
            <span>Access Revoked</span>
          </span>
        );
      case 'disabled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            <span>Disabled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-gutter pb-space-xl space-y-space-lg">
      {/* Header */}
      <div className="flex items-center justify-between pt-space-xs flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Administrator User Management & RBAC Security
          </h1>
          <p className="text-xs text-on-surface-variant">
            Authorize team access, manage role permissions, and review account registration requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-container text-on-surface">
            Admin: <strong className="text-primary font-bold">{canManageTeam() ? 'Authorized' : 'Read-Only'}</strong>
          </span>
        </div>
      </div>

      {/* Pending Approval Urgent Alert Banner */}
      {pendingCount > 0 && canManageTeam() && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_alert</span>
            </div>
            <div>
              <div className="text-xs font-bold text-amber-800">
                {pendingCount} Account Registration {pendingCount === 1 ? 'Request' : 'Requests'} Pending Approval
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                New team accounts remain blocked until you explicitly authorize their workspace access.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveFilter('pending')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
            type="button"
          >
            Review Pending Users ({pendingCount})
          </button>
        </div>
      )}

      {/* Security Architecture Notice */}
      <div className="p-4 rounded-xl bg-primary-fixed/40 border border-primary/20 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">security</span>
        </div>
        <div className="text-xs text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">Administrator-Controlled Invite-Only Access:</strong> All CRM records, leads, and analytics are guarded by server-side Firestore security rules. Authenticated users who are unapproved or revoked are blocked from accessing company data.
        </div>
      </div>

      {/* Dedicated Pending Access Requests Section */}
      {canManageTeam() && (
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">pending_actions</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">
                  Pending Access Requests ({pendingUsers.length})
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Review and authorize team member registration requests in real time
                </p>
              </div>
            </div>
            {pendingUsers.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>Requires Review</span>
              </span>
            )}
          </div>

          {pendingUsers.length === 0 ? (
            <div className="py-6 px-4 rounded-xl bg-surface-container-low/50 border border-dashed border-outline-variant/40 text-center space-y-1">
              <span className="material-symbols-outlined text-outline text-[26px]">verified_user</span>
              <div className="text-xs font-semibold text-on-surface">No pending access requests</div>
              <div className="text-[11px] text-on-surface-variant">
                When new users register with email and password, their requests will appear here automatically via live Firestore synchronization.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-surface-container">
              {pendingUsers.map((member) => {
                const isProcessing = processingUserId === member.id;
                const requestDateFormatted = member.createdAt
                  ? new Date(member.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <div
                    key={member.id}
                    className="py-3.5 flex items-center justify-between flex-wrap gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar name={member.name} avatarUrl={member.avatar} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-on-surface truncate">{member.name}</span>
                          {getStatusBadge(member.approvalStatus)}
                        </div>
                        <div className="text-xs text-on-surface-variant truncate">{member.email}</div>
                        <div className="text-[11px] text-outline mt-0.5">
                          Requested: <strong className="text-on-surface-variant">{requestDateFormatted}</strong> • {member.title} • {member.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        disabled={isProcessing}
                        className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface border border-outline-variant/40 outline-none disabled:opacity-60"
                        value={member.role}
                        onChange={(e) => updateUserRole(member.id, e.target.value as UserRole)}
                        title="Set role prior to approval"
                      >
                        <option value="advisor">Financial Advisor</option>
                        <option value="associate">Practice Associate</option>
                        <option value="admin">Admin / Partner</option>
                      </select>

                      <button
                        onClick={() => handleApprove(member.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>{isProcessing ? 'Updating...' : 'Approve'}</span>
                      </button>

                      <button
                        onClick={() => handleDeny(member.id)}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white text-xs font-bold transition-all border border-error/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        <span>{isProcessing ? 'Updating...' : 'Deny'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Role-Based Access Control Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider">
              Admin / Partner
            </span>
            <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
          </div>
          <h4 className="text-xs font-bold text-on-surface">Executive Control</h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Full permissions to approve/revoke users, assign roles, delete client records, and access financial ARR reporting.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold uppercase tracking-wider">
              Financial Advisor
            </span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">engineering</span>
          </div>
          <h4 className="text-xs font-bold text-on-surface">Practice Delivery</h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Manage assigned pipeline, create/edit leads, record timeline notes, schedule client follow-ups, and export data.
          </p>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container/60 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider">
              Practice Associate
            </span>
            <span className="material-symbols-outlined text-[18px] text-secondary">support_agent</span>
          </div>
          <h4 className="text-xs font-bold text-on-surface">Intake & Support</h4>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            View shared lead registry, record intake telephone notes, enter initial prospect details, and track tasks.
          </p>
        </div>
      </div>

      {/* Team Roster & Admin Approval Table */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Team Access Directory ({users.length})</h3>
            <p className="text-xs text-on-surface-variant">Approve registration requests, revoke access, or alter roles</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'approved'
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setActiveFilter('denied')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeFilter === 'denied'
                  ? 'bg-surface-container-lowest text-error shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              <span>Denied</span>
              {deniedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-error/15 text-error text-[10px] flex items-center justify-center font-bold">
                  {deniedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('revoked')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'revoked'
                  ? 'bg-surface-container-lowest text-error shadow-xs font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              Revoked ({revokedCount})
            </button>
          </div>
        </div>

        <div className="divide-y divide-surface-container">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-on-surface-variant">
              No users matching the "{activeFilter}" filter.
            </div>
          ) : (
            filteredUsers.map((member) => {
              const isCurrentUser = member.id === currentUser?.id;
              const isBootstrapAdmin = member.email === 'sanwalniaxii321@gmail.com';
              const isProcessing = processingUserId === member.id;

              return (
                <div key={member.id} className="py-3.5 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={member.name} avatarUrl={member.avatar} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface truncate">{member.name}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary text-on-primary">
                            You
                          </span>
                        )}
                        {getStatusBadge(member.approvalStatus)}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">{member.email}</div>
                      <div className="text-[11px] text-outline">
                        {member.title} • {member.department}
                        {member.approvedBy && (
                          <span> • Approved by {member.approvedBy}</span>
                        )}
                        {member.deniedBy && (
                          <span className="text-error"> • Denied by {member.deniedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Role Selector (Admin only, disabled for bootstrap admin or non-admins) */}
                    {canManageTeam() ? (
                      <select
                        disabled={isBootstrapAdmin || isProcessing}
                        className="h-8 px-2.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface border border-outline-variant/40 outline-none disabled:opacity-60"
                        value={member.role}
                        onChange={(e) => updateUserRole(member.id, e.target.value as UserRole)}
                      >
                        <option value="admin">Admin / Partner</option>
                        <option value="advisor">Financial Advisor</option>
                        <option value="associate">Practice Associate</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-surface-container text-on-surface">
                        {member.role}
                      </span>
                    )}

                    {/* Admin Approval & Revocation Actions */}
                    {canManageTeam() && !isBootstrapAdmin && (
                      <>
                        {member.approvalStatus === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprove(member.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary hover:text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              <span>{isProcessing ? 'Updating...' : 'Approve'}</span>
                            </button>
                            <button
                              onClick={() => handleDeny(member.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white text-xs font-bold transition-all border border-error/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>{isProcessing ? 'Updating...' : 'Deny'}</span>
                            </button>
                          </div>
                        )}

                        {member.approvalStatus === 'approved' && !isCurrentUser && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setRevokeActionType('revoked');
                                setUserToRevoke(member);
                              }}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-error/10 text-error hover:bg-error hover:text-white text-xs font-bold transition-all border border-error/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              type="button"
                              title="Revoke workspace access immediately"
                            >
                              <span className="material-symbols-outlined text-[16px]">block</span>
                              <span>Revoke Access</span>
                            </button>
                            <button
                              onClick={() => {
                                setRevokeActionType('disabled');
                                setUserToRevoke(member);
                              }}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold transition-all border border-outline-variant/30 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              type="button"
                              title="Temporarily disable user access"
                            >
                              <span className="material-symbols-outlined text-[15px]">power_settings_new</span>
                              <span>Disable</span>
                            </button>
                          </div>
                        )}

                        {member.approvalStatus === 'denied' && (
                          <button
                            onClick={() => handleApprove(member.id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary hover:text-white text-xs font-bold transition-all border border-tertiary/30 flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            <span>{isProcessing ? 'Updating...' : 'Re-evaluate / Approve'}</span>
                          </button>
                        )}

                        {(member.approvalStatus === 'revoked' || member.approvalStatus === 'disabled') && (
                          <button
                            onClick={() => handleApprove(member.id)}
                            disabled={isProcessing}
                            className="px-3 py-1.5 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary hover:text-white text-xs font-bold transition-all border border-tertiary/30 flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            <span>{isProcessing ? 'Updating...' : 'Re-instate / Approve Access'}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Quick Switch (if multiple approved users) */}
                    {member.approvalStatus === 'approved' && !isCurrentUser && (
                      <button
                        onClick={() => switchUser(member.id)}
                        className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium transition-colors cursor-pointer"
                        type="button"
                      >
                        Switch
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pre-Approved Invite Form (Administrators Only) */}
      {canManageTeam() ? (
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Pre-Approve & Invite Colleague</h3>
              <p className="text-xs text-on-surface-variant">Pre-authorizes an email address so they gain immediate access upon signing in</p>
            </div>
            <span className="text-[11px] text-tertiary font-bold bg-tertiary-fixed px-2.5 py-0.5 rounded-full">
              Pre-Approved Access
            </span>
          </div>

          <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Full Name</label>
              <input
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                placeholder="e.g. David Ross"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Firm Email</label>
              <input
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                placeholder="d.ross@leadpilot.co"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Role</label>
              <select
                className="w-full h-9 px-2 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
              >
                <option value="advisor">Financial Advisor</option>
                <option value="admin">Admin / Partner</option>
                <option value="associate">Practice Associate</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">Title</label>
              <input
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                placeholder="CPA Advisor"
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isInviting}
                className="w-full h-9 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>{isInviting ? 'Inviting...' : 'Send Invite'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface-variant flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[20px] text-outline">lock</span>
          <span>Only administrators can approve new team registrations, adjust roles, or invite members.</span>
        </div>
      )}

      {/* Automated Email Notification System Rules & Preferences */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-on-surface">Automated Email Notification System Rules</h3>
          <p className="text-xs text-on-surface-variant">Configured triggers for automated practice dispatch</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifLeadAssigned}
              onChange={(e) => setNotifLeadAssigned(e.target.checked)}
              className="mt-0.5 rounded text-primary accent-primary"
            />
            <div>
              <div className="text-xs font-bold text-on-surface">Lead Assignment Alerts</div>
              <div className="text-[11px] text-on-surface-variant">Notify assigned advisor when a new intake lead is routed</div>
            </div>
          </label>

          <label className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifFollowupDue}
              onChange={(e) => setNotifFollowupDue(e.target.checked)}
              className="mt-0.5 rounded text-primary accent-primary"
            />
            <div>
              <div className="text-xs font-bold text-on-surface">Follow-up Due Alerts</div>
              <div className="text-[11px] text-on-surface-variant">Morning digest of client calls & review deadlines scheduled for today</div>
            </div>
          </label>

          <label className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifConverted}
              onChange={(e) => setNotifConverted(e.target.checked)}
              className="mt-0.5 rounded text-primary accent-primary"
            />
            <div>
              <div className="text-xs font-bold text-on-surface">Client Converted Notifications</div>
              <div className="text-[11px] text-on-surface-variant">Team-wide celebration alert when a deal status transitions to Converted</div>
            </div>
          </label>

          <label className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifHighValue}
              onChange={(e) => setNotifHighValue(e.target.checked)}
              className="mt-0.5 rounded text-primary accent-primary"
            />
            <div>
              <div className="text-xs font-bold text-on-surface">High-Value Retainer Notice</div>
              <div className="text-[11px] text-on-surface-variant">Priority alert for deals with estimated retainer over $1,500/month</div>
            </div>
          </label>
        </div>
      </div>

      {/* Confirmation Modal for Revoking or Disabling Access */}
      {userToRevoke && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revokeModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  revokeActionType === 'revoked'
                    ? 'bg-error/10 text-error'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {revokeActionType === 'revoked' ? 'gpp_bad' : 'power_settings_new'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="revokeModalTitle" className="text-base font-bold text-on-surface">
                  {revokeActionType === 'revoked'
                    ? 'Revoke Workspace Access?'
                    : 'Temporarily Disable User?'}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Confirm access control enforcement for this team account
                </p>
              </div>
            </div>

            {/* Target user summary */}
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container flex items-center gap-3">
              <UserAvatar name={userToRevoke.name} avatarUrl={userToRevoke.avatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-on-surface truncate">{userToRevoke.name}</div>
                <div className="text-xs text-on-surface-variant truncate">{userToRevoke.email}</div>
                <div className="text-[11px] text-outline mt-0.5">
                  Role: <span className="font-semibold uppercase">{userToRevoke.role}</span> • {userToRevoke.department}
                </div>
              </div>
            </div>

            {/* Impact explanation */}
            <div className="space-y-1.5 text-xs text-on-surface-variant bg-surface-container-low/50 p-3 rounded-xl border border-surface-container/60">
              <div className="font-semibold text-on-surface flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[15px] text-primary">verified_user</span>
                <span>Immediate Security Enforcement</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-on-surface-variant">
                <li>
                  {revokeActionType === 'revoked'
                    ? 'Immediately disconnects active CRM sessions and live Firestore subscriptions.'
                    : 'Temporarily pauses workspace access until re-enabled.'}
                </li>
                <li>Presents the revoked/pending access screen if the user is currently online.</li>
                <li>Server-side Firestore security rules will block all queries to leads and client records.</li>
                <li>Access can be restored at any time by an administrator via "Re-instate / Approve Access".</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setUserToRevoke(null)}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={async () => {
                  setIsRevoking(true);
                  try {
                    await updateUserStatus(userToRevoke.id, revokeActionType);
                    setUserToRevoke(null);
                  } finally {
                    setIsRevoking(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                  revokeActionType === 'revoked'
                    ? 'bg-error text-white hover:bg-error/90'
                    : 'bg-on-surface text-surface-container-lowest hover:bg-on-surface/90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {revokeActionType === 'revoked' ? 'block' : 'check'}
                </span>
                <span>
                  {isRevoking
                    ? 'Enforcing...'
                    : revokeActionType === 'revoked'
                    ? 'Yes, Revoke Access'
                    : 'Yes, Disable User'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

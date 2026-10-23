import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const PendingApprovalView: React.FC = () => {
  const { currentUser, logout, refreshUserData, showToast } = useApp();
  const [isChecking, setIsChecking] = useState(false);

  const isRevoked = currentUser?.approvalStatus === 'revoked';
  const isDisabled = currentUser?.approvalStatus === 'disabled';
  const isDenied = currentUser?.approvalStatus === 'denied';

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await refreshUserData();
    setIsChecking(false);
    showToast('Checked access status.');
  };

  const isBlocked = isRevoked || isDisabled || isDenied;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            isBlocked
              ? 'bg-error/10 text-error'
              : 'bg-amber-500/10 text-amber-600'
          }`}
        >
          <span className="material-symbols-outlined text-[34px]">
            {isRevoked ? 'gpp_bad' : isDenied ? 'cancel' : isDisabled ? 'block' : 'pending_actions'}
          </span>
        </div>

        <div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isBlocked
                ? 'bg-error/15 text-error'
                : 'bg-amber-500/15 text-amber-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            <span>
              {isRevoked
                ? 'Access Revoked'
                : isDenied
                ? 'Access Request Denied'
                : isDisabled
                ? 'Account Deactivated'
                : 'Awaiting Administrator Approval'}
            </span>
          </div>

          <h2 className="text-xl font-bold text-on-surface">
            {isRevoked
              ? 'Access Revoked'
              : isDenied
              ? 'Access Request Denied'
              : isDisabled
              ? 'Account Disabled'
              : 'Authorization Pending'}
          </h2>

          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed max-w-sm mx-auto">
            {isRevoked ? (
              <>
                Your access to this practice CRM workspace has been revoked by the administrator. Contact your managing partner if you believe this is in error.
              </>
            ) : isDenied ? (
              <>
                Your registration request for this CRM practice workspace was reviewed and denied by the practice administrator. If you believe this is in error, contact your administrator.
              </>
            ) : isDisabled ? (
              <>
                Your account is currently disabled. Please contact the practice administrator to reactivate your access.
              </>
            ) : (
              <>
                Your account (<strong className="text-on-surface">{currentUser?.email}</strong>) has been authenticated, but an administrator has not yet activated your CRM workspace access.
              </>
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container text-left text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Account:</span>
            <span className="font-semibold text-on-surface">{currentUser?.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Email:</span>
            <span className="font-semibold text-on-surface">{currentUser?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Status:</span>
            <span className={`font-bold capitalize ${isBlocked ? 'text-error' : 'text-amber-600'}`}>{currentUser?.approvalStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant">Practice Admin:</span>
            <span className="font-semibold text-primary">sanwalniaxii321@gmail.com</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {!isBlocked && (
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isChecking ? 'hourglass_top' : 'refresh'}
              </span>
              <span>{isChecking ? 'Checking Access...' : 'Check Approval Status'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

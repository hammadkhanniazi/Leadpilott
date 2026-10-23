import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './screens/DashboardView';
import { LeadsView } from './screens/LeadsView';
import { LeadDetailsView } from './screens/LeadDetailsView';
import { AddLeadView } from './screens/AddLeadView';
import { FollowUpsView } from './screens/FollowUpsView';
import { ReportsView } from './screens/ReportsView';
import { TeamView } from './screens/TeamView';
import { LoginPage } from './components/LoginPage';
import { PendingApprovalView } from './components/PendingApprovalView';
import { AiLeadScraperModal } from './components/AiLeadScraperModal';
import { AuthPortalModal } from './components/AuthPortalModal';
import { CsvImportModal } from './components/CsvImportModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';

const AppContent: React.FC = () => {
  const {
    isAuthReady,
    isAuthenticated,
    isApproved,
    activeTab,
    selectedLeadId,
    isAddLeadOpen,
    isCsvImportOpen,
    setIsCsvImportOpen,
    toastMessage,
  } = useApp();

  // 1. Initial Authentication Readiness Gate
  if (!isAuthReady) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-surface text-center">
        <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <span className="material-symbols-outlined text-[26px]">account_balance</span>
        </div>
        <div className="text-sm font-bold text-on-surface">LeadPilot Financial CRM</div>
        <div className="text-xs text-on-surface-variant mt-1">Verifying security credentials & access permissions...</div>
        <div className="w-40 h-1 bg-surface-container rounded-full overflow-hidden mt-4">
          <div className="h-full bg-primary animate-indeterminate"></div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Gate: Redirect unauthenticated visitors to Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // 3. Admin Approval Gate: Block accounts that are not explicitly approved by administrator
  if (!isApproved) {
    return <PendingApprovalView />;
  }

  // 4. Protected CRM Workspace: Rendered only for authenticated and approved practice team members
  const renderActiveScreen = () => {
    // If a specific lead is selected, prioritize Lead Details
    if (selectedLeadId) {
      return <LeadDetailsView />;
    }

    // If Add Lead form is open, show Add Lead intake view
    if (isAddLeadOpen) {
      return <AddLeadView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'follow-ups':
        return <FollowUpsView />;
      case 'reports':
        return <ReportsView />;
      case 'team':
        return <TeamView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-1 w-full bg-surface pt-16 pb-20 md:pb-8">
        {renderActiveScreen()}
      </main>

      <BottomNav />

      {/* Global Modals & Drawers */}
      <AiLeadScraperModal />
      <AuthPortalModal />
      <CsvImportModal isOpen={isCsvImportOpen} onClose={() => setIsCsvImportOpen(false)} />
      <NotificationsDrawer />

      {/* Toast Notification Container */}
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 pointer-events-none ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <span className="material-symbols-outlined text-[18px] text-tertiary-fixed">check_circle</span>
        <span className="text-xs font-semibold">{toastMessage}</span>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

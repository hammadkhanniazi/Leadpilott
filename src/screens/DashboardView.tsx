import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead } from '../types';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    leads,
    followups,
    setActiveTab,
    setSelectedLeadId,
    setIsAddLeadOpen,
    setIsCsvImportOpen,
    addLead,
    showToast,
  } = useApp();

  const [showTip, setShowTip] = useState(true);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCompany, setQuickCompany] = useState('');
  const [quickNeed, setQuickNeed] = useState<Lead['service']>('Bookkeeping');

  // Compute live metrics
  const totalLeadsCount = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'New').length;
  const qualifiedLeadsCount = leads.filter((l) => l.status === 'Qualified').length;
  const qualifiedARR = leads
    .filter((l) => l.status === 'Qualified' || l.status === 'Converted')
    .reduce((acc, curr) => acc + (curr.estimatedARR || 0), 0);

  const pendingFollowupsCount = followups.filter((f) => !f.completed).length;

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickCompany) {
      showToast('Please enter both name and company');
      return;
    }

    await addLead({
      name: quickName,
      company: quickCompany,
      service: quickNeed,
      status: 'New',
      estimatedMonthlyRetainer: quickNeed === 'Financial Advisory' ? 2500 : quickNeed === 'Tax Preparation' ? 1200 : 650,
      source: 'Direct Client Intake',
    });

    setQuickName('');
    setQuickCompany('');
    setIsQuickDrawerOpen(false);
  };

  const recentLeads = leads.slice(0, 5);

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return (
          <span className="bg-primary-fixed text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0">
            New Lead
          </span>
        );
      case 'Qualified':
        return (
          <span className="bg-on-tertiary-container text-tertiary px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0">
            Qualified
          </span>
        );
      case 'Contacted':
        return (
          <span className="bg-secondary-container text-on-secondary-fixed-variant px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0">
            Contacted
          </span>
        );
      case 'Converted':
        return (
          <span className="bg-tertiary text-on-tertiary px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0">
            Converted
          </span>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-gutter pb-space-xl space-y-space-lg">
      {/* Welcome Briefing & Pipeline Status */}
      <div className="flex flex-col space-y-space-xs pt-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-space-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-tertiary">
              Pipeline Live • Updated Just Now
            </span>
          </div>
          <div className="flex items-center space-x-1 bg-surface-container px-2.5 py-0.5 rounded-full">
            <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
            <span className="text-xs text-on-surface-variant font-medium">
              {totalLeadsCount > 0 ? `${totalLeadsCount} Active Leads` : 'Workspace Active'}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Good morning, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Advisor'}
        </h1>
        <p className="text-sm text-on-surface-variant">
          Overview of your accounting & advisory pipeline
        </p>
      </div>

      {/* Metric Summary Cards (2 Column + 1 Featured Column) */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-space-sm">
        {/* Total Leads */}
        <div
          onClick={() => setActiveTab('leads')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">Total Leads</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="mt-space-md">
            <div className="text-2xl font-bold font-metric-num text-on-surface">
              {totalLeadsCount}
            </div>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-tertiary">
                {totalLeadsCount > 0 ? 'arrow_upward' : 'check_circle'}
              </span>
              <span className="text-xs text-tertiary font-medium">
                {totalLeadsCount > 0 ? `${totalLeadsCount} In Pipeline` : 'Ready for Intake'}
              </span>
            </div>
          </div>
        </div>

        {/* New Leads (Action Required) */}
        <div
          onClick={() => setActiveTab('leads')}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col justify-between transition-all duration-200 active:scale-[0.98] relative overflow-hidden cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-on-surface-variant">New Leads</span>
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-error-container text-error">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
            </div>
          </div>
          <div className="mt-space-md">
            <div className="text-2xl font-bold font-metric-num text-on-surface">
              {newLeadsCount}
            </div>
            <p className="text-xs text-error font-medium truncate">Requires initial call</p>
          </div>
        </div>

        {/* Qualified Leads (Spans 2 cols on mobile, 1 col on desktop) */}
        <div
          onClick={() => setActiveTab('reports')}
          className="col-span-2 md:col-span-1 bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer hover:shadow-md"
        >
          <div className="flex items-center space-x-space-md">
            <div className="w-10 h-10 rounded-full bg-on-tertiary-container flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-on-surface">
                  {qualifiedLeadsCount} Qualified
                </span>
                <span className="bg-surface-container px-2 py-0.5 rounded-full text-[11px] text-tertiary font-semibold">
                  Active Value
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Estimated pipeline value:{' '}
                <strong className="text-on-surface font-semibold font-metric-num">
                  ${qualifiedARR.toLocaleString()} ARR
                </strong>
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="flex items-center space-x-space-sm pt-space-xs">
        <button
          onClick={() => setIsAddLeadOpen(true)}
          className="flex-1 bg-primary text-on-primary py-space-sm px-space-md rounded-xl text-sm font-semibold shadow-sm active:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center space-x-2 hover:bg-primary/95"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>Add Lead</span>
        </button>
        <button
          onClick={() => setActiveTab('follow-ups')}
          className="flex-1 bg-surface-container-lowest text-on-surface border border-surface-container/80 py-space-sm px-space-md rounded-xl text-sm font-semibold shadow-sm active:bg-surface-container active:scale-[0.98] transition-all flex items-center justify-center space-x-2 hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">calendar_today</span>
          <span>Follow-ups</span>
          <span className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary-fixed text-[11px] font-bold flex items-center justify-center ml-0.5">
            {pendingFollowupsCount}
          </span>
        </button>
      </div>

      {/* Delight Banner: Daily Advisory Tip */}
      {showTip && (
        <div className="bg-surface-container-low rounded-xl p-space-md flex items-start space-x-space-sm shadow-sm relative overflow-hidden border border-surface-container">
          <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">lightbulb</span>
          </div>
          <div className="flex-1 min-w-0 pr-space-sm">
            <h2 className="text-sm font-semibold text-on-surface">CFO Advisory Tip</h2>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {qualifiedLeadsCount > 0
                ? `${qualifiedLeadsCount} of your qualified leads are currently reviewing compliance or fee packages. Follow up to accelerate conversion.`
                : 'Tax planning and quarterly review cycles drive highest retainer conversions. Add new client leads to track your pipeline.'}
            </p>
          </div>
          <button
            aria-label="Dismiss tip"
            onClick={() => setShowTip(false)}
            className="shrink-0 text-on-surface-variant hover:text-on-surface p-1 rounded-md"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Recent Leads Section */}
      <div className="flex flex-col space-y-space-sm">
        <div className="flex items-center justify-between px-space-xs">
          <div className="flex items-center space-x-space-xs">
            <h2 className="text-base font-semibold text-on-surface">Recent Leads</h2>
            <span className="bg-surface-container text-on-surface-variant text-[11px] px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          </div>
          <button
            onClick={() => setActiveTab('leads')}
            className="text-xs font-semibold text-primary flex items-center space-x-0.5 hover:underline"
            type="button"
          >
            <span>See all ({totalLeadsCount})</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        {/* Leads List */}
        <div className="flex flex-col space-y-space-sm">
          {recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container/60 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-3">
                <span className="material-symbols-outlined text-[24px]">group_add</span>
              </div>
              <h4 className="text-sm font-bold text-on-surface mb-1">No Client Leads in Pipeline</h4>
              <p className="text-xs text-on-surface-variant max-w-xs mb-4 leading-relaxed">
                Start tracking your practice by adding client leads manually or importing from your firm's CSV.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddLeadOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-all cursor-pointer shadow-xs"
                  type="button"
                >
                  + Add Lead
                </button>
                <button
                  onClick={() => setIsCsvImportOpen(true)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-all cursor-pointer border border-outline-variant/40"
                  type="button"
                >
                  Import CSV
                </button>
              </div>
            </div>
          ) : (
            recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="lead-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 transition-all duration-200 active:scale-[0.99] flex flex-col space-y-space-sm hover:border-outline-variant/60"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex items-start space-x-space-sm min-w-0 cursor-pointer"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-sm font-semibold shrink-0">
                      {getInitials(lead.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-on-surface truncate hover:text-primary transition-colors">
                        {lead.name}
                      </span>
                      <span className="text-xs text-on-surface-variant truncate">
                        {lead.company}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(lead.status)}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-space-xs flex-wrap gap-y-1">
                    <span className="bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-full text-xs">
                      {lead.service}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center">
                      • Added recently
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {lead.phone && (
                      <a
                        aria-label={`Call ${lead.name}`}
                        className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all"
                        href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </a>
                    )}
                    <button
                      aria-label="Lead details"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-t-2xl sm:rounded-2xl p-space-lg shadow-xl flex flex-col space-y-space-md animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b pb-space-sm border-surface-container">
              <h3 className="text-lg font-semibold text-on-surface">New Client Lead</h3>
              <button
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                onClick={() => setIsQuickDrawerOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="space-y-space-sm">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Contact Name</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/40"
                  placeholder="e.g. Liam Walker"
                  type="text"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Company / Entity</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/40"
                  placeholder="e.g. Apex Holdings LLC"
                  type="text"
                  value={quickCompany}
                  onChange={(e) => setQuickCompany(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Primary Advisory Need</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/40"
                  value={quickNeed}
                  onChange={(e) => setQuickNeed(e.target.value as Lead['service'])}
                >
                  <option value="Bookkeeping">Bookkeeping & Clean-up</option>
                  <option value="Tax Preparation">Tax Preparation & Filing</option>
                  <option value="Financial Advisory">Fractional CFO & Strategic Advisory</option>
                  <option value="Accounting">Accounting & Audit</option>
                </select>
              </div>
              <div className="pt-space-sm flex space-x-space-sm">
                <button
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl text-sm font-semibold active:bg-primary-container transition-colors shadow-sm"
                  type="submit"
                >
                  Create Engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

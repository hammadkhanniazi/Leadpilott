import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadStatus } from '../types';
import { UserAvatar } from '../components/UserAvatar';

export const LeadDetailsView: React.FC = () => {
  const {
    leads,
    selectedLeadId,
    setSelectedLeadId,
    updateLead,
    addLeadNote,
    followups,
    addFollowUp,
    toggleFollowUpDone,
    deleteLead,
    canDeleteLeads,
    users,
    currentUser,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'schedule'>('overview');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Find current selected lead
  const lead = leads.find((l) => l.id === selectedLeadId);

  // Edit form state
  const [editName, setEditName] = useState(lead?.name || '');
  const [editCompany, setEditCompany] = useState(lead?.company || '');
  const [editEmail, setEditEmail] = useState(lead?.email || '');
  const [editPhone, setEditPhone] = useState(lead?.phone || '');
  const [editService, setEditService] = useState(lead?.service || 'Bookkeeping');
  const [editRetainer, setEditRetainer] = useState(lead?.estimatedMonthlyRetainer || 650);
  const [editSource, setEditSource] = useState(lead?.source || 'Direct Intake');
  const [editAdvisorId, setEditAdvisorId] = useState(lead?.assignedAdvisorId || currentUser?.id || '');
  const [editFollowUpDate, setEditFollowUpDate] = useState(lead?.followUpDate || '');

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold text-on-surface">Lead not found</h3>
        <button
          onClick={() => setSelectedLeadId(null)}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold"
          type="button"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  // Related follow-ups for this lead
  const relatedFollowups = followups.filter((f) => f.leadId === lead.id || f.leadName.toLowerCase() === lead.name.toLowerCase());

  const stages: { stage: LeadStatus; label: string; index: number }[] = [
    { stage: 'New', label: 'New', index: 0 },
    { stage: 'Contacted', label: 'Contacted', index: 1 },
    { stage: 'Qualified', label: 'Qualified', index: 2 },
    { stage: 'Converted', label: 'Converted', index: 3 },
  ];

  const currentStageIndex = stages.findIndex((s) => s.stage === lead.status);
  const progressWidth = currentStageIndex === 0 ? '8%' : currentStageIndex === 1 ? '38%' : currentStageIndex === 2 ? '68%' : '100%';

  const handleStageChange = async (newStage: LeadStatus) => {
    setIsStatusMenuOpen(false);
    await updateLead(lead.id, { status: newStage });
  };

  const handlePostNote = async () => {
    if (!noteContent.trim()) return;
    await addLeadNote(lead.id, noteContent.trim());
    setNoteContent('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find((u) => u.id === editAdvisorId) || currentUser;
    await updateLead(lead.id, {
      name: editName,
      company: editCompany,
      email: editEmail,
      phone: editPhone,
      service: editService as Lead['service'],
      estimatedMonthlyRetainer: Number(editRetainer),
      source: editSource,
      assignedAdvisorId: assignedUser?.id,
      assignedAdvisorName: assignedUser?.name,
      followUpDate: editFollowUpDate || undefined,
    });
    setIsEditModalOpen(false);
    showToast('Lead details updated successfully');
  };

  const handleDelete = () => {
    setIsConfirmDeleteOpen(true);
  };

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLead(lead.id);
      setIsConfirmDeleteOpen(false);
      setSelectedLeadId(null);
    } catch {
      showToast('Error deleting lead');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-24">
      {/* Top Header Bar */}
      <div className="px-gutter pt-space-xs pb-space-xs flex items-center justify-between border-b border-surface-container">
        <button
          onClick={() => setSelectedLeadId(null)}
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline py-2"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Back to All Leads</span>
        </button>
        {canDeleteLeads() && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 text-xs text-error font-medium hover:bg-error-container/40 px-2.5 py-1.5 rounded-lg transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            <span>Delete Lead</span>
          </button>
        )}
      </div>

      {/* Top Profile Subheader & Quick Status */}
      <div className="px-gutter pt-space-md pb-space-sm flex items-center justify-between">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="relative shrink-0">
            <UserAvatar name={lead.name} avatarUrl={lead.avatar} size="lg" />
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                lead.status === 'Converted'
                  ? 'bg-tertiary-container'
                  : lead.status === 'Qualified'
                  ? 'bg-tertiary'
                  : lead.status === 'Contacted'
                  ? 'bg-secondary'
                  : 'bg-primary'
              }`}
            ></span>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-on-surface truncate leading-tight">
              {lead.name}
            </h2>
            <p className="text-xs text-on-surface-variant truncate font-medium">
              {lead.company}
            </p>
          </div>
        </div>

        {/* Status Pill with Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-primary text-xs font-semibold shadow-xs hover:bg-surface-container-high transition-all active:scale-95"
            type="button"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                lead.status === 'Converted'
                  ? 'bg-tertiary-container'
                  : lead.status === 'Qualified'
                  ? 'bg-tertiary'
                  : lead.status === 'Contacted'
                  ? 'bg-secondary'
                  : 'bg-primary animate-pulse'
              }`}
            ></span>
            <span>{lead.status}</span>
            <span className="material-symbols-outlined text-[16px] leading-none">expand_more</span>
          </button>

          {/* Status Dropdown Menu */}
          {isStatusMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl bg-surface-container-lowest shadow-xl border border-surface-container z-30 py-1.5 overflow-hidden">
              <div className="px-3 py-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Update Stage
              </div>
              {stages.map((st) => (
                <button
                  key={st.stage}
                  onClick={() => handleStageChange(st.stage)}
                  className="w-full text-left px-3 py-2 flex items-center justify-between text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        st.stage === 'New'
                          ? 'bg-primary'
                          : st.stage === 'Contacted'
                          ? 'bg-secondary'
                          : st.stage === 'Qualified'
                          ? 'bg-tertiary'
                          : 'bg-tertiary-container'
                      }`}
                    ></span>
                    {st.label}
                  </span>
                  {lead.status === st.stage && (
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      check
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Stepper Tracker */}
      <div className="px-gutter my-space-sm">
        <div className="bg-surface-container-low rounded-xl p-3 shadow-sm border border-surface-container/60">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-surface-container rounded-full z-0"></div>
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-300"
              style={{ width: progressWidth }}
            ></div>

            {stages.map((st) => {
              const isPastOrCurrent = currentStageIndex >= st.index;
              return (
                <button
                  key={st.stage}
                  onClick={() => handleStageChange(st.stage)}
                  className="relative z-10 flex flex-col items-center gap-1 group"
                  type="button"
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm transition-transform duration-200 group-hover:scale-110 ${
                      isPastOrCurrent
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-on-surface-variant'
                    }`}
                  >
                    {st.stage === 'Converted' ? (
                      <span className="material-symbols-outlined text-[15px]">flag</span>
                    ) : (
                      st.index + 1
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      lead.status === st.stage ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lead Overview Card */}
      <div className="px-gutter mt-space-xs">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-3">
          {/* Business & Est Value Headline Grid */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-medium">
                <span className="material-symbols-outlined text-[16px] text-primary">
                  local_shipping
                </span>
                <span>{lead.service} & Advisory</span>
              </div>
              <div className="text-lg font-bold text-on-surface mt-0.5 truncate">
                {lead.company}
              </div>
            </div>
            <div className="text-right shrink-0 bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container">
              <div className="text-[11px] text-on-surface-variant font-medium">Est. Retainer</div>
              <div className="text-base font-bold text-primary font-metric-num">
                ${lead.estimatedMonthlyRetainer.toLocaleString()}{' '}
                <span className="text-xs font-normal text-on-surface-variant">/mo</span>
              </div>
            </div>
          </div>

          {/* Service Pill & Quick Details */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-medium">
              <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
              {lead.service} & Reconciliations
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              Monthly Recurring (${lead.estimatedARR.toLocaleString()} ARR)
            </div>
          </div>

          {/* Quick Contact One-Tap Action Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-variant text-primary text-xs font-semibold shadow-xs transition-all active:scale-95"
              href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Call</span>
            </a>
            <a
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-variant text-primary text-xs font-semibold shadow-xs transition-all active:scale-95"
              href={`mailto:${lead.email}?subject=LeadPilot%20Advisory%20Proposal`}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Email</span>
            </a>
            <a
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface text-xs font-semibold shadow-xs transition-all active:scale-95"
              href={lead.website || 'https://example.com'}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[18px]">language</span>
              <span>Website</span>
            </a>
          </div>
        </div>
      </div>

      {/* Interactive Segmented Navigation Tabs */}
      <div className="px-gutter mt-space-md">
        <div className="bg-surface-container rounded-xl p-1 flex items-center justify-between shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'overview'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Overview & Info
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'activity'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Notes & Activity{' '}
            <span className="ml-1 px-1.5 py-0.2 bg-primary-container text-on-primary rounded-full text-[10px]">
              {lead.notes?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
              activeTab === 'schedule'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            Follow-up ({relatedFollowups.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Info */}
      {activeTab === 'overview' && (
        <div className="flex flex-col px-gutter mt-space-sm gap-space-sm">
          {/* Contact Info Card */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-on-surface">Contact Information</h3>
              <button
                onClick={() => {
                  setEditName(lead.name);
                  setEditCompany(lead.company);
                  setEditEmail(lead.email || '');
                  setEditPhone(lead.phone || '');
                  setEditService(lead.service);
                  setEditRetainer(lead.estimatedMonthlyRetainer);
                  setEditSource(lead.source || 'Direct Intake');
                  setEditAdvisorId(lead.assignedAdvisorId || currentUser?.id || '');
                  setEditFollowUpDate(lead.followUpDate || '');
                  setIsEditModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Full Name</span>
                <span className="text-on-surface font-semibold">{lead.name}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Business Entity</span>
                <span className="text-on-surface font-semibold">{lead.company}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Email Address</span>
                <a className="text-primary font-medium underline truncate max-w-[200px]" href={`mailto:${lead.email}`}>
                  {lead.email || 'Not provided'}
                </a>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Direct Phone</span>
                <a className="text-primary font-medium underline" href={`tel:${lead.phone}`}>
                  {lead.phone || 'Not provided'}
                </a>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Lead Source</span>
                <span className="text-on-surface inline-flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[15px] text-primary">share</span>
                  {lead.source}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Assigned Advisor</span>
                <span className="text-on-surface font-medium">
                  {lead.assignedAdvisorName || 'Unassigned'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Target Follow-up</span>
                <span className="text-on-surface font-medium">
                  {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'Not scheduled'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 bg-surface-container-low px-3 rounded-lg text-xs">
                <span className="text-on-surface-variant">Date Created</span>
                <span className="text-on-surface font-medium">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Client Business Snapshot Card */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-on-surface">Client Account Summary</h3>
              <span className="text-[11px] text-tertiary font-semibold bg-on-tertiary-container px-2 py-0.5 rounded-full">
                {lead.status === 'Converted' ? 'Active Client' : `${lead.status} Account`}
              </span>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-2 border border-surface-container">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Practice Engagement</span>
                <span className="text-on-surface font-semibold">{lead.service} & Financial Strategy</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Pipeline Stage</span>
                <span className="text-primary font-semibold">{lead.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Monthly Retainer</span>
                <span className="text-on-surface font-bold font-metric-num">${lead.estimatedMonthlyRetainer.toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Annual Contract Value</span>
                <span className="text-tertiary font-bold font-metric-num">${lead.estimatedARR.toLocaleString()} ARR</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container">
                <span className="text-on-surface-variant font-medium">Target Follow-up</span>
                <span className="text-on-surface font-medium">
                  {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : 'None scheduled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notes & Activity */}
      {activeTab === 'activity' && (
        <div className="flex flex-col px-gutter mt-space-sm gap-space-sm">
          {/* Quick Add Note Card */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-on-surface flex items-center gap-1.5" htmlFor="new-note-input">
                <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
                Quick Log Note
              </label>
              <span className="text-[11px] text-on-surface-variant">Markdown supported</span>
            </div>
            <textarea
              className="w-full bg-surface-container-low rounded-lg p-3 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:bg-surface-container-lowest border border-outline-variant/40 transition-colors"
              id="new-note-input"
              placeholder="Type call notes, client updates, or quote progress..."
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-on-surface-variant">
                <button
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                  title="Attach file"
                  type="button"
                  onClick={() => showToast('File attachment preview')}
                >
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button
                  className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                  title="Mention team member"
                  type="button"
                  onClick={() => setNoteContent((prev) => prev + ' @Team ')}
                >
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </button>
              </div>
              <button
                onClick={handlePostNote}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-xs hover:opacity-90 active:scale-95 transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Post Note
              </button>
            </div>
          </div>

          {/* Activity Stream */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-sm font-bold text-on-surface">Timeline & Logs</h3>
              <span className="text-xs text-on-surface-variant font-medium">
                {lead.notes?.length || 0} Entries
              </span>
            </div>

            <div className="flex flex-col gap-3 relative">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex flex-col gap-1 p-3 bg-surface-container-low rounded-xl border border-surface-container"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-on-surface">{note.authorName}</span>
                        <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.2 rounded font-medium">
                          {note.authorRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-outline">{note.createdAt}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                      {note.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No notes logged yet. Use the form above to add an advisory entry.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Follow-up */}
      {activeTab === 'schedule' && (
        <div className="flex flex-col px-gutter mt-space-sm gap-space-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Scheduled Follow-ups</h3>
            <button
              onClick={() => {
                addFollowUp({
                  leadId: lead.id,
                  leadName: lead.name,
                  leadCompany: lead.company,
                  dueTime: 'Tomorrow, 2:00 PM',
                  priority: 'High Priority',
                  actionSummary: `Call ${lead.name} regarding advisory proposal`,
                  proposalAmount: `$${lead.estimatedMonthlyRetainer}/mo`,
                  service: lead.service,
                  leadStatus: lead.status,
                });
              }}
              className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary-fixed px-3 py-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Schedule Action
            </button>
          </div>

          {relatedFollowups.length > 0 ? (
            relatedFollowups.map((fu) => (
              <div
                key={fu.id}
                className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-on-surface">{fu.dueTime}</span>
                    <p className="text-xs text-on-surface-variant mt-0.5">{fu.actionSummary}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      fu.completed ? 'bg-tertiary text-on-tertiary' : 'bg-secondary-container text-on-secondary-fixed'
                    }`}
                  >
                    {fu.completed ? 'Completed' : fu.priority}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container">
                  <button
                    onClick={() => toggleFollowUpDone(fu.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      {fu.completed ? 'undo' : 'check_circle'}
                    </span>
                    <span>{fu.completed ? 'Reopen' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container text-xs text-on-surface-variant">
              No follow-ups currently scheduled for this lead. Click "Schedule Action" above to add one.
            </div>
          )}
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-surface-container">
              <h3 className="text-base font-bold text-on-surface">Edit Lead Details</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Contact Name</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Company / Business</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Service Required</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={editService}
                    onChange={(e) => setEditService(e.target.value as any)}
                  >
                    <option value="Bookkeeping">Bookkeeping</option>
                    <option value="Tax Preparation">Tax Preparation</option>
                    <option value="Financial Advisory">Financial Advisory</option>
                    <option value="Accounting">Accounting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Est. Retainer ($/mo)</label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    type="number"
                    value={editRetainer}
                    onChange={(e) => setEditRetainer(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Lead Source</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value)}
                  >
                    <option value="Website Intake">Website Intake</option>
                    <option value="Client Referral">Client Referral</option>
                    <option value="CPA Partner Network">CPA Partner Network</option>
                    <option value="Google Search">Google Search</option>
                    <option value="LinkedIn / Professional Network">LinkedIn / Professional Network</option>
                    <option value="Direct Intake">Direct Intake</option>
                    <option value="CSV Import">CSV Import</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Assigned Advisor</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={editAdvisorId}
                    onChange={(e) => setEditAdvisorId(e.target.value)}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.title || u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Follow-up Date</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  type="date"
                  value={editFollowUpDate}
                  onChange={(e) => setEditFollowUpDate(e.target.value)}
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lead Confirmation Dialog */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-surface-container flex flex-col space-y-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-on-surface">Permanently Delete Lead?</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Are you sure you want to delete <strong className="text-on-surface">{lead.company}</strong> ({lead.name})? All timeline notes and scheduled follow-ups will be removed. This cannot be undone.
              </p>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Yes, Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

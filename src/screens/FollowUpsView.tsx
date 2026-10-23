import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FollowUp, FollowUpBucket, FollowUpPriority } from '../types';
import { UserAvatar } from '../components/UserAvatar';

export const FollowUpsView: React.FC = () => {
  const {
    followups,
    leads,
    toggleFollowUpDone,
    addFollowUp,
    rescheduleFollowUp,
    setSelectedLeadId,
    showToast,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FollowUpBucket | 'all'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [reschedulingTask, setReschedulingTask] = useState<FollowUp | null>(null);

  // New follow-up form state
  const [newLeadId, setNewLeadId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('Today, 3:00 PM');
  const [newPriority, setNewPriority] = useState<FollowUpPriority>('High Priority');
  const [newAction, setNewAction] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState('Tomorrow');
  const [rescheduleTime, setRescheduleTime] = useState('11:00 AM');

  const filtered = followups.filter((f) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return f.completed;
    if (activeFilter === 'today') return !f.completed && f.bucket === 'today';
    if (activeFilter === 'upcoming') return !f.completed && f.bucket === 'upcoming';
    return true;
  });

  const dueTodayCount = followups.filter((f) => !f.completed && f.bucket === 'today').length;
  const upcomingCount = followups.filter((f) => !f.completed && f.bucket === 'upcoming').length;
  const completedCount = followups.filter((f) => f.completed).length;

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction) {
      showToast('Please describe the follow-up action');
      return;
    }

    const selectedLead = leads.find((l) => l.id === newLeadId);
    await addFollowUp({
      leadId: selectedLead?.id || 'lead-1',
      leadName: selectedLead?.name || 'Prospect Client',
      leadCompany: selectedLead?.company || 'Business Co',
      leadAvatar: selectedLead?.avatar,
      dueTime: newDueTime,
      dueDate: newDueDate || new Date().toISOString(),
      bucket: newDueTime.toLowerCase().includes('today') ? 'today' : 'upcoming',
      priority: newPriority,
      actionSummary: newAction,
      proposalAmount: newAmount || '$850/mo Retainer',
      service: selectedLead?.service || 'Financial Advisory',
      leadStatus: selectedLead?.status || 'Contacted',
      phone: selectedLead?.phone,
      email: selectedLead?.email,
    });

    setIsScheduleModalOpen(false);
    setNewAction('');
  };

  const handleExecuteReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingTask) return;
    await rescheduleFollowUp(reschedulingTask.id, rescheduleDate, rescheduleTime);
    setReschedulingTask(null);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-gutter pb-space-xl">
      {/* Top Context & Headline */}
      <div className="flex flex-col pt-space-md pb-space-sm gap-space-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-space-xs">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Follow-ups</h1>
            <span className="bg-primary-container/10 text-primary-container text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {dueTodayCount + upcomingCount} Due Soon
            </span>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="h-9 px-3.5 bg-primary-container hover:bg-primary text-on-primary text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Schedule</span>
          </button>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Active follow-ups scheduled for accounting & advisory prospects
        </p>
      </div>

      {/* Attention Banner (Urgent Attention) */}
      {dueTodayCount > 0 && (
        <div className="mt-space-sm mb-space-md p-space-md bg-secondary-container/60 rounded-xl flex items-center justify-between shadow-xs border border-secondary-container">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-on-secondary-container shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px] text-error">alarm_on</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-on-surface truncate">
                {dueTodayCount} follow-ups due today
              </span>
              <span className="text-xs text-on-surface-variant truncate">
                {followups
                  .filter((f) => !f.completed && f.bucket === 'today')
                  .map((f) => f.leadCompany)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(' & ') || 'Scheduled advisory actions'}
              </span>
            </div>
          </div>
          <span className="bg-surface-container-lowest text-error text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 shadow-xs border border-error-container">
            Urgent
          </span>
        </div>
      )}

      {/* Filter Pills Swiper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-space-sm -mx-gutter px-gutter no-scrollbar">
        <button
          onClick={() => setActiveFilter('all')}
          className={`h-8 px-3.5 rounded-full text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>All</span>
          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {followups.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('today')}
          className={`h-8 px-3.5 rounded-full text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'today'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Due Today</span>
          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${activeFilter === 'today' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {dueTodayCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`h-8 px-3.5 rounded-full text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'upcoming'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Upcoming</span>
          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${activeFilter === 'upcoming' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {upcomingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`h-8 px-3.5 rounded-full text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5 ${
            activeFilter === 'completed'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Completed</span>
          <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${activeFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {completedCount}
          </span>
        </button>
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-space-md mt-space-xs">
        {filtered.map((item) => {
          const isDone = item.completed;
          return (
            <div
              key={item.id}
              className={`followup-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col gap-space-sm transition-all duration-200 ${
                isDone ? 'opacity-60 bg-surface-container-low/50' : 'hover:border-outline-variant/60'
              }`}
            >
              <div className="flex items-start justify-between gap-space-sm">
                <div
                  className="flex items-center gap-space-sm min-w-0 cursor-pointer"
                  onClick={() => setSelectedLeadId(item.leadId)}
                >
                  <UserAvatar
                    name={item.leadName}
                    avatarUrl={item.leadAvatar}
                    size="md"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-on-surface truncate hover:text-primary transition-colors">
                      {item.leadName}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {item.leadCompany}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="bg-secondary-container text-on-secondary-fixed text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    {item.dueTime}
                  </span>
                  <span
                    className={`text-xs font-semibold flex items-center gap-1 ${
                      item.priority === 'High Priority'
                        ? 'text-error'
                        : item.priority === 'High Value'
                        ? 'text-primary'
                        : 'text-tertiary'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.priority === 'High Priority' ? 'bg-error' : 'bg-tertiary'
                      }`}
                    ></span>
                    {item.priority}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low/70 rounded-xl p-3 flex flex-col gap-1 border border-surface-container">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                    Scheduled Action
                  </span>
                  <span className="text-xs text-primary font-semibold">
                    {item.proposalAmount}
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  {item.actionSummary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-surface-container text-on-surface-variant text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                    {item.leadStatus}
                  </span>
                  <span className="bg-primary/10 text-primary text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                    {item.service}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFollowUpDone(item.id)}
                    className={`h-9 px-3 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors ${
                      isDone
                        ? 'bg-surface-container text-on-surface'
                        : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      {isDone ? 'undo' : 'check_circle'}
                    </span>
                    <span>{isDone ? 'Undo' : 'Done'}</span>
                  </button>

                  {item.phone && (
                    <a
                      className="h-9 px-3 bg-primary-container text-on-primary text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
                      href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Call Now</span>
                    </a>
                  )}

                  {!item.phone && item.email && (
                    <a
                      className="h-9 px-3 bg-primary-container text-on-primary text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-transform"
                      href={`mailto:${item.email}`}
                    >
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      <span>Email</span>
                    </a>
                  )}

                  <button
                    onClick={() => setReschedulingTask(item)}
                    className="h-9 px-3 bg-surface-container text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl flex items-center gap-1 active:scale-95 transition-transform"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                    <span>Reschedule</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {followups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-2xl border border-surface-container mt-2">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed/50 flex items-center justify-center text-tertiary mb-3">
              <span className="material-symbols-outlined text-[28px]">event_upcoming</span>
            </div>
            <h4 className="text-base font-bold text-on-surface mb-1">No Follow-ups Scheduled</h4>
            <p className="text-xs text-on-surface-variant max-w-sm mb-5 leading-relaxed">
              Keep your client engagements on track. Schedule advisor reviews, tax check-ins, and discovery calls to stay ahead of deadlines.
            </p>
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Schedule First Follow-up</span>
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container text-xs text-on-surface-variant">
            No follow-ups found in this view.
          </div>
        ) : null}
      </div>

      {/* Quick Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-surface-container">
              <h3 className="text-base font-bold text-on-surface">Schedule Follow-up Action</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Target Client Lead</label>
                <select
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  value={newLeadId}
                  onChange={(e) => setNewLeadId(e.target.value)}
                >
                  <option value="">Select a lead...</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.company} ({l.service})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Due Timing Label</label>
                  <input
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    placeholder="e.g. Today, 4:00 PM"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Priority</label>
                  <select
                    className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as FollowUpPriority)}
                  >
                    <option value="High Priority">High Priority</option>
                    <option value="High Value">High Value</option>
                    <option value="Standard">Standard</option>
                    <option value="Discovery">Discovery</option>
                    <option value="In Pipeline">In Pipeline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Scope / Amount Highlight</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  placeholder="e.g. $650/mo Clean-up or Video Call"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Action Summary</label>
                <textarea
                  className="w-full p-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  placeholder="e.g. Call to review tax checklist and deliver engagement contract"
                  rows={2}
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs"
                >
                  Schedule Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingTask && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-surface-container">
              <h3 className="text-base font-bold text-on-surface">Reschedule Follow-up</h3>
              <button
                onClick={() => setReschedulingTask(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              Target: <strong className="text-on-surface">{reschedulingTask.leadName}</strong> ({reschedulingTask.leadCompany})
            </p>
            <form onSubmit={handleExecuteReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">New Date Label</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  placeholder="e.g. Tomorrow, Mon Oct 30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Time</label>
                <input
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  placeholder="e.g. 11:00 AM"
                  required
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setReschedulingTask(null)}
                  className="flex-1 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs"
                >
                  Confirm Time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

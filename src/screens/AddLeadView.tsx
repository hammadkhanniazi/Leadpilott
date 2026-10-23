import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Lead, LeadService, LeadStatus } from '../types';

export const AddLeadView: React.FC = () => {
  const {
    setIsAddLeadOpen,
    addLead,
    prefilledIntakeData,
    setPrefilledIntakeData,
    setSelectedLeadId,
    users,
    currentUser,
    showToast,
  } = useApp();

  const [contactName, setContactName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [leadSource, setLeadSource] = useState('Website Intake');
  const [customSource, setCustomSource] = useState('');
  const [selectedServices, setSelectedServices] = useState<LeadService[]>(['Bookkeeping']);
  const [assignedAdvisorId, setAssignedAdvisorId] = useState(currentUser?.id || '');
  const [status, setStatus] = useState<LeadStatus>('New');
  const [followUpDate, setFollowUpDate] = useState('');
  const [initialNotes, setInitialNotes] = useState('');

  // Load prefilled data if populated by AI Lead Scraper
  useEffect(() => {
    if (prefilledIntakeData) {
      if (prefilledIntakeData.name) setContactName(prefilledIntakeData.name);
      if (prefilledIntakeData.company) setBusinessName(prefilledIntakeData.company);
      if (prefilledIntakeData.email) setEmail(prefilledIntakeData.email);
      if (prefilledIntakeData.phone) setPhone(prefilledIntakeData.phone);
      if (prefilledIntakeData.website) setCustomSource(prefilledIntakeData.website);
      if (prefilledIntakeData.service) setSelectedServices([prefilledIntakeData.service]);
      setPrefilledIntakeData(null);
    }
  }, [prefilledIntakeData, setPrefilledIntakeData]);

  const toggleService = (srv: LeadService) => {
    if (selectedServices.includes(srv)) {
      if (selectedServices.length > 1) {
        setSelectedServices(selectedServices.filter((s) => s !== srv));
      }
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !businessName.trim() || !email.trim()) {
      showToast('Please complete all required fields (Contact Name, Business, Email)');
      return;
    }

    const primaryService = selectedServices[0] || 'Bookkeeping';
    const retainer = primaryService === 'Financial Advisory' ? 2800 : primaryService === 'Tax Preparation' ? 1200 : 650;
    const finalSource = leadSource === 'Other' && customSource ? customSource.trim() : leadSource;
    const assignedUser = users.find((u) => u.id === assignedAdvisorId) || currentUser;
    const advisorId = assignedUser?.id || currentUser?.id || 'unassigned';
    const advisorName = assignedUser?.name || currentUser?.name || 'Unassigned Advisor';

    const newLead = await addLead({
      name: contactName.trim(),
      company: businessName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service: primaryService,
      services: selectedServices,
      status,
      source: finalSource,
      assignedAdvisorId: advisorId,
      assignedAdvisorName: advisorName,
      followUpDate: followUpDate || undefined,
      estimatedMonthlyRetainer: retainer,
      initialNotes: initialNotes.trim(),
    });

    setIsAddLeadOpen(false);
    setSelectedLeadId(newLead.id);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-32">
      {/* Top Header */}
      <div className="px-gutter pt-space-md pb-space-lg flex flex-col gap-space-xs border-b border-surface-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-container text-primary">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
            </span>
            <span className="text-base font-bold text-on-surface">Client Intake</span>
          </div>
          <button
            onClick={() => setIsAddLeadOpen(false)}
            className="text-xs font-semibold text-secondary hover:text-on-surface px-space-sm py-1.5 rounded-full hover:bg-surface-container-high transition-colors"
            type="button"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-on-surface-variant max-w-sm">
          Enter client contact information and advisory service requirements to seed onboarding workflows.
        </p>
      </div>

      {/* Client Intake Form */}
      <form onSubmit={handleSubmit} className="px-gutter flex flex-col gap-space-lg mt-space-md">
        {/* Client Essentials */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col gap-space-md">
          <div className="flex items-center gap-2 pb-1 text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
            <h2 className="text-sm font-bold">Client Essentials</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between" htmlFor="contact-name">
              <span>Contact Name <span className="text-error">*</span></span>
              <span className="text-outline text-[11px]">Primary Decision Maker</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">person</span>
              <input
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                id="contact-name"
                placeholder="e.g. Eleanor Vance"
                required
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between" htmlFor="business-name">
              <span>Business Name <span className="text-error">*</span></span>
              <span className="text-outline text-[11px]">Registered Entity</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">domain</span>
              <input
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                id="business-name"
                placeholder="e.g. Northstar Financial Partners LLC"
                required
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="email-address">
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">mail</span>
                <input
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                  id="email-address"
                  placeholder="e.g. eleanor@northstarfp.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="phone-number">
                Phone Number
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">call</span>
                <input
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                  id="phone-number"
                  placeholder="e.g. (555) 012-3456"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="lead-source">
                Lead Acquisition Source
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">travel_explore</span>
                <select
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                  id="lead-source"
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value)}
                >
                  <option value="Website Intake">Website Intake</option>
                  <option value="Client Referral">Client Referral</option>
                  <option value="CPA Partner Network">CPA Partner Network</option>
                  <option value="Google Search">Google Search</option>
                  <option value="LinkedIn / Professional Network">LinkedIn / Professional Network</option>
                  <option value="Direct Outreach">Direct Outreach</option>
                  <option value="Conference / Event">Conference / Event</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {leadSource === 'Other' && (
                <input
                  className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs border border-outline-variant/40 mt-1"
                  placeholder="Specify source or campaign URL..."
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="assigned-advisor">
                Assigned Team Member
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">assignment_ind</span>
                <select
                  className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                  id="assigned-advisor"
                  value={assignedAdvisorId}
                  onChange={(e) => setAssignedAdvisorId(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.title || u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Service Scope */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance_wallet</span>
              <h2 className="text-sm font-bold">Service Required</h2>
            </div>
            <span className="text-[11px] text-on-surface-variant">Select all that apply</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['Bookkeeping', 'Accounting', 'Tax Preparation', 'Financial Advisory'] as LeadService[]).map((srv) => {
              const isSelected = selectedServices.includes(srv);
              return (
                <div
                  key={srv}
                  onClick={() => toggleService(srv)}
                  className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all shadow-xs border ${
                    isSelected
                      ? 'bg-primary-container text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface border-surface-container-high hover:bg-surface-container-high'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white text-primary' : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <span className="text-xs font-semibold">{srv}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-semibold text-on-surface-variant flex items-center justify-between" htmlFor="followup-date">
              <span>Target Follow-up Date</span>
              <span className="text-outline text-[11px]">Next advisor check-in</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">calendar_month</span>
              <input
                className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface text-xs focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all"
                id="followup-date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Lead Status & Notes */}
        <section className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-surface-container/60 flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">flag</span>
              <h2 className="text-sm font-bold">Lead Status</h2>
            </div>
            <span className="text-[11px] text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Initial Pipeline Stage
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['New', 'Qualified', 'Contacted', 'Converted'] as LeadStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                  status === st
                    ? st === 'New'
                      ? 'bg-primary text-on-primary'
                      : st === 'Qualified'
                      ? 'bg-tertiary text-on-tertiary'
                      : st === 'Contacted'
                      ? 'bg-secondary-container text-on-secondary-fixed'
                      : 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {st === 'New' ? 'star' : st === 'Qualified' ? 'verified' : st === 'Contacted' ? 'outgoing_mail' : 'handshake'}
                </span>
                <span>{st === 'New' ? 'New Lead' : st}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant" htmlFor="initial-notes">
                Initial Advisory Notes
              </label>
              <span className="text-[11px] text-outline">{initialNotes.length} / 500</span>
            </div>
            <textarea
              className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-xs focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/40 transition-all resize-none leading-relaxed"
              id="initial-notes"
              maxLength={500}
              rows={3}
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
            />
          </div>
        </section>

        {/* Submit Actions */}
        <div className="flex items-center gap-space-sm pt-2">
          <button
            type="button"
            onClick={() => setIsAddLeadOpen(false)}
            className="h-12 px-space-md rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-12 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            <span>Save Lead & Queue Alerts</span>
          </button>
        </div>
      </form>
    </div>
  );
};

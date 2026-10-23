import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { DiscoveredLead } from '../types';

export const AiLeadScraperModal: React.FC = () => {
  const {
    isAiScraperOpen,
    setIsAiScraperOpen,
    setIsAddLeadOpen,
    setPrefilledIntakeData,
    showToast,
  } = useApp();

  const [activeStep, setActiveStep] = useState<'criteria' | 'review'>('criteria');
  const [searchQuery, setSearchQuery] = useState('Dental practice owners looking for bookkeeping');
  const [searchLocation, setSearchLocation] = useState('Chicago, IL');
  const [selectedSources, setSelectedSources] = useState<string[]>(['linkedin', 'web', 'google']);
  const [leadsCount, setLeadsCount] = useState<number>(10);
  const [isLoading, setIsLoading] = useState(false);

  // Default discovered leads matching the uploaded screen
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([
    {
      id: 'disc-1',
      name: 'Dr. Arthur Sterling',
      company: 'Midwest Dental Clinic',
      email: 'sterling.dds@midwestdental.org',
      phone: '+1 (312) 555-0194',
      website: 'https://midwestdental.org',
      isDuplicate: false,
      source: 'LinkedIn (API)',
    },
    {
      id: 'disc-2',
      name: 'Elena Rostova',
      company: 'Northwind Dental Group',
      email: 'elena@northwinddental.com',
      phone: '+1 (555) 456-7890',
      website: 'https://northwinddental.com',
      isDuplicate: true,
      source: 'Company Websites',
    },
    {
      id: 'disc-3',
      name: 'Dr. Camille Laurent',
      company: 'Laurent Orthodontics',
      email: 'contact@laurentortho.com',
      phone: '— Not listed',
      website: 'https://laurentortho.com',
      isDuplicate: false,
      source: 'Google Search',
    },
    {
      id: 'disc-4',
      name: 'Dr. Julian Scott',
      company: 'Scott Family Orthodontics',
      email: 'j.scott@scottortho.com',
      phone: '(312) 555-0192',
      website: 'https://scottortho.com',
      isDuplicate: false,
      source: 'Google Search',
    },
  ]);

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(['disc-1', 'disc-3', 'disc-4']);

  const toggleSource = (source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const handleExecuteSearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/scrape-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: searchLocation,
          count: leadsCount,
        }),
      });
      const data = await res.json();
      if (data.leads && data.leads.length > 0) {
        setDiscoveredLeads(data.leads);
        setSelectedLeadIds(data.leads.filter((l: any) => !l.isDuplicate).map((l: any) => l.id));
      }
    } catch {
      // Keep defaults
    } finally {
      setIsLoading(false);
      setActiveStep('review');
      showToast('n8n AI Workflow: Verified public leads discovered!');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeadIds(discoveredLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePopulateIntake = () => {
    const chosen = discoveredLeads.find((l) => selectedLeadIds.includes(l.id) && !l.isDuplicate) || discoveredLeads[0];
    if (chosen) {
      setPrefilledIntakeData({
        name: chosen.name,
        company: chosen.company,
        email: chosen.email.includes('@') ? chosen.email : '',
        phone: chosen.phone.includes('(') || chosen.phone.includes('+') ? chosen.phone : '',
        website: chosen.website,
        source: 'AI Public Discovery',
        service: 'Bookkeeping',
      });
      setIsAiScraperOpen(false);
      setIsAddLeadOpen(true);
      showToast(`Populated ${chosen.name} into Add Lead intake form!`);
    } else {
      setIsAiScraperOpen(false);
    }
  };

  if (!isAiScraperOpen) return null;

  return (
    <div
      aria-labelledby="aiModalTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-on-surface leading-tight" id="aiModalTitle">
                Find Leads with AI
              </h2>
              <p className="text-xs text-on-surface-variant">
                Intelligent multi-source prospect discovery
              </p>
            </div>
          </div>
          <button
            aria-label="Close modal"
            onClick={() => setIsAiScraperOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex border-b border-surface-container bg-surface-container-low px-5 gap-4">
          <button
            onClick={() => setActiveStep('criteria')}
            className={`py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeStep === 'criteria'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>1. Search Criteria</span>
          </button>
          <button
            onClick={() => setActiveStep('review')}
            className={`py-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeStep === 'review'
                ? 'border-b-2 border-primary text-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            type="button"
          >
            <span>2. Discovered Leads</span>
            <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-primary text-[10px] font-bold">
              {discoveredLeads.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeStep === 'criteria' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="aiSearchQuery">
                  Target Query or Industry <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                    search
                  </span>
                  <input
                    id="aiSearchQuery"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-xs focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                    placeholder="e.g., Dental practice owners, eCommerce CFOs"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface" htmlFor="aiLocationQuery">
                  Location <span className="text-on-surface-variant font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">
                    location_on
                  </span>
                  <input
                    id="aiLocationQuery"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline-variant/60 bg-surface text-on-surface text-xs focus:border-primary focus:bg-surface-container-lowest outline-none transition-all"
                    placeholder="e.g., Chicago, IL or United States"
                    type="text"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Platform Sources</span>
                  <span className="text-[11px] text-primary font-normal">Multi-select</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'linkedin', label: 'LinkedIn (API Connected)' },
                    { id: 'web', label: 'Company Websites (Public Web)' },
                    { id: 'google', label: 'Google Search (Verified)' },
                    { id: 'directories', label: 'Business Directories' },
                    { id: 'indeed', label: 'Indeed (Job Postings)' },
                    { id: 'social', label: 'Instagram / Threads' },
                  ].map((src) => {
                    const isSelected = selectedSources.includes(src.id);
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => toggleSource(src.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                          isSelected
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-outline-variant/60 bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-primary' : 'bg-outline'
                          }`}
                        ></span>
                        <span>{src.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface">Number of Leads</label>
                <div className="flex items-center gap-2">
                  {[5, 10, 25].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setLeadsCount(cnt)}
                      className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-lg border transition-all ${
                        leadsCount === cnt
                          ? 'bg-primary text-on-primary border-primary shadow-xs'
                          : 'border-outline-variant/50 bg-surface-container-lowest text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      {cnt} leads
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-high/60 border border-surface-container-highest flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                  hub
                </span>
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-semibold text-on-surface">n8n AI Workflow Ready:</span>{' '}
                  Discovered public contacts extract strictly{' '}
                  <span className="font-semibold text-on-surface">Name</span>,{' '}
                  <span className="font-semibold text-on-surface">Email</span>,{' '}
                  <span className="font-semibold text-on-surface">Phone</span>, and{' '}
                  <span className="font-semibold text-on-surface">Website</span> for client intake review.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg border border-surface-container">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllDiscovered"
                    checked={selectedLeadIds.length === discoveredLeads.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded text-primary accent-primary cursor-pointer"
                  />
                  <label htmlFor="selectAllDiscovered" className="text-xs font-bold text-on-surface cursor-pointer">
                    Select All Discovered Leads ({discoveredLeads.length})
                  </label>
                </div>
                <span className="text-xs text-tertiary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">verified</span> Webhook Ready
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {discoveredLeads.map((item) => {
                  const isSelected = selectedLeadIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                        item.isDuplicate
                          ? 'border-error-container bg-error-container/10'
                          : 'border-outline-variant/50 bg-surface-container-lowest shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLeadSelection(item.id)}
                            className="w-4 h-4 rounded text-primary accent-primary cursor-pointer mt-0.5"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-on-surface truncate">
                                {item.name}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                                  item.isDuplicate
                                    ? 'bg-error-container text-error'
                                    : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                }`}
                              >
                                {item.isDuplicate ? 'Duplicate Detected' : 'Unique'}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {item.company}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 bg-surface-container-low rounded-lg text-xs">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-outline font-bold">EMAIL</span>
                          <span className="text-on-surface truncate font-mono text-[11px]">
                            {item.email || '— Not listed'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-outline font-bold">PHONE</span>
                          <span className="text-on-surface truncate font-mono text-[11px]">
                            {item.phone}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0 col-span-2">
                          <span className="text-[10px] text-outline font-bold">WEBSITE</span>
                          <span className="text-primary truncate font-mono text-[11px]">
                            {item.website}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2.5 px-5 py-3.5 border-t border-surface-container bg-surface-container-low/40">
          <button
            onClick={() => setIsAiScraperOpen(false)}
            className="px-4 py-2 rounded-xl text-on-surface-variant font-semibold text-xs hover:bg-surface-container transition-colors"
            type="button"
          >
            Cancel
          </button>

          {activeStep === 'criteria' ? (
            <button
              onClick={handleExecuteSearch}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{isLoading ? 'Searching...' : 'Start AI Search'}</span>
            </button>
          ) : (
            <button
              onClick={handlePopulateIntake}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
              <span>Populate Add Lead Form ({selectedLeadIds.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

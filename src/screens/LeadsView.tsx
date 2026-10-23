import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Lead } from '../types';

export const LeadsView: React.FC = () => {
  const {
    leads,
    setSelectedLeadId,
    setIsAddLeadOpen,
    setIsAiScraperOpen,
    setIsCsvImportOpen,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Filter leads based on query, status, and service
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.source.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === 'all' || lead.status.toLowerCase() === selectedStatus.toLowerCase();

      const matchesService =
        selectedService === 'all' || lead.service.toLowerCase().includes(selectedService.toLowerCase());

      return matchesQuery && matchesStatus && matchesService;
    });
  }, [leads, searchQuery, selectedStatus, selectedService]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Status counts for pills
  const statusCounts = useMemo(() => {
    return {
      all: leads.length,
      new: leads.filter((l) => l.status === 'New').length,
      qualified: leads.filter((l) => l.status === 'Qualified').length,
      contacted: leads.filter((l) => l.status === 'Contacted').length,
      converted: leads.filter((l) => l.status === 'Converted').length,
    };
  }, [leads]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Service', 'Status', 'Retainer', 'ARR', 'Source'];
    const rows = filteredLeads.map((l) => [
      `"${l.name}"`,
      `"${l.company}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${l.service}"`,
      `"${l.status}"`,
      `"$${l.estimatedMonthlyRetainer}"`,
      `"$${l.estimatedARR}"`,
      `"${l.source}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LeadPilot_Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredLeads.length} leads to CSV!`);
  };

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'New':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-semibold shrink-0">
            New
          </span>
        );
      case 'Qualified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-on-tertiary-container text-tertiary text-xs font-semibold shrink-0">
            Qualified
          </span>
        );
      case 'Contacted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold shrink-0">
            Contacted
          </span>
        );
      case 'Converted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary text-on-tertiary text-xs font-semibold shrink-0">
            Converted
          </span>
        );
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
    <div className="flex flex-col w-full max-w-5xl mx-auto px-gutter pb-6 gap-space-md">
      {/* Top Title and Action Bar */}
      <div className="flex items-center justify-between pt-space-xs flex-wrap gap-2">
        <div className="flex items-center gap-space-sm">
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">All Leads</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
            {leads.length} leads
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <button
            onClick={() => setIsCsvImportOpen(true)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
            title="Import CSV"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span className="hidden sm:inline">Import CSV</span>
          </button>
          <button
            aria-label="Export Leads CSV"
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors shadow-sm active:scale-95 disabled:opacity-40"
            title="Export CSV"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
          <button
            onClick={() => setIsAiScraperOpen(true)}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-primary-fixed hover:bg-surface-container-high text-primary font-medium text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span className="whitespace-nowrap">Find with AI</span>
          </button>
          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary font-semibold text-xs sm:text-sm shadow-sm active:scale-95 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Interactive Search Input */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>
        <input
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-outline text-sm shadow-sm outline-none focus:bg-surface-container-low transition-all border border-surface-container"
          placeholder="Search by name, business, or email..."
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
          </button>
        )}
      </div>

      {/* Status Filter Pills (Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-gutter px-gutter py-1">
        <button
          onClick={() => {
            setSelectedStatus('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
            selectedStatus === 'all'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
          type="button"
        >
          <span>All</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {statusCounts.all}
          </span>
        </button>
        <button
          onClick={() => {
            setSelectedStatus('new');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
            selectedStatus === 'new'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
          type="button"
        >
          <span className="w-2 h-2 rounded-full bg-primary-container"></span>
          <span>New</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === 'new' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {statusCounts.new}
          </span>
        </button>
        <button
          onClick={() => {
            setSelectedStatus('qualified');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
            selectedStatus === 'qualified'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
          type="button"
        >
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
          <span>Qualified</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === 'qualified' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {statusCounts.qualified}
          </span>
        </button>
        <button
          onClick={() => {
            setSelectedStatus('contacted');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
            selectedStatus === 'contacted'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
          type="button"
        >
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          <span>Contacted</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === 'contacted' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {statusCounts.contacted}
          </span>
        </button>
        <button
          onClick={() => {
            setSelectedStatus('converted');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
            selectedStatus === 'converted'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
          type="button"
        >
          <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
          <span>Converted</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${selectedStatus === 'converted' ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>
            {statusCounts.converted}
          </span>
        </button>
      </div>

      {/* Service Category Sub-Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-gutter px-gutter py-0.5">
        <button
          onClick={() => {
            setSelectedService('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            selectedService === 'all'
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span className="material-symbols-outlined text-[14px]">tune</span>
          <span>All Services</span>
        </button>
        <button
          onClick={() => {
            setSelectedService('bookkeeping');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            selectedService === 'bookkeeping'
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Bookkeeping</span>
        </button>
        <button
          onClick={() => {
            setSelectedService('tax preparation');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            selectedService === 'tax preparation'
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Tax Preparation</span>
        </button>
        <button
          onClick={() => {
            setSelectedService('financial advisory');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            selectedService === 'financial advisory'
              ? 'bg-surface-container-high text-on-surface'
              : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface'
          }`}
          type="button"
        >
          <span>Financial Advisory</span>
        </button>
      </div>

      {/* Leads Cards Directory */}
      <div className="flex flex-col gap-space-sm pt-1">
        {paginatedLeads.map((lead) => (
          <div
            key={lead.id}
            className="lead-card flex flex-col p-4 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all border border-surface-container/60 hover:border-outline-variant/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer"
                onClick={() => setSelectedLeadId(lead.id)}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-fixed text-on-primary-fixed text-sm font-semibold shrink-0">
                  {getInitials(lead.name)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-on-surface truncate leading-tight hover:text-primary transition-colors">
                    {lead.name}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">
                    {lead.company}
                  </span>
                </div>
              </div>
              {getStatusBadge(lead.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 bg-surface-container-low p-2.5 rounded-lg">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-outline text-[16px]">receipt_long</span>
                <span className="text-xs text-on-surface-variant truncate font-medium">
                  {lead.service}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className="material-symbols-outlined text-outline text-[16px]">travel_explore</span>
                <span className="text-xs text-on-surface-variant truncate font-medium">
                  {lead.source}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-1">
              <div className="flex items-center gap-2">
                {lead.phone && (
                  <a
                    aria-label={`Call ${lead.name}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-on-primary transition-colors"
                    href={`tel:${lead.phone.replace(/[^0-9]/g, '')}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                  </a>
                )}
                {lead.email && (
                  <a
                    aria-label={`Email ${lead.name}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container text-on-surface-variant hover:bg-primary-container hover:text-on-primary transition-colors"
                    href={`mailto:${lead.email}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </a>
                )}
              </div>
              <button
                onClick={() => setSelectedLeadId(lead.id)}
                className="flex items-center gap-1 text-primary hover:text-primary-container font-semibold text-sm py-1 px-2.5 rounded-lg hover:bg-surface-container transition-colors"
                type="button"
              >
                <span>View / Edit</span>
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        ))}

        {/* Empty States */}
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest rounded-2xl shadow-sm border border-surface-container mt-2">
            <div className="w-16 h-16 rounded-2xl bg-primary-fixed/50 flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-[32px]">folder_open</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1.5">No CRM Leads Recorded Yet</h3>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed mb-6">
              Your client database is ready for real records. Add your first financial advisory or accounting lead manually, or bulk import via CSV with automatic field mapping.
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={() => setIsAddLeadOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Add First Lead</span>
              </button>
              <button
                onClick={() => setIsCsvImportOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold border border-outline-variant/40 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Import CSV File</span>
              </button>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container mt-2">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary mb-3">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="text-base font-semibold text-on-surface mb-1">No leads found</h3>
            <p className="text-xs text-on-surface-variant max-w-[240px]">
              Try adjusting your search terms or clearing your status filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedService('all');
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold transition-colors cursor-pointer"
              type="button"
            >
              Reset All Filters
            </button>
          </div>
        ) : null}
      </div>

      {/* Pagination & Count text */}
      {filteredLeads.length > 0 && (
        <div className="flex items-center justify-between pt-3 pb-2 px-1">
          <span className="text-xs text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">{paginatedLeads.length}</span> of {filteredLeads.length} leads
          </span>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous Page"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline ${
                currentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container text-on-surface active:scale-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-2 text-xs font-semibold text-on-surface">
              {currentPage} / {totalPages}
            </span>
            <button
              aria-label="Next Page"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-outline ${
                currentPage >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container text-on-surface active:scale-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

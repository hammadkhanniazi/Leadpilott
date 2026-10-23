import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export const ReportsView: React.FC = () => {
  const { leads, showToast, setIsAddLeadOpen, setIsCsvImportOpen } = useApp();
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Compute live KPI analytics
  const metrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'New').length;
    const contactedCount = leads.filter((l) => l.status === 'Contacted').length;
    const qualifiedCount = leads.filter((l) => l.status === 'Qualified').length;
    const convertedCount = leads.filter((l) => l.status === 'Converted').length;

    const totalARR = leads.reduce((acc, curr) => acc + (curr.estimatedARR || 0), 0);
    const qualifiedARR = leads
      .filter((l) => l.status === 'Qualified' || l.status === 'Converted')
      .reduce((acc, curr) => acc + (curr.estimatedARR || 0), 0);

    const avgRetainer = total > 0 ? Math.round(leads.reduce((acc, curr) => acc + curr.estimatedMonthlyRetainer, 0) / total) : 0;
    const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : '0';

    // Service breakdown
    const services = {
      Bookkeeping: leads.filter((l) => l.service === 'Bookkeeping'),
      TaxPrep: leads.filter((l) => l.service === 'Tax Preparation'),
      Advisory: leads.filter((l) => l.service === 'Financial Advisory'),
      Accounting: leads.filter((l) => l.service === 'Accounting'),
    };

    // Channel breakdown
    const channels: Record<string, number> = {};
    leads.forEach((l) => {
      channels[l.source] = (channels[l.source] || 0) + 1;
    });

    return {
      total,
      newCount,
      contactedCount,
      qualifiedCount,
      convertedCount,
      totalARR,
      qualifiedARR,
      avgRetainer,
      conversionRate,
      services,
      channels,
    };
  }, [leads]);

  const handleExportReport = () => {
    const reportData = [
      ['Metric', 'Value'],
      ['Total Leads in System', metrics.total],
      ['Total Estimated Pipeline ARR', `$${metrics.totalARR.toLocaleString()}`],
      ['Active Qualified & Converted ARR', `$${metrics.qualifiedARR.toLocaleString()}`],
      ['Average Monthly Retainer', `$${metrics.avgRetainer.toLocaleString()}`],
      ['Lead-to-Client Conversion Rate', `${metrics.conversionRate}%`],
      ['New Leads', metrics.newCount],
      ['Contacted Leads', metrics.contactedCount],
      ['Qualified Leads', metrics.qualifiedCount],
      ['Converted Deals', metrics.convertedCount],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + reportData.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LeadPilot_KPI_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('KPI Performance Report downloaded!');
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto px-gutter pb-space-xl space-y-space-lg">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-space-xs flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Practice KPI & Analytics</h1>
          <p className="text-xs text-on-surface-variant">Real-time pipeline health, conversion metrics, and revenue forecasts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-surface-container-low p-1 rounded-xl flex items-center border border-surface-container text-xs font-semibold">
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRange === 'month' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRange === 'quarter' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeRange === 'year' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
              }`}
            >
              YTD
            </button>
          </div>
          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Empty State Banner if no records exist */}
      {metrics.total === 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[26px]">insights</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">No CRM Records Tracked Yet</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Practice KPIs, ARR forecasting, and conversion funnels will calculate automatically as client leads are added.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Lead</span>
            </button>
            <button
              onClick={() => setIsCsvImportOpen(true)}
              className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-semibold border border-outline-variant/40 shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Import CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-sm">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60">
          <span className="text-xs font-medium text-on-surface-variant">Active Qualified ARR</span>
          <div className="text-2xl font-bold text-primary font-metric-num mt-1">
            ${metrics.qualifiedARR.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-tertiary mt-1 font-semibold">
            <span className="material-symbols-outlined text-[14px]">
              {metrics.total > 0 ? 'trending_up' : 'info'}
            </span>
            <span>
              {metrics.total > 0 ? `${metrics.qualifiedCount} Qualified deals active` : 'Awaiting client records'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60">
          <span className="text-xs font-medium text-on-surface-variant">Avg. Retainer Value</span>
          <div className="text-2xl font-bold text-on-surface font-metric-num mt-1">
            ${metrics.avgRetainer.toLocaleString()}{' '}
            <span className="text-xs text-on-surface-variant font-normal">/mo</span>
          </div>
          <div className="text-[11px] text-on-surface-variant mt-1">
            Per active engagement
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60">
          <span className="text-xs font-medium text-on-surface-variant">Conversion Velocity</span>
          <div className="text-2xl font-bold text-tertiary font-metric-num mt-1">
            {metrics.conversionRate}%
          </div>
          <div className="text-[11px] text-tertiary mt-1 font-semibold">
            {metrics.convertedCount} won from {metrics.total} leads
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container/60">
          <span className="text-xs font-medium text-on-surface-variant">Total Pipeline ARR</span>
          <div className="text-2xl font-bold text-on-surface font-metric-num mt-1">
            ${metrics.totalARR.toLocaleString()}
          </div>
          <div className="text-[11px] text-on-surface-variant mt-1">
            Across {metrics.total} tracked accounts
          </div>
        </div>
      </div>

      {/* Visual Conversion Funnel */}
      <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface">Pipeline Stage Progression Funnel</h3>
            <p className="text-xs text-on-surface-variant">Drop-off & throughput at each operational milestone</p>
          </div>
          <span className="text-xs font-semibold text-primary bg-primary-fixed px-2.5 py-0.5 rounded-full">
            Real-time Live Sync
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            {
              label: 'New Inbound',
              count: metrics.newCount,
              color: 'bg-primary-container',
              pct: metrics.total > 0 ? `${Math.round((metrics.newCount / metrics.total) * 100)}%` : '0%',
            },
            {
              label: 'Contacted',
              count: metrics.contactedCount,
              color: 'bg-secondary',
              pct: metrics.total > 0 ? `${Math.round((metrics.contactedCount / metrics.total) * 100)}%` : '0%',
            },
            {
              label: 'Qualified',
              count: metrics.qualifiedCount,
              color: 'bg-tertiary',
              pct: metrics.total > 0 ? `${Math.round((metrics.qualifiedCount / metrics.total) * 100)}%` : '0%',
            },
            {
              label: 'Converted Client',
              count: metrics.convertedCount,
              color: 'bg-tertiary-container',
              pct: metrics.total > 0 ? `${Math.round((metrics.convertedCount / metrics.total) * 100)}%` : '0%',
            },
          ].map((stage) => (
            <div key={stage.label} className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>{stage.label}</span>
                  <span className="font-semibold text-on-surface">{stage.pct}</span>
                </div>
                <div className="text-xl font-bold text-on-surface font-metric-num mt-1">
                  {stage.count} <span className="text-xs font-normal text-on-surface-variant">leads</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mt-3">
                <div className={`h-full ${stage.color}`} style={{ width: stage.pct }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Mix & Channel Attribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
        {/* Service Mix */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Revenue by Advisory Practice</h3>
            <span className="text-xs text-on-surface-variant">Annualized Value</span>
          </div>
          <div className="space-y-2.5">
            {[
              {
                name: 'Bookkeeping & Reconciliations',
                items: metrics.services.Bookkeeping,
                color: 'bg-primary',
              },
              {
                name: 'Tax Preparation & Strategy',
                items: metrics.services.TaxPrep,
                color: 'bg-tertiary',
              },
              {
                name: 'Fractional CFO & Advisory',
                items: metrics.services.Advisory,
                color: 'bg-secondary',
              },
              {
                name: 'Corporate Accounting & Audit',
                items: metrics.services.Accounting,
                color: 'bg-tertiary-container',
              },
            ].map((srv) => {
              const count = srv.items.length;
              const arr = srv.items.reduce((acc, curr) => acc + curr.estimatedARR, 0);
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={srv.name} className="p-2.5 bg-surface-container-low rounded-lg border border-surface-container">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface truncate">{srv.name}</span>
                    <span className="font-bold text-primary font-metric-num">${arr.toLocaleString()} ARR</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mt-1">
                    <span>{count} accounts ({pct}%)</span>
                    <span className="text-outline">Active scope</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel Attribution */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-on-surface">Acquisition Attribution</h3>
            <span className="text-xs text-on-surface-variant">Lead Inbound Source</span>
          </div>
          <div className="space-y-2">
            {Object.entries(metrics.channels).map(([channel, count]) => {
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              return (
                <div key={channel} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface font-medium">{channel}</span>
                    <span className="text-on-surface-variant font-semibold">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

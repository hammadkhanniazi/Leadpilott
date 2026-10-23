import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmailNotification } from '../types';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationRead,
    triggerTestEmail,
    currentUser,
    setSelectedLeadId,
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState(currentUser?.email || '');
  const [testSubject, setTestSubject] = useState('[Urgent] High-Priority Advisory Notice');
  const [testBody, setTestBody] = useState('Quarterly compliance deadline alert for active tax leads.');

  React.useEffect(() => {
    if (currentUser?.email) {
      setTestEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerTestEmail(testEmail, testSubject, testBody, 'urgent_alert');
    setIsTestModalOpen(false);
  };

  const getIconForType = (type: EmailNotification['type']) => {
    switch (type) {
      case 'followup_due': return 'alarm_on';
      case 'lead_assigned': return 'person_add';
      case 'lead_converted': return 'celebration';
      case 'urgent_alert': return 'warning';
      case 'note_added': return 'edit_note';
      default: return 'mail';
    }
  };

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-surface-container-lowest h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-surface-container">
        {/* Drawer Header */}
        <div className="p-4 border-b border-surface-container flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">mail</span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">Automated Email System</h3>
              <p className="text-[11px] text-on-surface-variant">Real-time alerts & delivery queue</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="text-[11px] font-semibold text-primary bg-primary-fixed hover:bg-surface-container-high px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">send</span>
              <span>Test Email</span>
            </button>
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Email Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((notif) => {
            const isExpanded = expandedId === notif.id;
            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) markNotificationRead(notif.id);
                  setExpandedId(isExpanded ? null : notif.id);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  !notif.read
                    ? 'border-primary/40 bg-primary/5 shadow-xs'
                    : 'border-surface-container bg-surface-container-lowest hover:bg-surface-container-low'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[16px]">
                        {getIconForType(notif.type)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-on-surface truncate block">
                        {notif.subject}
                      </span>
                      <span className="text-[11px] text-on-surface-variant truncate block">
                        To: {notif.recipientEmail}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-outline">{notif.timestamp}</span>
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-tertiary mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      {notif.status}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
                  {notif.preview}
                </p>

                {/* Expanded Email Payload Preview */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-surface-container space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-container-low font-mono text-[11px] whitespace-pre-line text-on-surface leading-relaxed">
                      {notif.body}
                    </div>
                    {notif.relatedLeadId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLeadId(notif.relatedLeadId!);
                          setIsNotificationsOpen(false);
                        }}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 pt-1"
                        type="button"
                      >
                        <span>Open Related Lead File</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Test Email Dispatcher Modal */}
        {isTestModalOpen && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b pb-2 border-surface-container">
                <h4 className="text-sm font-bold text-on-surface">Dispatch Automated Alert</h4>
                <button
                  onClick={() => setIsTestModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              <form onSubmit={handleSendTest} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Recipient Email
                  </label>
                  <input
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Subject Line
                  </label>
                  <input
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                    Body Message
                  </label>
                  <textarea
                    className="w-full p-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    rows={3}
                    value={testBody}
                    onChange={(e) => setTestBody(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-surface-container text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs"
                  >
                    Send Email Alert
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

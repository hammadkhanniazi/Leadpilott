import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LeadService, LeadStatus, CsvParsedLead } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const { leads, addLead, currentUser, showToast } = useApp();

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [csvRawText, setCsvRawText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Field mapping state: key is CRM field, value is CSV column header
  const [fieldMapping, setFieldMapping] = useState<{
    name: string;
    company: string;
    email: string;
    phone: string;
    service: string;
    status: string;
    retainer: string;
    source: string;
    assignedAdvisorName: string;
    followUpDate: string;
    initialNotes: string;
  }>({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: '',
    status: '',
    retainer: '',
    source: '',
    assignedAdvisorName: '',
    followUpDate: '',
    initialNotes: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Complete reset of all temporary import state and HTML input
  const resetImportState = () => {
    setStep('upload');
    setCsvRawText('');
    setCsvHeaders([]);
    setCsvRows([]);
    setFileName('');
    setFileSize('');
    setOverwriteDuplicates(false);
    setIsImporting(false);
    setFieldMapping({
      name: '',
      company: '',
      email: '',
      phone: '',
      service: '',
      status: '',
      retainer: '',
      source: '',
      assignedAdvisorName: '',
      followUpDate: '',
      initialNotes: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset file selection and preview state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetImportState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetImportState();
    onClose();
  };

  const handleClearFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetImportState();
    showToast('File selection cleared');
  };

  const triggerFilePicker = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Clear HTML input value before clicking so selecting the exact same file fires onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  // Simple and robust CSV line splitter handling quoted strings
  const parseCsv = (text: string, sourceName?: string): boolean => {
    const lines = text.trim().split(/\r\n|\n/);
    if (lines.length < 2) {
      showToast('CSV must contain at least a header row and one client data row');
      return false;
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    if (headers.length === 0 || headers.every((h) => !h.trim())) {
      showToast('CSV headers appear empty or invalid.');
      return false;
    }

    const rows = lines.slice(1).map(parseLine).filter((r) => r.some((cell) => cell.length > 0));
    if (rows.length === 0) {
      showToast('No client data rows found below the header row.');
      return false;
    }

    setCsvHeaders(headers);
    setCsvRows(rows);

    // Auto-guess mapping based on header strings
    const autoMapping = {
      name: headers.find((h) => /name|contact|client|lead/i.test(h)) || headers[0] || '',
      company: headers.find((h) => /company|business|organization|firm|client/i.test(h)) || headers[1] || '',
      email: headers.find((h) => /email|mail/i.test(h)) || '',
      phone: headers.find((h) => /phone|mobile|cell|telephone/i.test(h)) || '',
      service: headers.find((h) => /service|need|product|type/i.test(h)) || '',
      status: headers.find((h) => /status|stage|pipeline/i.test(h)) || '',
      retainer: headers.find((h) => /retainer|arr|value|amount|fee|budget/i.test(h)) || '',
      source: headers.find((h) => /source|channel|campaign/i.test(h)) || '',
      assignedAdvisorName: headers.find((h) => /advisor|assign|rep|owner/i.test(h)) || '',
      followUpDate: headers.find((h) => /date|follow|deadline/i.test(h)) || '',
      initialNotes: headers.find((h) => /note|comment|description|detail/i.test(h)) || '',
    };

    setFieldMapping(autoMapping);
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      // User canceled the native file picker - keep current synchronized state
      return;
    }

    // Extension validation
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv')) {
      showToast('Invalid file format. Please select a valid .csv file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Non-empty check
    if (file.size === 0) {
      showToast('Selected file is empty (0 bytes). Please select a valid CSV.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const formattedSize =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        showToast('The selected CSV file has no readable text content.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const success = parseCsv(text, file.name);
      if (success) {
        setFileName(file.name);
        setFileSize(formattedSize);
        setCsvRawText(text);
      } else {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('Error reading the selected CSV file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!csvRawText.trim()) {
      showToast('Please paste CSV text');
      return;
    }
    const success = parseCsv(csvRawText, 'Pasted_Data.csv');
    if (success) {
      setFileName('Pasted_Data.csv');
      setFileSize(`${(new Blob([csvRawText]).size / 1024).toFixed(1)} KB`);
      setStep('mapping');
    }
  };

  // Convert parsed CSV rows into typed Lead objects with validation & duplicate detection
  const parsedRecords: CsvParsedLead[] = useMemo(() => {
    if (!isOpen || (step !== 'preview' && step !== 'mapping')) return [];

    const getColIndex = (colName: string) => csvHeaders.indexOf(colName);
    const nameIdx = getColIndex(fieldMapping.name);
    const companyIdx = getColIndex(fieldMapping.company);
    const emailIdx = getColIndex(fieldMapping.email);
    const phoneIdx = getColIndex(fieldMapping.phone);
    const serviceIdx = getColIndex(fieldMapping.service);
    const statusIdx = getColIndex(fieldMapping.status);
    const retainerIdx = getColIndex(fieldMapping.retainer);
    const sourceIdx = getColIndex(fieldMapping.source);
    const advisorIdx = getColIndex(fieldMapping.assignedAdvisorName);
    const followDateIdx = getColIndex(fieldMapping.followUpDate);
    const notesIdx = getColIndex(fieldMapping.initialNotes);

    return csvRows.map((row) => {
      const name = nameIdx !== -1 ? row[nameIdx] || '' : '';
      const company = companyIdx !== -1 ? row[companyIdx] || '' : '';
      const email = emailIdx !== -1 ? row[emailIdx] || '' : '';
      const phone = phoneIdx !== -1 ? row[phoneIdx] || '' : '';
      const rawService = serviceIdx !== -1 ? row[serviceIdx] || '' : '';
      const rawStatus = statusIdx !== -1 ? row[statusIdx] || '' : '';
      const rawRetainer = retainerIdx !== -1 ? row[retainerIdx] || '' : '';
      const source = sourceIdx !== -1 ? row[sourceIdx] || 'CSV Import' : 'CSV Import';
      const defaultAdvisor = currentUser?.name || 'Unassigned';
      const assignedAdvisorName = advisorIdx !== -1 ? row[advisorIdx] || defaultAdvisor : defaultAdvisor;
      const followUpDate = followDateIdx !== -1 ? row[followDateIdx] || '' : '';
      const initialNotes = notesIdx !== -1 ? row[notesIdx] || '' : '';

      // Normalize service
      let service: LeadService = 'Bookkeeping';
      if (/tax/i.test(rawService)) service = 'Tax Preparation';
      else if (/advis/i.test(rawService)) service = 'Financial Advisory';
      else if (/account/i.test(rawService)) service = 'Accounting';

      // Normalize status
      let status: LeadStatus = 'New';
      if (/qualif/i.test(rawStatus)) status = 'Qualified';
      else if (/contact/i.test(rawStatus)) status = 'Contacted';
      else if (/convert|won/i.test(rawStatus)) status = 'Converted';

      // Parse numerical retainer
      const cleanRetainer = parseFloat(rawRetainer.replace(/[^0-9.]/g, '')) || 750;

      // Validation
      let isValid = true;
      let validationError = '';
      if (!name.trim()) {
        isValid = false;
        validationError = 'Missing Contact Name';
      } else if (!company.trim()) {
        isValid = false;
        validationError = 'Missing Company / Entity';
      }

      // Duplicate detection against existing leads in CRM
      let isDuplicate = false;
      let duplicateReason = '';
      const existingMatch = leads.find(
        (existing) =>
          (email && existing.email && existing.email.toLowerCase() === email.toLowerCase()) ||
          (company && existing.company && existing.company.toLowerCase() === company.toLowerCase()) ||
          (phone && existing.phone && existing.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''))
      );

      if (existingMatch) {
        isDuplicate = true;
        duplicateReason = `Matches existing lead (${existingMatch.company})`;
      }

      return {
        name,
        company,
        email,
        phone,
        service,
        status,
        source,
        estimatedMonthlyRetainer: cleanRetainer,
        assignedAdvisorName,
        followUpDate,
        initialNotes,
        isDuplicate,
        duplicateReason,
        isValid,
        validationError,
      };
    });
  }, [csvRows, csvHeaders, fieldMapping, leads, currentUser?.name, step, isOpen]);

  const validCount = parsedRecords.filter((r) => r.isValid && (!r.isDuplicate || overwriteDuplicates)).length;
  const duplicateCount = parsedRecords.filter((r) => r.isDuplicate).length;
  const invalidCount = parsedRecords.filter((r) => !r.isValid).length;

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      let importedCount = 0;
      for (const record of parsedRecords) {
        if (!record.isValid) continue;
        if (record.isDuplicate && !overwriteDuplicates) continue;

        await addLead({
          name: record.name,
          company: record.company,
          email: record.email,
          phone: record.phone,
          service: record.service,
          status: record.status,
          source: record.source,
          estimatedMonthlyRetainer: record.estimatedMonthlyRetainer,
          assignedAdvisorName: record.assignedAdvisorName,
          followUpDate: record.followUpDate,
          initialNotes: record.initialNotes,
        });
        importedCount++;
      }

      showToast(`Successfully imported ${importedCount} client records into CRM!`);
      handleClose();
    } catch (err: any) {
      showToast(`Import error: ${err?.message || 'Failed to complete import'}`);
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="csvImportModalTitle"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
    >
      {/* Hidden native HTML file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container bg-surface-container-low/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-xs">
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface" id="csvImportModalTitle">
                Import Client Leads via CSV
              </h2>
              <p className="text-xs text-on-surface-variant">
                Upload real pipeline records with field mapping and duplicate detection
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            type="button"
            title="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-surface-container bg-surface-container-low text-xs font-semibold px-6 shrink-0">
          <button
            onClick={() => setStep('upload')}
            className={`py-3 flex-1 text-center border-b-2 transition-all cursor-pointer ${
              step === 'upload' ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            1. Select / Paste CSV
          </button>
          <button
            disabled={csvHeaders.length === 0}
            onClick={() => setStep('mapping')}
            className={`py-3 flex-1 text-center border-b-2 transition-all ${
              step === 'mapping'
                ? 'border-primary text-primary font-bold cursor-pointer'
                : 'border-transparent text-on-surface-variant disabled:opacity-40 cursor-pointer'
            }`}
          >
            2. Map Fields
          </button>
          <button
            disabled={csvHeaders.length === 0}
            onClick={() => setStep('preview')}
            className={`py-3 flex-1 text-center border-b-2 transition-all ${
              step === 'preview'
                ? 'border-primary text-primary font-bold cursor-pointer'
                : 'border-transparent text-on-surface-variant disabled:opacity-40 cursor-pointer'
            }`}
          >
            3. Review & Import
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* STEP 1: UPLOAD / PASTE */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* If a CSV file is currently selected: display dedicated file card with Clear and Replace controls */}
              {fileName ? (
                <div className="border border-primary/30 bg-primary-fixed/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">description</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs uppercase tracking-wider font-bold text-primary">Selected CSV File</div>
                        <div className="text-sm font-bold text-on-surface truncate" title={fileName}>
                          {fileName}
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5">
                          {fileSize && <span>{fileSize} • </span>}
                          <span>{csvRows.length} client {csvRows.length === 1 ? 'record' : 'records'} found</span>
                          <span> • {csvHeaders.length} columns detected</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for selected file */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setStep('mapping')}
                      className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Proceed to Field Mapping</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerFilePicker}
                      className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Choose a different CSV file from your computer"
                    >
                      <span className="material-symbols-outlined text-[16px]">folder_open</span>
                      <span>Choose Different File</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="px-3.5 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                      title="Remove the selected file and clear selection"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      <span>Remove File</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty state dropzone */
                <div
                  onClick={triggerFilePicker}
                  className="border-2 border-dashed border-outline-variant/60 hover:border-primary rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-surface-container-low/40 hover:bg-surface-container-low transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                  </div>
                  <div className="text-sm font-bold text-on-surface">Click to browse your CSV file</div>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
                    Select a .csv file containing client contacts, companies, retainers, and pipeline stages.
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-semibold">
                    <span className="material-symbols-outlined text-[14px]">attach_file</span>
                    Browse .csv file
                  </span>
                </div>
              )}

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-surface-container"></div>
                <span className="flex-shrink mx-3 text-xs text-outline uppercase font-semibold">or paste CSV text</span>
                <div className="flex-grow border-t border-surface-container"></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Raw CSV Data (Comma separated)
                </label>
                <textarea
                  rows={4}
                  className="w-full p-3 rounded-xl bg-surface-container-low text-xs font-mono text-on-surface border border-outline-variant/40 focus:border-primary outline-none"
                  placeholder="Contact Name,Company,Email,Phone,Service,Status,Retainer&#10;Alice Wang,Apex Health Group,alice@apexhealth.com,555-0199,Bookkeeping,New,850"
                  value={csvRawText}
                  onChange={(e) => setCsvRawText(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handlePasteSubmit}
                disabled={!csvRawText.trim()}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                Parse Pasted CSV Data
              </button>
            </div>
          )}

          {/* STEP 2: FIELD MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              {/* Active File Banner with Replace and Clear Controls */}
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs text-on-surface-variant">
                  <span className="font-bold text-on-surface">{fileName || 'CSV File'}</span>
                  <span className="text-outline"> • {csvRows.length} rows found</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
                    <span>Change File</span>
                  </button>
                  <span className="text-outline">|</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-xs text-error font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Contact Name <span className="text-error">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.name}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, name: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Company / Organization <span className="text-error">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.company}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, company: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Email Address</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.email}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, email: e.target.value })}
                  >
                    <option value="">-- (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Phone Number</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.phone}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, phone: e.target.value })}
                  >
                    <option value="">-- (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Service Required</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.service}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, service: e.target.value })}
                  >
                    <option value="">-- (Optional - default Bookkeeping) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Status / Stage</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.status}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, status: e.target.value })}
                  >
                    <option value="">-- (Optional - default New) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Estimated Monthly Retainer ($)</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.retainer}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, retainer: e.target.value })}
                  >
                    <option value="">-- (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Lead Source</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.source}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, source: e.target.value })}
                  >
                    <option value="">-- (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Assigned Team Member</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.assignedAdvisorName}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, assignedAdvisorName: e.target.value })}
                  >
                    <option value="">-- (Optional - default Current User) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Follow-Up Date</label>
                  <select
                    className="w-full h-9 px-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/40"
                    value={fieldMapping.followUpDate}
                    onChange={(e) => setFieldMapping({ ...fieldMapping, followUpDate: e.target.value })}
                  >
                    <option value="">-- (Optional) --</option>
                    {csvHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Back to File Selection
                </button>
                <button
                  type="button"
                  onClick={() => setStep('preview')}
                  disabled={!fieldMapping.name || !fieldMapping.company}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  Preview & Validate Rows
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & DUPLICATE DETECTION */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Active file sub-header */}
              <div className="flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl border border-surface-container">
                <div className="truncate">
                  <span>File: </span>
                  <strong className="text-on-surface">{fileName}</strong>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={triggerFilePicker}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Replace File
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-error font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-primary-fixed/40 border border-primary/20 text-center">
                  <div className="text-xl font-bold text-primary">{validCount}</div>
                  <div className="text-[11px] font-semibold text-on-surface-variant">Ready to Import</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="text-xl font-bold text-amber-600">{duplicateCount}</div>
                  <div className="text-[11px] font-semibold text-on-surface-variant">Duplicates Found</div>
                </div>
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-center">
                  <div className="text-xl font-bold text-error">{invalidCount}</div>
                  <div className="text-[11px] font-semibold text-on-surface-variant">Invalid Rows</div>
                </div>
              </div>

              {/* Duplicate Handling Guard */}
              {duplicateCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    <span>Duplicate Detection Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {duplicateCount} record(s) share an email or business name with existing CRM records. By default, existing records are preserved and not overwritten.
                  </p>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={overwriteDuplicates}
                      onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                      className="rounded text-primary focus:ring-0 cursor-pointer"
                    />
                    <span>I confirm: overwrite existing records with imported CSV data</span>
                  </label>
                </div>
              )}

              {/* Data Table Preview */}
              <div className="border border-surface-container rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant text-[11px] font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Service</th>
                      <th className="p-2.5">Retainer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {parsedRecords.map((r, i) => (
                      <tr key={i} className={`hover:bg-surface-container-low/50 ${!r.isValid ? 'opacity-40 bg-error/5' : ''}`}>
                        <td className="p-2.5 whitespace-nowrap">
                          {r.isDuplicate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Duplicate
                            </span>
                          ) : !r.isValid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/20 text-error">
                              Invalid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-fixed text-primary">
                              Valid
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-on-surface whitespace-nowrap">{r.name}</td>
                        <td className="p-2.5 text-on-surface-variant whitespace-nowrap">{r.company}</td>
                        <td className="p-2.5 text-on-surface-variant whitespace-nowrap">{r.email || '—'}</td>
                        <td className="p-2.5 text-on-surface-variant whitespace-nowrap">{r.service}</td>
                        <td className="p-2.5 font-medium text-on-surface whitespace-nowrap">${r.estimatedMonthlyRetainer}/mo</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Back to Mapping
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={validCount === 0 || isImporting}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">file_download_done</span>
                  <span>{isImporting ? 'Importing Client Records...' : `Import ${validCount} Leads to CRM`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

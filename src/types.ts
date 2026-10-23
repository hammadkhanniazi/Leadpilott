export type UserRole = 'admin' | 'advisor' | 'associate';
export type UserApprovalStatus = 'approved' | 'pending' | 'denied' | 'revoked' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  department: string;
  companyId?: string;
  approvalStatus: UserApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  createdAt: string;
}

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted';
export type LeadService = 'Bookkeeping' | 'Tax Preparation' | 'Financial Advisory' | 'Accounting';

export interface LeadNote {
  id: string;
  leadId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface ClientOperations {
  location?: string;
  bankFeeds?: string;
  verifiedBadge?: string;
  image?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  service: LeadService;
  services?: LeadService[];
  status: LeadStatus;
  source: string;
  acquisitionUrl?: string;
  estimatedMonthlyRetainer: number;
  estimatedARR: number;
  notes: LeadNote[];
  initialNotes?: string;
  createdAt: string;
  lastContactDate?: string;
  followUpDate?: string;
  assignedAdvisorId?: string;
  assignedAdvisorName?: string;
  clientOperations?: ClientOperations;
  avatar?: string;
  companyId?: string;
}

export type FollowUpBucket = 'today' | 'upcoming' | 'completed';
export type FollowUpPriority = 'High Priority' | 'Standard' | 'High Value' | 'Discovery' | 'In Pipeline';

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  leadAvatar?: string;
  dueTime: string; // e.g. "Today, 3:00 PM"
  dueDate: string; // ISO date
  bucket: FollowUpBucket;
  priority: FollowUpPriority;
  actionSummary: string;
  proposalAmount?: string;
  service: string;
  leadStatus: LeadStatus;
  completed: boolean;
  completedAt?: string;
  phone?: string;
  email?: string;
  companyId?: string;
}

export type NotificationType = 'lead_assigned' | 'followup_due' | 'lead_converted' | 'urgent_alert' | 'note_added';

export interface EmailNotification {
  id: string;
  type: NotificationType;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  preview: string;
  body: string;
  relatedLeadId?: string;
  leadName?: string;
  status: 'sent' | 'delivered';
  timestamp: string;
  read?: boolean;
  companyId?: string;
}

export interface DiscoveredLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  isDuplicate: boolean;
  service?: LeadService;
  source: string;
}

export interface CsvParsedLead {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: LeadService;
  status: LeadStatus;
  source: string;
  estimatedMonthlyRetainer: number;
  assignedAdvisorName?: string;
  followUpDate?: string;
  initialNotes?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationError?: string;
}

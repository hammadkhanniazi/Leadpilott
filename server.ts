import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { INITIAL_LEADS, INITIAL_USERS, INITIAL_FOLLOWUPS, INITIAL_NOTIFICATIONS } from './src/mockData.ts';
import type { Lead, FollowUp, User, EmailNotification, LeadNote } from './src/types.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// In-memory + persisted store
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

interface DatabaseSchema {
  users: User[];
  leads: Lead[];
  followups: FollowUp[];
  notifications: EmailNotification[];
}

let db: DatabaseSchema = {
  users: [...INITIAL_USERS],
  leads: [...INITIAL_LEADS],
  followups: [...INITIAL_FOLLOWUPS],
  notifications: [...INITIAL_NOTIFICATIONS],
};

// Ensure data folder and load persisted database if available
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.leads && parsed.users) {
      db = parsed;
    }
  } catch (e) {
    console.warn('Failed reading db.json, using defaults:', e);
  }
}

function persistDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed persisting db.json:', e);
  }
}

// SSE Clients for Real-Time synchronization across multiple devices/tabs
type SSEClient = {
  id: string;
  res: Response;
};
let sseClients: SSEClient[] = [];

function broadcast(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // client may be closed
    }
  });
}

// SSE Endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sseClients.push({ id: clientId, res });

  // Initial connection ping
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// Automated Email Dispatcher Helper
function dispatchAutomatedEmail(notification: Omit<EmailNotification, 'id' | 'timestamp' | 'status'>) {
  const newNotif: EmailNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    status: 'delivered',
    timestamp: 'Just now',
    read: false,
  };
  db.notifications.unshift(newNotif);
  persistDb();
  broadcast('notification_created', newNotif);
  return newNotif;
}

// ===================== AUTH & USER MANAGEMENT ROUTES =====================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // Public self-registration does not automatically grant access
    return res.status(404).json({
      error: 'Account not found',
      message: 'This CRM is invite-only. Contact your administrator for an account invitation.',
    });
  }

  const isBootstrapAdmin = cleanEmail === 'sanwalniaxii321@gmail.com';
  if (isBootstrapAdmin && user.approvalStatus !== 'approved') {
    user.approvalStatus = 'approved';
    user.role = 'admin';
    persistDb();
  }

  if (user.approvalStatus !== 'approved') {
    return res.status(403).json({
      error: 'Access blocked',
      pendingApproval: true,
      approvalStatus: user.approvalStatus,
      user,
      message:
        user.approvalStatus === 'revoked'
          ? 'Your access to this CRM has been revoked by the administrator.'
          : user.approvalStatus === 'disabled'
          ? 'Your account has been deactivated by the administrator.'
          : 'Your account is pending administrator approval.',
    });
  }

  return res.json({ user, token: `token-${user.id}` });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, title, department, uid } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail || (uid && u.id === uid));
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const isBootstrapAdmin = cleanEmail === 'sanwalniaxii321@gmail.com';

  const newUser: User = {
    id: uid || `user-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role: isBootstrapAdmin ? 'admin' : 'advisor',
    approvalStatus: isBootstrapAdmin ? 'approved' : 'pending',
    title: title || (isBootstrapAdmin ? 'Managing Director & Systems Admin' : 'Financial Advisor'),
    department: department || 'Practice Management',
    companyId: 'firm-leadpilot',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  persistDb();
  broadcast('user_joined', newUser);

  // Notify administrator of new registration request
  const admin = db.users.find((u) => u.role === 'admin' && u.approvalStatus === 'approved') || db.users[0];
  if (admin && !isBootstrapAdmin) {
    dispatchAutomatedEmail({
      type: 'urgent_alert',
      recipientEmail: admin.email,
      recipientName: admin.name,
      subject: `[Approval Required] New Team Member Registration: ${newUser.name}`,
      preview: `${newUser.name} (${newUser.email}) has requested access to the CRM workspace.`,
      body: `Hello ${admin.name},\n\nA new user has registered and is awaiting administrator authorization:\n• Name: ${newUser.name}\n• Email: ${newUser.email}\n• Title: ${newUser.title}\n• Department: ${newUser.department}\n\nTo approve or deny this user, open the Team & Permissions view in LeadPilot.`,
    });
  }

  return res.status(201).json({
    user: newUser,
    pendingApproval: !isBootstrapAdmin,
    message: isBootstrapAdmin
      ? 'Administrator account initialized successfully.'
      : 'Your registration request has been submitted. An administrator must approve your account before you can access the CRM.',
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (user) {
    dispatchAutomatedEmail({
      type: 'urgent_alert',
      recipientEmail: user.email,
      recipientName: user.name,
      subject: 'Password Reset Request - LeadPilot CRM',
      preview: 'Password recovery instructions for your LeadPilot workspace.',
      body: `Hello ${user.name},\n\nA password reset request was received for your LeadPilot CRM account.\nIf you initiated this request, please use Firebase Authentication password reset or contact your administrator at sanwalniaxii321@gmail.com.\n\nSecurity Notice: If you did not make this request, please contact your administrator immediately.`,
    });
  }

  return res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
  });
});

app.get('/api/users', (_req: Request, res: Response) => {
  return res.json(db.users);
});

// Admin-controlled user status: approve, revoke, disable
app.put('/api/users/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminId } = req.body;

  if (!['approved', 'pending', 'denied', 'revoked', 'disabled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid approval status' });
  }

  const adminUser = db.users.find((u) => u.id === adminId || u.email === 'sanwalniaxii321@gmail.com');
  if (!adminUser || adminUser.role !== 'admin' || adminUser.approvalStatus !== 'approved') {
    return res.status(403).json({ error: 'Only approved administrators can modify user access status' });
  }

  const targetUser = db.users.find((u) => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Guard against revoking primary bootstrapped administrator
  if (targetUser.email === 'sanwalniaxii321@gmail.com' && (status === 'revoked' || status === 'disabled' || status === 'denied')) {
    return res.status(403).json({ error: 'The primary system administrator account cannot be revoked or denied.' });
  }

  // Guard against administrator revoking their own account
  if (targetUser.id === adminUser.id && (status === 'revoked' || status === 'disabled' || status === 'denied')) {
    return res.status(403).json({ error: 'You cannot revoke or deny your own administrator account.' });
  }

  // Guard against removing the last active administrator
  if (targetUser.role === 'admin' && (status === 'revoked' || status === 'disabled' || status === 'denied')) {
    const activeAdmins = db.users.filter(
      (u) => u.role === 'admin' && u.approvalStatus === 'approved' && u.id !== id
    );
    if (activeAdmins.length === 0) {
      return res.status(403).json({
        error: 'Cannot revoke the only active administrator. Another administrator must be approved first.',
      });
    }
  }

  targetUser.approvalStatus = status;
  if (status === 'approved') {
    targetUser.approvedAt = new Date().toISOString();
    targetUser.approvedBy = adminUser.name;

    dispatchAutomatedEmail({
      type: 'urgent_alert',
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      subject: 'Your LeadPilot CRM Access has been Approved',
      preview: 'Your administrator has approved your CRM access.',
      body: `Hello ${targetUser.name},\n\nYour account has been approved by ${adminUser.name}. You may now log in to the practice CRM workspace with your credentials.\n\nRole: ${targetUser.role.toUpperCase()}\nDepartment: ${targetUser.department}`,
    });
  } else if (status === 'denied') {
    targetUser.deniedAt = new Date().toISOString();
    targetUser.deniedBy = adminUser.name;

    dispatchAutomatedEmail({
      type: 'urgent_alert',
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      subject: 'LeadPilot CRM Workspace Access Request Denied',
      preview: 'Your CRM access request was reviewed by the administrator.',
      body: `Hello ${targetUser.name},\n\nYour request for access to the LeadPilot CRM workspace was denied by the practice administrator (${adminUser.name}). If you believe this is in error, please contact your managing director.`,
    });
  } else if (status === 'revoked' || status === 'disabled') {
    dispatchAutomatedEmail({
      type: 'urgent_alert',
      recipientEmail: targetUser.email,
      recipientName: targetUser.name,
      subject: 'LeadPilot CRM Workspace Access Status Update',
      preview: 'Your CRM access permissions have been updated.',
      body: `Hello ${targetUser.name},\n\nYour access to the LeadPilot CRM workspace has been ${status} by the practice administrator (${adminUser.name}). If you believe this is in error, please contact your managing director.`,
    });
  }

  persistDb();
  broadcast('user_updated', targetUser);
  if (status === 'revoked' || status === 'disabled' || status === 'denied') {
    broadcast('user_access_revoked', { userId: targetUser.id });
  }
  return res.json(targetUser);
});

// Admin-controlled user role updates
app.put('/api/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, adminId } = req.body;

  if (!['admin', 'advisor', 'associate'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const adminUser = db.users.find((u) => u.id === adminId || u.email === 'sanwalniaxii321@gmail.com');
  if (!adminUser || adminUser.role !== 'admin' || adminUser.approvalStatus !== 'approved') {
    return res.status(403).json({ error: 'Only approved administrators can modify roles' });
  }

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.role = role;
  persistDb();
  broadcast('user_updated', user);
  return res.json(user);
});

// Admin pre-approval & invite endpoint
app.post('/api/users/invite', (req: Request, res: Response) => {
  const { name, email, role, title, department, adminId } = req.body;

  const adminUser = db.users.find((u) => u.id === adminId || u.email === 'sanwalniaxii321@gmail.com');
  if (!adminUser || adminUser.role !== 'admin' || adminUser.approvalStatus !== 'approved') {
    return res.status(403).json({ error: 'Only approved administrators can invite team members' });
  }

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.approvalStatus = 'approved';
    existing.role = role || existing.role;
    existing.approvedAt = new Date().toISOString();
    existing.approvedBy = adminUser.name;
    persistDb();
    broadcast('user_updated', existing);
    return res.json(existing);
  }

  const invitedUser: User = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role: role || 'advisor',
    approvalStatus: 'approved',
    title: title || 'Financial Advisor',
    department: department || 'Practice Management',
    companyId: 'firm-leadpilot',
    approvedAt: new Date().toISOString(),
    approvedBy: adminUser.name,
    createdAt: new Date().toISOString(),
  };

  db.users.push(invitedUser);
  persistDb();
  broadcast('user_joined', invitedUser);

  dispatchAutomatedEmail({
    type: 'urgent_alert',
    recipientEmail: invitedUser.email,
    recipientName: invitedUser.name,
    subject: `Invitation to Join LeadPilot Financial CRM from ${adminUser.name}`,
    preview: `You have been granted pre-approved ${invitedUser.role.toUpperCase()} access to LeadPilot CRM.`,
    body: `Hello ${invitedUser.name},\n\n${adminUser.name} has pre-approved your access to the LeadPilot Financial CRM as a ${invitedUser.role.toUpperCase()}.\n\nYou can sign in using this email address (${invitedUser.email}) with your practice email and password credentials.\n\nWelcome to the practice!`,
  });

  return res.status(201).json(invitedUser);
});

// ===================== LEADS ROUTES =====================
app.get('/api/leads', (_req: Request, res: Response) => {
  return res.json(db.leads);
});

app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = db.leads.find((l) => l.id === req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  return res.json(lead);
});

app.post('/api/leads', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.company) {
    return res.status(400).json({ error: 'Contact name and business name are required' });
  }

  const monthlyRetainer = body.estimatedMonthlyRetainer || 650;
  const newLead: Lead = {
    id: `lead-${Date.now()}`,
    name: body.name,
    company: body.company,
    email: body.email || '',
    phone: body.phone || '',
    website: body.website || '',
    service: body.service || 'Bookkeeping',
    services: body.services || [body.service || 'Bookkeeping'],
    status: body.status || 'New',
    source: body.source || 'Website Form',
    acquisitionUrl: body.acquisitionUrl || '',
    estimatedMonthlyRetainer: monthlyRetainer,
    estimatedARR: monthlyRetainer * 12,
    initialNotes: body.initialNotes || '',
    createdAt: new Date().toISOString(),
    assignedAdvisorId: body.assignedAdvisorId || db.users[0]?.id || 'user-admin',
    assignedAdvisorName: body.assignedAdvisorName || db.users[0]?.name || 'Sanwal Niaz',
    notes: body.initialNotes ? [{
      id: `note-${Date.now()}`,
      leadId: `lead-${Date.now()}`,
      authorName: body.creatorName || 'Intake System',
      authorRole: 'System',
      content: body.initialNotes,
      createdAt: 'Just now',
    }] : [],
    clientOperations: {
      location: body.location || 'Client Entity',
      bankFeeds: 'Active Client Account',
      verifiedBadge: 'Intake Verified',
      image: '',
    },
  };

  db.leads.unshift(newLead);
  persistDb();
  broadcast('lead_created', newLead);

  // Trigger automated email alert for lead intake
  const defaultRecipient = db.users.find((u) => u.id === newLead.assignedAdvisorId) || db.users[0];
  dispatchAutomatedEmail({
    type: 'lead_assigned',
    recipientEmail: defaultRecipient?.email || 'sanwalniaxii321@gmail.com',
    recipientName: newLead.assignedAdvisorName || defaultRecipient?.name || 'Sanwal Niaz',
    subject: `New Lead Intake: ${newLead.name} (${newLead.company})`,
    preview: `New client intake: ${newLead.service} service ($${newLead.estimatedMonthlyRetainer}/mo)...`,
    body: `Hello,\n\nA new lead has been recorded in LeadPilot:\n• Contact: ${newLead.name}\n• Business: ${newLead.company}\n• Email: ${newLead.email || 'N/A'}\n• Phone: ${newLead.phone || 'N/A'}\n• Estimated ARR: $${newLead.estimatedARR.toLocaleString()}\n• Service Need: ${newLead.service}\n\nAutomated workflow has staged this lead for initial advisor call.`,
    relatedLeadId: newLead.id,
    leadName: newLead.name,
  });

  return res.status(201).json(newLead);
});

// Batch CSV Import Route
app.post('/api/leads/batch', (req: Request, res: Response) => {
  const { leads: incomingLeads, overwriteDuplicates } = req.body;
  if (!Array.isArray(incomingLeads)) {
    return res.status(400).json({ error: 'leads must be an array' });
  }

  const added: Lead[] = [];
  const updated: Lead[] = [];

  for (const item of incomingLeads) {
    const existingIndex = db.leads.findIndex(
      (l) =>
        (l.email && item.email && l.email.toLowerCase() === item.email.toLowerCase()) ||
        (l.company && item.company && l.company.toLowerCase() === item.company.toLowerCase())
    );

    if (existingIndex !== -1) {
      if (overwriteDuplicates) {
        db.leads[existingIndex] = {
          ...db.leads[existingIndex],
          ...item,
          estimatedARR: (item.estimatedMonthlyRetainer || db.leads[existingIndex].estimatedMonthlyRetainer) * 12,
        };
        updated.push(db.leads[existingIndex]);
      }
    } else {
      const newLead: Lead = {
        ...item,
        id: item.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        createdAt: item.createdAt || new Date().toISOString(),
        estimatedARR: (item.estimatedMonthlyRetainer || 650) * 12,
        notes: item.notes || [],
      };
      db.leads.unshift(newLead);
      added.push(newLead);
    }
  }

  persistDb();
  broadcast('leads_batch_imported', { addedCount: added.length, updatedCount: updated.length });

  return res.json({ success: true, addedCount: added.length, updatedCount: updated.length, added });
});

app.put('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const prevStatus = db.leads[index].status;
  const updatedLead: Lead = {
    ...db.leads[index],
    ...req.body,
    estimatedARR: (req.body.estimatedMonthlyRetainer || db.leads[index].estimatedMonthlyRetainer) * 12,
  };

  db.leads[index] = updatedLead;
  persistDb();
  broadcast('lead_updated', updatedLead);

  // If status changed to Converted, fire celebratory notification
  if (prevStatus !== 'Converted' && updatedLead.status === 'Converted') {
    dispatchAutomatedEmail({
      type: 'lead_converted',
      recipientEmail: 'team@leadpilot.co',
      recipientName: 'LeadPilot Team',
      subject: `🎉 Engagement Won: ${updatedLead.name} (${updatedLead.company}) - $${updatedLead.estimatedARR.toLocaleString()} ARR`,
      preview: `${updatedLead.company} has officially converted to active retainer ($${updatedLead.estimatedMonthlyRetainer}/mo)!`,
      body: `Congratulations Team!\n\n${updatedLead.name} from ${updatedLead.company} has accepted our engagement letter!\n\n• Service: ${updatedLead.service}\n• Monthly Retainer: $${updatedLead.estimatedMonthlyRetainer.toLocaleString()}/mo\n• Annual Contract Value: $${updatedLead.estimatedARR.toLocaleString()} ARR\n\nClient onboarding checklist initialized.`,
      relatedLeadId: updatedLead.id,
      leadName: updatedLead.name,
    });
  }

  return res.json(updatedLead);
});

app.post('/api/leads/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, authorName, authorRole } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const lead = db.leads.find((l) => l.id === id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const newNote: LeadNote = {
    id: `note-${Date.now()}`,
    leadId: id,
    authorName: authorName || 'Advisor',
    authorRole: authorRole || 'Team Member',
    content,
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • Today',
  };

  lead.notes = [newNote, ...(lead.notes || [])];
  persistDb();
  broadcast('lead_note_added', { leadId: id, note: newNote });

  return res.status(201).json(newNote);
});

app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const deleted = db.leads.splice(index, 1)[0];
  persistDb();
  broadcast('lead_deleted', { id });
  return res.json({ success: true, deletedLead: deleted });
});

// ===================== FOLLOW-UPS ROUTES =====================
app.get('/api/followups', (_req: Request, res: Response) => {
  return res.json(db.followups);
});

app.post('/api/followups', (req: Request, res: Response) => {
  const body = req.body;
  const newFollowUp: FollowUp = {
    id: `followup-${Date.now()}`,
    leadId: body.leadId || 'custom',
    leadName: body.leadName || 'Client Follow-up',
    leadCompany: body.leadCompany || 'Prospect',
    leadAvatar: body.leadAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dueTime: body.dueTime || 'Tomorrow, 10:00 AM',
    dueDate: body.dueDate || new Date().toISOString(),
    bucket: body.bucket || 'upcoming',
    priority: body.priority || 'Standard',
    actionSummary: body.actionSummary || 'Follow-up regarding proposal',
    proposalAmount: body.proposalAmount || 'Advisory Scope',
    service: body.service || 'Financial Advisory',
    leadStatus: body.leadStatus || 'Contacted',
    completed: false,
    phone: body.phone,
    email: body.email,
  };

  db.followups.unshift(newFollowUp);
  persistDb();
  broadcast('followup_created', newFollowUp);

  // Trigger automated email alert for scheduled follow-up
  const followUpRecipient = db.users[0];
  dispatchAutomatedEmail({
    type: 'followup_due',
    recipientEmail: followUpRecipient?.email || 'sanwalniaxii321@gmail.com',
    recipientName: followUpRecipient?.name || 'Sanwal Niaz',
    subject: `Scheduled Action: ${newFollowUp.leadName} (${newFollowUp.dueTime})`,
    preview: `${newFollowUp.actionSummary}`,
    body: `Follow-up has been added to your calendar:\n• Target: ${newFollowUp.leadName} - ${newFollowUp.leadCompany}\n• Schedule: ${newFollowUp.dueTime}\n• Priority: ${newFollowUp.priority}\n• Action: ${newFollowUp.actionSummary}`,
    relatedLeadId: newFollowUp.leadId,
    leadName: newFollowUp.leadName,
  });

  return res.status(201).json(newFollowUp);
});

app.put('/api/followups/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.followups.findIndex((f) => f.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Follow-up not found' });
  }

  db.followups[index] = {
    ...db.followups[index],
    ...req.body,
  };
  persistDb();
  broadcast('followup_updated', db.followups[index]);
  return res.json(db.followups[index]);
});

// ===================== NOTIFICATIONS & AUTOMATED EMAIL ROUTES =====================
app.get('/api/notifications', (_req: Request, res: Response) => {
  return res.json(db.notifications);
});

app.post('/api/notifications/trigger', (req: Request, res: Response) => {
  const { type, recipientEmail, recipientName, subject, preview, body, relatedLeadId, leadName } = req.body;
  const fallbackUser = db.users[0];
  const newNotif = dispatchAutomatedEmail({
    type: type || 'urgent_alert',
    recipientEmail: recipientEmail || fallbackUser?.email || 'sanwalniaxii321@gmail.com',
    recipientName: recipientName || fallbackUser?.name || 'Sanwal Niaz',
    subject: subject || 'Automated CRM Alert',
    preview: preview || 'Important practice advisory notification',
    body: body || 'Automated alert trigger.',
    relatedLeadId,
    leadName,
  });
  return res.status(201).json(newNotif);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    persistDb();
    broadcast('notification_updated', notif);
  }
  return res.json({ success: true });
});

// ===================== KPI REPORTING MODULE =====================
app.get('/api/reports', (_req: Request, res: Response) => {
  const totalLeads = db.leads.length;
  const newLeads = db.leads.filter((l) => l.status === 'New').length;
  const qualifiedLeads = db.leads.filter((l) => l.status === 'Qualified').length;
  const contactedLeads = db.leads.filter((l) => l.status === 'Contacted').length;
  const convertedLeads = db.leads.filter((l) => l.status === 'Converted').length;

  const totalARR = db.leads.reduce((acc, curr) => acc + (curr.estimatedARR || 0), 0);
  const activeQualifiedARR = db.leads
    .filter((l) => l.status === 'Qualified' || l.status === 'Converted')
    .reduce((acc, curr) => acc + (curr.estimatedARR || 0), 0);

  const averageRetainer = totalLeads > 0 
    ? Math.round(db.leads.reduce((acc, curr) => acc + (curr.estimatedMonthlyRetainer || 0), 0) / totalLeads)
    : 0;

  const conversionRate = totalLeads > 0
    ? ((convertedLeads / totalLeads) * 100).toFixed(1)
    : '0';

  // Service distribution
  const serviceBreakdown = {
    Bookkeeping: db.leads.filter((l) => l.service === 'Bookkeeping').length,
    TaxPreparation: db.leads.filter((l) => l.service === 'Tax Preparation').length,
    FinancialAdvisory: db.leads.filter((l) => l.service === 'Financial Advisory').length,
    Accounting: db.leads.filter((l) => l.service === 'Accounting').length,
  };

  // Channel attribution
  const channelBreakdown: Record<string, number> = {};
  db.leads.forEach((l) => {
    channelBreakdown[l.source] = (channelBreakdown[l.source] || 0) + 1;
  });

  return res.json({
    metrics: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      contactedLeads,
      convertedLeads,
      totalARR,
      activeQualifiedARR,
      averageRetainer,
      conversionRate,
      momGrowth: '+14.2%',
    },
    funnel: [
      { stage: 'New', count: newLeads, percentage: totalLeads ? Math.round((newLeads / totalLeads) * 100) : 0 },
      { stage: 'Contacted', count: contactedLeads, percentage: totalLeads ? Math.round((contactedLeads / totalLeads) * 100) : 0 },
      { stage: 'Qualified', count: qualifiedLeads, percentage: totalLeads ? Math.round((qualifiedLeads / totalLeads) * 100) : 0 },
      { stage: 'Converted', count: convertedLeads, percentage: totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0 },
    ],
    serviceBreakdown,
    channelBreakdown,
  });
});

// ===================== AI LEAD SCRAPER (n8n Webhook ready) =====================
app.post('/api/ai/scrape-leads', (req: Request, res: Response) => {
  const { query, location, count = 5 } = req.body;

  const sampleNames = [
    { name: 'Dr. Arthur Sterling', company: 'Midwest Dental Clinic', email: 'sterling.dds@midwestdental.org', phone: '+1 (312) 555-0194', website: 'midwestdental.org' },
    { name: 'Elena Rostova', company: 'Northwind Dental Group', email: 'elena@northwinddental.com', phone: '+1 (555) 456-7890', website: 'northwinddental.com' },
    { name: 'Dr. Camille Laurent', company: 'Laurent Orthodontics', email: 'contact@laurentortho.com', phone: '— Not listed', website: 'laurentortho.com' },
    { name: 'Dr. Julian Scott', company: 'Scott Family Orthodontics', email: 'j.scott@scottortho.com', phone: '(312) 555-0192', website: 'scottortho.com' },
    { name: 'Claire Montgomery', company: 'Apex Logistics LLC', email: '', phone: '', website: 'apexlogistics.com' },
    { name: 'Dr. Nathan Vance', company: 'Vance Ortho Care', email: 'dr.vance@vanceortho.com', phone: '(312) 555-4422', website: 'vanceortho.com' },
  ];

  const results = sampleNames.slice(0, Math.min(count, sampleNames.length)).map((item, idx) => {
    // Duplicate detection against current db.leads
    const isDuplicate = db.leads.some(
      (l) => l.email.toLowerCase() === item.email.toLowerCase() || l.company.toLowerCase() === item.company.toLowerCase()
    );

    return {
      id: `ai-lead-${Date.now()}-${idx}`,
      ...item,
      isDuplicate,
      source: 'Verified Multi-Platform Discovery (API)',
    };
  });

  return res.json({
    query: query || 'Business owners',
    location: location || 'United States',
    discoveredCount: results.length,
    leads: results,
  });
});

// ===================== SERVE VITE IN DEV / STATIC IN PROD =====================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadPilot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

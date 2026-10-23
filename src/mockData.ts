import type { Lead, FollowUp, User, EmailNotification } from './types.ts';

// Production Initial Data - No Fake Records
export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Sanwal Niaz',
    email: 'sanwalniaxii321@gmail.com',
    role: 'admin',
    title: 'Managing Director & Systems Admin',
    department: 'Firm Operations',
    companyId: 'firm-leadpilot',
    approvalStatus: 'approved',
    createdAt: '2024-01-15T08:00:00Z',
  },
];

export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_FOLLOWUPS: FollowUp[] = [];
export const INITIAL_NOTIFICATIONS: EmailNotification[] = [];

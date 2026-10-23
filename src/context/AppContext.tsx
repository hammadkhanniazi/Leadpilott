import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lead, FollowUp, User, EmailNotification, LeadNote, UserRole, UserApprovalStatus } from '../types';
import {
  db,
  auth,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { isValidUserPhoto } from '../components/UserAvatar';

const BOOTSTRAP_ADMIN_EMAIL = 'sanwalniaxii321@gmail.com';

interface AppContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  users: User[];
  leads: Lead[];
  followups: FollowUp[];
  notifications: EmailNotification[];
  unreadNotificationsCount: number;
  activeTab: 'dashboard' | 'leads' | 'follow-ups' | 'reports' | 'team';
  setActiveTab: (tab: 'dashboard' | 'leads' | 'follow-ups' | 'reports' | 'team') => void;
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  isAddLeadOpen: boolean;
  setIsAddLeadOpen: (open: boolean) => void;
  isCsvImportOpen: boolean;
  setIsCsvImportOpen: (open: boolean) => void;
  isAiScraperOpen: boolean;
  setIsAiScraperOpen: (open: boolean) => void;
  isQuickScheduleOpen: boolean;
  setIsQuickScheduleOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  prefilledIntakeData: Partial<Lead> | null;
  setPrefilledIntakeData: (data: Partial<Lead> | null) => void;
  isLiveSynced: boolean;
  isFirebaseAuth: boolean;

  // Authentication & Access Control Actions
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    password: string,
    title?: string,
    department?: string
  ) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  switchUser: (userId: string) => void;

  // Admin User & Access Management
  updateUserStatus: (userId: string, newStatus: UserApprovalStatus) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  inviteUser: (
    name: string,
    email: string,
    role: UserRole,
    title?: string,
    department?: string
  ) => Promise<boolean>;
  uploadProfilePhoto: (base64Image: string) => Promise<boolean>;

  // Leads CRUD
  addLead: (leadData: Partial<Lead>) => Promise<Lead>;
  batchImportLeads: (leads: Partial<Lead>[], overwriteDuplicates?: boolean) => Promise<number>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addLeadNote: (leadId: string, content: string) => Promise<void>;

  // Follow-ups CRUD
  addFollowUp: (followUpData: Partial<FollowUp>) => Promise<void>;
  toggleFollowUpDone: (id: string) => Promise<void>;
  rescheduleFollowUp: (id: string, newDate: string, newTime: string) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  triggerTestEmail: (
    recipientEmail: string,
    subject: string,
    body: string,
    type?: EmailNotification['type']
  ) => Promise<void>;
  showToast: (message: string) => void;
  toastMessage: string | null;

  // RBAC checks
  canManageTeam: () => boolean;
  canDeleteLeads: () => boolean;
  canEditLead: (lead: Lead) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'follow-ups' | 'reports' | 'team'>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isAiScraperOpen, setIsAiScraperOpen] = useState(false);
  const [isQuickScheduleOpen, setIsQuickScheduleOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [prefilledIntakeData, setPrefilledIntakeData] = useState<Partial<Lead> | null>(null);
  const [isLiveSynced, setIsLiveSynced] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAuthenticated = Boolean(firebaseUser);
  const isApproved = Boolean(currentUser && currentUser.approvalStatus === 'approved');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3500);
  };

  // Helper: fetch or establish user record from Firestore
  const syncUserRecord = async (fbUser: FirebaseUser): Promise<User> => {
    const email = fbUser.email ? fbUser.email.trim().toLowerCase() : '';
    const isBootstrapAdmin = email === BOOTSTRAP_ADMIN_EMAIL;

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as User;
        // Guarantee bootstrapped admin always has admin role and approved status
        if (isBootstrapAdmin && (data.role !== 'admin' || data.approvalStatus !== 'approved')) {
          const updatedAdmin: User = { ...data, role: 'admin', approvalStatus: 'approved' };
          await setDoc(userRef, updatedAdmin, { merge: true });
          return updatedAdmin;
        }
        return data;
      }

      // Check if user exists by email in backend pre-invites
      const preInvite = users.find((u) => u.email.toLowerCase() === email);
      const initialStatus: UserApprovalStatus = isBootstrapAdmin
        ? 'approved'
        : preInvite?.approvalStatus === 'approved'
        ? 'approved'
        : 'pending';

      const initialRole: UserRole = isBootstrapAdmin
        ? 'admin'
        : preInvite?.role || 'advisor';

      const authenticPhoto = fbUser.photoURL && isValidUserPhoto(fbUser.photoURL) ? fbUser.photoURL : undefined;

      const newUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || preInvite?.name || email.split('@')[0] || 'Team Member',
        email,
        role: initialRole,
        approvalStatus: initialStatus,
        avatar: authenticPhoto,
        title: isBootstrapAdmin
          ? 'Managing Director & Systems Admin'
          : preInvite?.title || 'Financial Advisor',
        department: preInvite?.department || 'Corporate Advisory',
        companyId: 'firm-leadpilot',
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, newUser);
      return newUser;
    } catch (e) {
      console.warn('Error reading/writing user doc in Firestore:', e);
      // Fallback local representation
      const authenticPhoto = fbUser.photoURL && isValidUserPhoto(fbUser.photoURL) ? fbUser.photoURL : undefined;
      return {
        id: fbUser.uid,
        name: fbUser.displayName || email.split('@')[0] || 'Team Member',
        email,
        role: isBootstrapAdmin ? 'admin' : 'advisor',
        approvalStatus: isBootstrapAdmin ? 'approved' : 'pending',
        avatar: authenticPhoto,
        title: isBootstrapAdmin ? 'Managing Director & Systems Admin' : 'Financial Advisor',
        department: 'Corporate Advisory',
        companyId: 'firm-leadpilot',
        createdAt: new Date().toISOString(),
      };
    }
  };

  // 1. Firebase Auth listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        const user = await syncUserRecord(fbUser);
        setCurrentUser(user);
        localStorage.setItem('leadpilot_user', JSON.stringify(user));
      } else {
        setCurrentUser(null);
        setLeads([]);
        setFollowups([]);
        setNotifications([]);
        localStorage.removeItem('leadpilot_user');
      }

      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // 1b. Real-time Firestore listener for active user's approval status
  // Instantly detects when an admin revokes, disables, or re-approves this account
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubUserDoc = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const freshUser = docSnap.data() as User;
          setCurrentUser(freshUser);
          localStorage.setItem('leadpilot_user', JSON.stringify(freshUser));

          // If revoked or disabled, immediately purge all protected CRM data from memory
          if (freshUser.approvalStatus !== 'approved') {
            setLeads([]);
            setFollowups([]);
            setNotifications([]);
          }
        }
      },
      (err) => {
        console.warn('Real-time user doc snapshot listener warning:', err);
      }
    );

    return () => unsubUserDoc();
  }, [firebaseUser]);

  // 2. Fetch server API data and subscribe to Server-Sent Events (SSE) ONLY when user is approved
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !currentUser || currentUser.approvalStatus !== 'approved') {
      return;
    }

    const fetchAllData = async () => {
      try {
        const [leadsRes, followupsRes, notifsRes] = await Promise.all([
          fetch('/api/leads').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/followups').then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/notifications').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (Array.isArray(leadsRes)) setLeads(leadsRes);
        if (Array.isArray(followupsRes)) setFollowups(followupsRes);
        if (Array.isArray(notifsRes)) setNotifications(notifsRes);
        setIsLiveSynced(true);
      } catch {
        // Handled silently
      }
    };

    fetchAllData();

    const eventSource = new EventSource('/api/events');
    eventSource.onopen = () => setIsLiveSynced(true);
    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        if (type === 'lead_created') {
          setLeads((prev) => (prev.some((l) => l.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === 'lead_updated') {
          setLeads((prev) => prev.map((l) => (l.id === payload.id ? payload : l)));
        } else if (type === 'lead_deleted') {
          setLeads((prev) => prev.filter((l) => l.id !== payload.id));
        } else if (type === 'leads_batch_imported') {
          fetchAllData();
        } else if (type === 'followup_created') {
          setFollowups((prev) => (prev.some((f) => f.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === 'followup_updated') {
          setFollowups((prev) => prev.map((f) => (f.id === payload.id ? payload : f)));
        } else if (type === 'notification_created') {
          setNotifications((prev) => (prev.some((n) => n.id === payload.id) ? prev : [payload, ...prev]));
        } else if (type === 'user_updated') {
          setUsers((prev) => prev.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)));
          if (currentUser?.id === payload.id) {
            setCurrentUser((prev) => (prev ? { ...prev, ...payload } : payload));
            if (payload.approvalStatus !== 'approved') {
              setLeads([]);
              setFollowups([]);
              setNotifications([]);
            }
          }
        } else if (type === 'user_access_revoked') {
          if (currentUser?.id === payload.userId) {
            setCurrentUser((prev) => (prev ? { ...prev, approvalStatus: 'revoked' } : null));
            setLeads([]);
            setFollowups([]);
            setNotifications([]);
          }
        }
      } catch (err) {
        console.error('SSE sync parse error:', err);
      }
    };
    eventSource.onerror = () => setIsLiveSynced(false);

    return () => {
      eventSource.close();
    };
  }, [isAuthReady, firebaseUser, currentUser?.approvalStatus]);

  // 3. Real-time Firestore Listeners - strictly active ONLY when authenticated AND approved
  useEffect(() => {
    if (!isAuthReady || !firebaseUser || !currentUser || currentUser.approvalStatus !== 'approved') {
      return;
    }

    // Listen to leads
    const unsubLeads = onSnapshot(
      collection(db, 'leads'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreLeads: Lead[] = [];
          snapshot.forEach((docSnap) => {
            firestoreLeads.push(docSnap.data() as Lead);
          });
          firestoreLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLeads(firestoreLeads);
        } else {
          setLeads([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'leads');
      }
    );

    // Listen to follow-ups
    const unsubFollowups = onSnapshot(
      collection(db, 'followups'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreFollowups: FollowUp[] = [];
          snapshot.forEach((docSnap) => {
            firestoreFollowups.push(docSnap.data() as FollowUp);
          });
          setFollowups(firestoreFollowups);
        } else {
          setFollowups([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'followups');
      }
    );

    // Listen to notifications
    const unsubNotifications = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        if (!snapshot.empty) {
          const firestoreNotifs: EmailNotification[] = [];
          snapshot.forEach((docSnap) => {
            firestoreNotifs.push(docSnap.data() as EmailNotification);
          });
          firestoreNotifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(firestoreNotifs);
        } else {
          setNotifications([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );

    // Listen to users collection - strictly for authorized administrators per security rules
    let unsubUsers = () => {};
    const isAdminUser = currentUser.role === 'admin' || currentUser.email === BOOTSTRAP_ADMIN_EMAIL;
    if (isAdminUser) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const firestoreUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            firestoreUsers.push(docSnap.data() as User);
          });
          firestoreUsers.sort((a, b) => {
            if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
            if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') return 1;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
          setUsers(firestoreUsers);

          // Update current user if record modified by admin
          const myUpdatedRecord = firestoreUsers.find((u) => u.id === firebaseUser.uid);
          if (myUpdatedRecord) {
            setCurrentUser(myUpdatedRecord);
            localStorage.setItem('leadpilot_user', JSON.stringify(myUpdatedRecord));
          }
        },
        (error) => {
          console.warn('Firestore users collection snapshot warning:', error);
        }
      );
    }

    return () => {
      unsubLeads();
      unsubFollowups();
      unsubNotifications();
      unsubUsers();
    };
  }, [isAuthReady, firebaseUser, currentUser?.approvalStatus, currentUser?.role]);

  // Auth operations
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = await syncUserRecord(cred.user);
      setCurrentUser(user);
      localStorage.setItem('leadpilot_user', JSON.stringify(user));

      if (user.approvalStatus !== 'approved') {
        showToast('Account awaiting administrator authorization.');
        return {
          success: true,
          error: 'Your account is pending administrator approval before CRM access is granted.',
        };
      }

      showToast(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (err: any) {
      console.error('Email sign-in error:', err);
      let errorMsg = 'Failed to sign in. Please verify your email and password.';
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        errorMsg = 'Invalid email or password.';
      } else if (err?.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email. Contact your administrator for access.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMsg = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    password: string,
    title?: string,
    department?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const isBootstrapAdmin = cleanEmail === BOOTSTRAP_ADMIN_EMAIL;

      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      // 2. Create user document with pending approval (unless bootstrapped admin)
      const newUser: User = {
        id: cred.user.uid,
        name: name.trim(),
        email: cleanEmail,
        role: isBootstrapAdmin ? 'admin' : 'advisor',
        approvalStatus: isBootstrapAdmin ? 'approved' : 'pending',
        title: title || (isBootstrapAdmin ? 'Managing Director & Systems Admin' : 'Financial Advisor'),
        department: department || 'Practice Management',
        companyId: 'firm-leadpilot',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', cred.user.uid), newUser);
      setCurrentUser(newUser);
      localStorage.setItem('leadpilot_user', JSON.stringify(newUser));

      // 3. Notify server & dispatch alert
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: cleanEmail, title, department, uid: cred.user.uid }),
        });
      } catch {}

      showToast(
        isBootstrapAdmin
          ? 'Administrator account initialized!'
          : 'Access request submitted! Awaiting administrator approval.'
      );
      return { success: true };
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMsg = 'Failed to submit registration request.';
      if (err?.code === 'auth/email-already-in-use') {
        errorMsg = 'An account with this email already exists. Please sign in or reset your password.';
      } else if (err?.code === 'auth/weak-password') {
        errorMsg = 'Password must be at least 6 characters.';
      } else if (err?.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      try {
        await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch {}
      return { success: true };
    } catch (err: any) {
      console.error('Password reset error:', err);
      return { success: false, error: err?.message || 'Failed to send password reset email.' };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    setCurrentUser(null);
    setFirebaseUser(null);
    setLeads([]);
    setFollowups([]);
    setNotifications([]);
    localStorage.removeItem('leadpilot_user');
    showToast('Signed out of LeadPilot CRM');
  };

  const refreshUserData = async () => {
    if (!auth.currentUser) return;
    try {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (snap.exists()) {
        const data = snap.data() as User;
        setCurrentUser(data);
        localStorage.setItem('leadpilot_user', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Could not refresh user data:', e);
    }
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('leadpilot_user', JSON.stringify(target));
      showToast(`Switched account to ${target.name} (${target.role.toUpperCase()})`);
    }
  };

  // Administrator Access Management
  const updateUserStatus = async (userId: string, newStatus: UserApprovalStatus) => {
    if (!currentUser || !canManageTeam()) {
      showToast('Only administrators can approve or deny user access.');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    // Safety 1: Never revoke or deny primary system administrator
    if (targetUser.email === BOOTSTRAP_ADMIN_EMAIL && (newStatus === 'revoked' || newStatus === 'disabled' || newStatus === 'denied')) {
      showToast('The primary system administrator account cannot be revoked or denied.');
      return;
    }

    // Safety 2: Never allow an administrator to revoke or deny themselves
    if (userId === currentUser.id && (newStatus === 'revoked' || newStatus === 'disabled' || newStatus === 'denied')) {
      showToast('You cannot revoke or deny your own administrator account.');
      return;
    }

    // Safety 3: Ensure at least one active approved administrator remains
    if (targetUser.role === 'admin' && (newStatus === 'revoked' || newStatus === 'disabled' || newStatus === 'denied')) {
      const activeAdmins = users.filter(
        (u) => u.role === 'admin' && u.approvalStatus === 'approved' && u.id !== userId
      );
      if (activeAdmins.length === 0) {
        showToast('Cannot revoke the only active administrator. Another administrator must be approved first.');
        return;
      }
    }

    const updates: Record<string, any> = {
      approvalStatus: newStatus,
    };
    if (newStatus === 'approved') {
      updates.approvedAt = new Date().toISOString();
      updates.approvedBy = currentUser.name || currentUser.email;
    } else if (newStatus === 'denied') {
      updates.deniedAt = new Date().toISOString();
      updates.deniedBy = currentUser.name || currentUser.email;
    }

    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (e) {
      console.error('Failed to update user status in Firestore:', e);
      showToast('Error updating user status in database. Please check permissions.');
      return;
    }

    try {
      await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminId: currentUser.id }),
      });
    } catch (err) {
      console.warn('Backend status sync warning:', err);
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    showToast(
      newStatus === 'approved'
        ? `Access approved for ${targetUser.name}!`
        : newStatus === 'denied'
        ? `Access request denied for ${targetUser.name}.`
        : newStatus === 'revoked'
        ? `Access revoked for ${targetUser.name}.`
        : `User status updated.`
    );
  };

  const uploadProfilePhoto = async (base64Image: string): Promise<boolean> => {
    if (!currentUser || !firebaseUser) return false;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        avatar: base64Image,
      });
      setCurrentUser((prev) => (prev ? { ...prev, avatar: base64Image } : prev));
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? { ...u, avatar: base64Image } : u)));
      showToast('Profile photo updated successfully!');
      return true;
    } catch (e) {
      console.error('Failed to update profile photo:', e);
      showToast('Failed to save profile photo.');
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.approvalStatus !== 'approved') {
      showToast('Only administrators can alter roles.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }

    try {
      await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, adminId: currentUser.id }),
      });
    } catch {}

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    showToast('Updated team permissions');
  };

  const inviteUser = async (
    name: string,
    email: string,
    role: UserRole,
    title?: string,
    department?: string
  ): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.approvalStatus !== 'approved') {
      showToast('Only administrators can invite users.');
      return false;
    }

    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          title,
          department,
          adminId: currentUser.id,
        }),
      });

      if (!res.ok) throw new Error('Invite failed');
      const invited: User = await res.json();
      setUsers((prev) => (prev.some((u) => u.email === invited.email) ? prev : [invited, ...prev]));
      showToast(`Pre-approved invitation sent to ${email}`);
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to send invite');
      return false;
    }
  };

  // Leads CRUD
  const addLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    const activeName = currentUser?.name || auth.currentUser?.displayName || 'Advisor';
    const activeTitle = currentUser?.title || 'Financial Advisor';
    const activeId = currentUser?.id || auth.currentUser?.uid || 'advisor';
    const activeCompanyId = currentUser?.companyId || 'firm-leadpilot';
    const monthly = leadData.estimatedMonthlyRetainer || 650;
    const newLead: Lead = {
      id: leadData.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: leadData.name || 'New Client',
      company: leadData.company || 'Business Co',
      email: leadData.email || '',
      phone: leadData.phone || '',
      website: leadData.website || '',
      service: leadData.service || 'Bookkeeping',
      services: leadData.services || [leadData.service || 'Bookkeeping'],
      status: leadData.status || 'New',
      source: leadData.source || 'Direct Intake',
      acquisitionUrl: leadData.acquisitionUrl || '',
      estimatedMonthlyRetainer: monthly,
      estimatedARR: monthly * 12,
      createdAt: new Date().toISOString(),
      followUpDate: leadData.followUpDate || '',
      assignedAdvisorId: leadData.assignedAdvisorId || activeId,
      assignedAdvisorName: leadData.assignedAdvisorName || activeName,
      companyId: activeCompanyId,
      notes: leadData.initialNotes
        ? [
            {
              id: `note-${Date.now()}`,
              leadId: leadData.id || `lead-${Date.now()}`,
              authorName: activeName,
              authorRole: activeTitle,
              content: leadData.initialNotes,
              createdAt: 'Just now',
            },
          ]
        : [],
    };

    if (auth.currentUser && isApproved) {
      try {
        await setDoc(doc(db, 'leads', newLead.id), newLead);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `leads/${newLead.id}`);
      }
    }

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLead,
          creatorName: activeName,
        }),
      });
    } catch {}

    setLeads((prev) => [newLead, ...prev]);
    showToast(`Lead for ${newLead.company} saved!`);
    return newLead;
  };

  const batchImportLeads = async (importedLeads: Partial<Lead>[], overwriteDuplicates = false): Promise<number> => {
    let count = 0;
    const batch = writeBatch(db);
    const newItems: Lead[] = [];
    const activeName = currentUser?.name || auth.currentUser?.displayName || 'Advisor';
    const activeId = currentUser?.id || auth.currentUser?.uid || 'advisor';
    const activeCompanyId = currentUser?.companyId || 'firm-leadpilot';

    for (const data of importedLeads) {
      const monthly = data.estimatedMonthlyRetainer || 650;
      const leadId = data.id || `lead-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const leadItem: Lead = {
        id: leadId,
        name: data.name || 'Imported Client',
        company: data.company || 'Business Co',
        email: data.email || '',
        phone: data.phone || '',
        website: data.website || '',
        service: data.service || 'Bookkeeping',
        services: data.services || [data.service || 'Bookkeeping'],
        status: data.status || 'New',
        source: data.source || 'CSV Import',
        acquisitionUrl: data.acquisitionUrl || '',
        estimatedMonthlyRetainer: monthly,
        estimatedARR: monthly * 12,
        createdAt: data.createdAt || new Date().toISOString(),
        followUpDate: data.followUpDate || '',
        assignedAdvisorId: data.assignedAdvisorId || activeId,
        assignedAdvisorName: data.assignedAdvisorName || activeName,
        companyId: activeCompanyId,
        notes: data.initialNotes
          ? [
              {
                id: `note-${Date.now()}`,
                leadId,
                authorName: activeName,
                authorRole: 'System Import',
                content: data.initialNotes,
                createdAt: 'Imported',
              },
            ]
          : [],
      };

      if (auth.currentUser && isApproved) {
        const leadRef = doc(db, 'leads', leadId);
        batch.set(leadRef, leadItem, { merge: overwriteDuplicates });
      }

      newItems.push(leadItem);
      count++;
    }

    if (auth.currentUser && isApproved) {
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'leads/batch');
      }
    }

    try {
      await fetch('/api/leads/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: newItems, overwriteDuplicates }),
      });
    } catch {}

    setLeads((prev) => [...newItems, ...prev]);
    showToast(`Imported ${count} leads into CRM database!`);
    return count;
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    if (auth.currentUser && isApproved) {
      try {
        await updateDoc(doc(db, 'leads', id), updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `leads/${id}`);
      }
    }

    try {
      await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch {}

    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    showToast('Lead details updated');
  };

  const deleteLead = async (id: string) => {
    if (auth.currentUser && isApproved) {
      try {
        await deleteDoc(doc(db, 'leads', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `leads/${id}`);
      }
    }

    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    } catch {}

    setLeads((prev) => prev.filter((l) => l.id !== id));
    showToast('Lead removed from CRM');
  };

  const addLeadNote = async (leadId: string, content: string) => {
    const activeName = currentUser?.name || auth.currentUser?.displayName || 'Advisor';
    const activeTitle = currentUser?.title || 'Financial Advisor';
    const newNote: LeadNote = {
      id: `note-${Date.now()}`,
      leadId,
      authorName: activeName,
      authorRole: activeTitle,
      content,
      createdAt: 'Just now',
    };

    const targetLead = leads.find((l) => l.id === leadId);
    if (!targetLead) return;

    const updatedNotes = [newNote, ...(targetLead.notes || [])];

    if (auth.currentUser && isApproved) {
      try {
        await updateDoc(doc(db, 'leads', leadId), { notes: updatedNotes });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
      }
    }

    try {
      await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: activeName,
          authorRole: activeTitle,
        }),
      });
    } catch {}

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, notes: updatedNotes } : l)));
    showToast('Note added to timeline');
  };

  // Follow-ups CRUD
  const addFollowUp = async (followUpData: Partial<FollowUp>) => {
    const activeCompanyId = currentUser?.companyId || 'firm-leadpilot';
    const newFollowUp: FollowUp = {
      id: followUpData.id || `fu-${Date.now()}`,
      leadId: followUpData.leadId || '',
      leadName: followUpData.leadName || 'Client Follow-up',
      leadCompany: followUpData.leadCompany || 'Client Firm',
      dueTime: followUpData.dueTime || 'Tomorrow 10:00 AM',
      dueDate: followUpData.dueDate || new Date().toISOString().slice(0, 10),
      bucket: followUpData.bucket || 'today',
      priority: followUpData.priority || 'Standard',
      actionSummary: followUpData.actionSummary || 'Follow-up with client.',
      proposalAmount: followUpData.proposalAmount || '$1,200/mo',
      service: followUpData.service || 'Bookkeeping',
      leadStatus: followUpData.leadStatus || 'New',
      completed: false,
      companyId: activeCompanyId,
      phone: followUpData.phone || '',
      email: followUpData.email || '',
    };

    if (auth.currentUser && isApproved) {
      try {
        await setDoc(doc(db, 'followups', newFollowUp.id), newFollowUp);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `followups/${newFollowUp.id}`);
      }
    }

    try {
      await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFollowUp),
      });
    } catch {}

    setFollowups((prev) => [newFollowUp, ...prev]);
    showToast('Scheduled follow-up action');
  };

  const toggleFollowUpDone = async (id: string) => {
    const item = followups.find((f) => f.id === id);
    if (!item) return;
    const nextCompleted = !item.completed;

    if (auth.currentUser && isApproved) {
      try {
        await updateDoc(doc(db, 'followups', id), {
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `followups/${id}`);
      }
    }

    try {
      await fetch(`/api/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch {}

    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, completed: nextCompleted } : f))
    );
    showToast(nextCompleted ? 'Follow-up marked as completed' : 'Follow-up reopened');
  };

  const rescheduleFollowUp = async (id: string, newDate: string, newTime: string) => {
    if (auth.currentUser && isApproved) {
      try {
        await updateDoc(doc(db, 'followups', id), {
          dueDate: newDate,
          dueTime: newTime,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `followups/${id}`);
      }
    }

    try {
      await fetch(`/api/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: newDate, dueTime: newTime }),
      });
    } catch {}

    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, dueDate: newDate, dueTime: newTime } : f))
    );
    showToast(`Rescheduled to ${newDate} at ${newTime}`);
  };

  // Notifications
  const markNotificationRead = async (id: string) => {
    if (auth.currentUser && isApproved) {
      try {
        await updateDoc(doc(db, 'notifications', id), { read: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
      }
    }

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch {}

    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const triggerTestEmail = async (
    recipientEmail: string,
    subject: string,
    body: string,
    type: EmailNotification['type'] = 'urgent_alert'
  ) => {
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail,
          subject,
          body,
          type,
          recipientName: currentUser?.name || 'Team Member',
        }),
      });
      if (res.ok) {
        showToast(`Dispatched test email to ${recipientEmail}`);
      }
    } catch {
      showToast('Dispatched test email notification');
    }
  };

  // RBAC permissions
  const canManageTeam = () =>
    Boolean(
      currentUser &&
      currentUser.approvalStatus === 'approved' &&
      (currentUser.role === 'admin' || currentUser.email === BOOTSTRAP_ADMIN_EMAIL)
    );
  const canDeleteLeads = () => Boolean(currentUser && (currentUser.role === 'admin' || currentUser.role === 'advisor') && currentUser.approvalStatus === 'approved');
  const canEditLead = (_lead: Lead) => Boolean(currentUser && currentUser.approvalStatus === 'approved');

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isAuthReady,
        isAuthenticated,
        isApproved,
        users,
        leads,
        followups,
        notifications,
        unreadNotificationsCount,
        activeTab,
        setActiveTab,
        selectedLeadId,
        setSelectedLeadId,
        isAddLeadOpen,
        setIsAddLeadOpen,
        isCsvImportOpen,
        setIsCsvImportOpen,
        isAiScraperOpen,
        setIsAiScraperOpen,
        isQuickScheduleOpen,
        setIsQuickScheduleOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        prefilledIntakeData,
        setPrefilledIntakeData,
        isLiveSynced,
        isFirebaseAuth: Boolean(firebaseUser),

        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        refreshUserData,
        switchUser,

        updateUserStatus,
        updateUserRole,
        inviteUser,
        uploadProfilePhoto,

        addLead,
        batchImportLeads,
        updateLead,
        deleteLead,
        addLeadNote,

        addFollowUp,
        toggleFollowUpDone,
        rescheduleFollowUp,

        markNotificationRead,
        triggerTestEmail,
        showToast,
        toastMessage,

        canManageTeam,
        canDeleteLeads,
        canEditLead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

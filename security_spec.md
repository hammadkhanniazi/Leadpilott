# Security Specification: LeadPilot Financial Services CRM

## 1. Data Invariants
1. **User Identity & Role Separation**: A user document at `/users/{userId}` must match `request.auth.uid`. Role privilege changes can only be performed by administrative accounts (`isAdmin()` or bootstrapped admin `sanwalniaxii321@gmail.com`).
2. **Lead Integrity**: Leads require a name, company, valid pipeline status (`New`, `Contacted`, `Qualified`, `Converted`), and non-negative financial values (`estimatedMonthlyRetainer`).
3. **Follow-Up Integrity**: Follow-ups must belong to an existent or referenced lead ID, having a non-empty summary and explicit priority tag.
4. **Notification Log**: Automated notifications require valid sender/recipient metadata, non-empty subject and body. Only authenticated staff can write or read notifications.
5. **No Blind Blanket Access**: Global catch-all rule denies all unhandled paths: `match /{document=**} { allow read, write: if false; }`.

## 2. The "Dirty Dozen" Threat Payloads
1. **Ghost Field Poisoning**: Inserting unauthorized system keys like `{ isAdmin: true, shadowRole: 'superadmin' }` into a regular user profile.
2. **ID Hijacking**: Writing to `/users/victim_user_id` with `request.auth.uid = attacker_id`.
3. **State Skipping Attack**: Moving a lead status directly to arbitrary strings like `status: "Bypassed"` instead of allowed enum values.
4. **Negative Retainer Injection**: Setting `estimatedMonthlyRetainer: -500000` to corrupt ARR accounting metrics.
5. **Denial-of-Wallet String Bomb**: Injecting a 2MB string payload into `leadName` or `notes`.
6. **Path Traversal / Junk ID**: Submitting document IDs containing special characters `../../evil` or strings > 128 chars.
7. **Unauthenticated Read/Write**: Attempting unauthenticated access without a valid session.
8. **Unverified Email Privilege Escalation**: Spoofing admin privileges without email verification.
9. **Orphaned Follow-Up**: Writing a follow-up with invalid or empty `leadId`.
10. **Immutable Field Tampering**: Attempting to alter `createdAt` or change the document ID during an update.
11. **Notification Falsification**: Creating notifications for unintended external targets or omitting mandatory audit fields.
12. **Role Tampering on Self-Update**: An advisor updating their own role to `admin`.

## 3. Test Runner Verification Plan
Unit tests target `firestore.rules` enforcing that:
- Unauthenticated requests are rejected with PERMISSION_DENIED.
- Non-admin cannot elevate own role to 'admin'.
- Leads with invalid status or unbounded strings are rejected.
- Valid team members can read and update pipeline records.

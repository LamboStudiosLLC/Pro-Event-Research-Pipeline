# Security Specification - Event Research Assistant

## Data Invariants
1. **User Profile Integrity**: Each user document in `/users/{userId}` belongs to for the user with that UID.
2. **Project Ownership**: Each project in `/users/{userId}/projects/{projectId}` belongs to the user defined in the path. Only they can manage it.
3. **Event Containment**: Each saved event in `/users/{userId}/projects/{projectId}/events/{eventId}` is contained within a valid project belonging to the user.
4. **Immutable Fields**: `userId` in profiles and projects, and `createdAt` timestamps, are immutable after creation.
5. **Status Workflow**: Pipeline status must be one of the predefined steps.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Theft**: Attempt to create a user profile for another UID.
2. **Unauthorized Project Creation**: Attempt to create a project in another user's path.
3. **Cross-User Project Access**: User A attempts to list projects belonging to User B.
4. **Shadow Field Injection**: Adding an `isAdmin: true` field to a user profile.
5. **Timestamp Spoofing**: Setting a backdated `createdAt` timestamp.
6. **Orphaned Event**: Creating an event with a non-matching `projectId` in its data.
7. **Invalid Status**: Updating an event status to a non-enum value like "Sold".
8. **Owner Reassignment**: Attempting to update a project's `userId`.
9. **Junk ID Poisoning**: Using a 1KB string as an event ID.
10. **Unverified Account Write**: Creating data from an account with an unverified email.
11. **Resource Exhaustion**: Sending a 2MB string in the `description` field.
12. **PII Leakage**: Attempting to read another user's email directly.

## Rules Draft
(See `firestore.rules`)

export interface EventContact {
  role: string;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  social?: string;
  manuallyAdded?: boolean;
}

export interface ActionNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface ResearchResult {
  eventName: string;
  date: string;
  location: string;
  description: string;
  contacts: EventContact[];
  website?: string;
  logoUrl?: string;
  notes?: string;
  actionNotes?: ActionNote[];
  searchType?: 'event' | 'vendor';
  yearFounded?: string;
  isSandbox?: boolean;
}

export type ResponseOutcome = 'Interested' | 'Maybe' | 'Not Interested';

export interface SavedEvent extends ResearchResult {
  eventId: string;
  projectId: string;
  userId: string;
  notes: string;
  status: 'Initial' | 'Contacted' | 'Responded';
  responseOutcome?: ResponseOutcome | null;
  contactMethod?: string;
  createdAt: any;
}

export interface Project {
  projectId: string;
  userId: string;
  name: string;
  createdAt: any;
}

export interface ResearchCueItem {
  cueId: string;
  eventName: string;
  website: string;
  servicesOffered: string;
  searchType: 'event' | 'vendor';
  createdAt: any;
  isSandbox?: boolean;
}

export type Mode = 'browse' | 'research' | 'pipeline' | 'admin' | 'templates' | 'leaderboard';

export type UserRole = 'salesperson' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: any;
}

export interface ClaimedLead {
  claimId: string;
  eventName: string;
  website: string;
  normalizedDomain: string;
  normalizedName: string;
  searchType: 'event' | 'vendor';
  claimedBy: string;
  claimedByName: string;
  claimedAt: any;
  status: 'Initial' | 'Contacted' | 'Responded';
  responseOutcome?: ResponseOutcome | null;
  contactedAt?: any;
}

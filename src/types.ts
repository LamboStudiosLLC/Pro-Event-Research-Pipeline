export interface EventContact {
  role: string;
  name: string;
  contactInfo?: string;
  email?: string;
  phone?: string;
  social?: string;
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

export interface SavedEvent extends ResearchResult {
  eventId: string;
  projectId: string;
  userId: string;
  notes: string;
  status: 'Initial' | 'Contacted' | 'Responded' | 'Hot & Ready' | 'Declined';
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

export type Mode = 'browse' | 'research' | 'pipeline';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, deleteDoc, where } from 'firebase/firestore';
import { UserProfile, SavedEvent, ResponseOutcome, ClaimedLead } from '@/src/types';
import {
  Users, TrendingUp, CheckCircle, ChevronRight, Shield,
  ArrowLeft, Search, Filter, ExternalLink, Calendar, Globe,
  ChevronDown, ArrowUp, ArrowDown, SlidersHorizontal, ChevronUp, Clock, Mail, MessageSquare
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PipelineCard from './PipelineCard';
import { isLeadMatch } from '@/src/lib/leadMatching';

const STAGES = [
  { id: 'Initial',   label: 'Not Started' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'Responded', label: 'Responded' },
];

// ─── Salesperson Detail View ────────────────────────────────────────────────

interface DetailViewProps {
  user: UserProfile;
  onBack: () => void;
}

const SalespersonDetail: React.FC<DetailViewProps> = ({ user, onBack }) => {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'eventName' | 'status' | 'date' | 'createdAt' | 'searchType' | 'location'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const eventUnsubs = useRef<(() => void)[]>([]);

  // 1. Fetch Projects & Listen to Events in Real-time
  useEffect(() => {
    const projectsQuery = collection(db, 'users', user.userId, 'projects');
    
    const unsubProjects = onSnapshot(projectsQuery, (projectsSnap) => {
      // Clear previous subcollection listeners
      eventUnsubs.current.forEach(unsub => unsub());
      eventUnsubs.current = [];
      
      const projectIds = projectsSnap.docs.map(d => d.id);
      const namesMap: Record<string, string> = {};
      projectsSnap.docs.forEach(d => {
        namesMap[d.id] = d.data().name || 'Active Project';
      });
      setProjectNames(namesMap);
      
      if (projectIds.length === 0) {
        setEvents([]);
        return;
      }
      
      const projectEventsMap: Record<string, SavedEvent[]> = {};
      
      eventUnsubs.current = projectIds.map(projId => {
        const eventsQuery = collection(db, 'users', user.userId, 'projects', projId, 'events');
        return onSnapshot(eventsQuery, (eventsSnap) => {
          const projectEvents = eventsSnap.docs.map(d => ({
            eventId: d.id,
            ...d.data()
          } as SavedEvent));
          
          projectEventsMap[projId] = projectEvents;
          
          // Combine all events across projects
          const allEvents = Object.values(projectEventsMap).flat();
          setEvents(allEvents);
        }, (err) => {
          console.error(`Failed to load events for project ${projId}:`, err);
        });
      });
    }, (err) => {
      console.error("Failed to load projects for user:", err);
    });

    return () => {
      unsubProjects();
      eventUnsubs.current.forEach(unsub => unsub());
    };
  }, [user.userId]);

  // 2. Sync claimed leads
  const syncClaimedLeadStatus = async (event: SavedEvent, fields: object) => {
    try {
      const claimSnap = await getDocs(query(
        collection(db, 'claimed_leads'),
        where('claimedBy', '==', user.userId)
      ));
      const matches = claimSnap.docs.filter(d =>
        isLeadMatch(
          { eventName: event.eventName, website: event.website },
          { eventName: d.data().eventName, website: d.data().website }
        )
      );
      await Promise.all(matches.map(d => updateDoc(d.ref, fields)));
    } catch (e) {
      console.error('Failed to sync status to claimed_leads:', e);
    }
  };

  // 3. Database Update Handlers (using salesperson's paths)
  const updateStatus = async (eventId: string, projectId: string, newStatus: SavedEvent['status']) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      const fields: any = { status: newStatus };
      if (newStatus !== 'Responded') fields.responseOutcome = null;
      await updateDoc(eventRef, fields);
      
      const event = events.find(e => e.eventId === eventId);
      if (event) {
        await syncClaimedLeadStatus(event, { 
          status: newStatus, 
          responseOutcome: newStatus !== 'Responded' ? null : event.responseOutcome ?? null 
        });
      }
    } catch (e) {
      console.error('Failed to update pipeline status:', e);
    }
  };

  const updateResponseOutcome = async (eventId: string, projectId: string, outcome: ResponseOutcome | null) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      await updateDoc(eventRef, { responseOutcome: outcome });
      
      const event = events.find(e => e.eventId === eventId);
      if (event) await syncClaimedLeadStatus(event, { responseOutcome: outcome });
    } catch (e) {
      console.error('Failed to update response outcome:', e);
    }
  };

  const updateContactMethod = async (eventId: string, projectId: string, contactMethod: string) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      await updateDoc(eventRef, { contactMethod });
    } catch (e) {
      console.error(e);
    }
  };

  const updateNotes = async (eventId: string, projectId: string, notes: string) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      await updateDoc(eventRef, { notes });
    } catch (e) {
      console.error(e);
    }
  };

  const updateEventDetails = async (eventId: string, projectId: string, fields: Partial<SavedEvent>) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      await updateDoc(eventRef, fields as any);
    } catch (e) {
      console.error('Failed to update event details:', e);
    }
  };

  const updateActionNotes = async (eventId: string, projectId: string, actionNotes: any[], latestNoteText?: string) => {
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      const updateData: any = { actionNotes };
      if (latestNoteText !== undefined) {
        updateData.notes = latestNoteText;
      }
      await updateDoc(eventRef, updateData);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEvent = async (eventId: string, projectId: string) => {
    const confirmDelete = window.confirm(
      "Warning: This delete action is permanent!\n\nAre you sure you want to permanently delete this listing?"
    );
    if (!confirmDelete) return;
    try {
      const eventRef = doc(db, 'users', user.userId, 'projects', projectId, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Filtering and Sorting Logic
  const filtered = useMemo(() => {
    return events
      .filter(e => {
        const matchesSearch =
          !search ||
          e.eventName.toLowerCase().includes(search.toLowerCase()) ||
          (e.website && e.website.toLowerCase().includes(search.toLowerCase())) ||
          (e.location && e.location.toLowerCase().includes(search.toLowerCase()));
        
        const matchesFilter =
          statusFilter === 'all' ||
          e.status === statusFilter;

        const matchesProject =
          selectedProjectId === 'all' ||
          e.projectId === selectedProjectId;
        
        return matchesSearch && matchesFilter && matchesProject;
      });
  }, [events, search, statusFilter, selectedProjectId]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'eventName') {
        valA = a.eventName || '';
        valB = b.eventName || '';
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      } else if (sortField === 'date') {
        const parseStartDate = (raw: string): number => {
          if (!raw) return 0;
          const compact = raw.match(/^([A-Za-z]+ \d+)[–—-]\d+,?\s*(\d{4})/);
          if (compact) {
            const d = new Date(`${compact[1]}, ${compact[2]}`);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          }
          const start = raw.split(/\s[–—-]\s/)[0].trim();
          const d = new Date(start + (start.match(/^\d{4}-\d{2}-\d{2}$/) ? 'T00:00:00' : ''));
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };
        valA = parseStartDate(a.date || '');
        valB = parseStartDate(b.date || '');
      } else if (sortField === 'createdAt') {
        valA = (a as any).createdAt?.seconds || 0;
        valB = (b as any).createdAt?.seconds || 0;
      } else if (sortField === 'searchType') {
        valA = a.searchType || '';
        valB = b.searchType || '';
      } else if (sortField === 'location') {
        valA = a.location || '';
        valB = b.location || '';
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
  }, [filtered, sortField, sortDirection]);

  const handleHeaderClick = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const contactedCount = events.filter(l => l.status !== 'Initial').length;

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Team
        </button>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 border border-white/10 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
            {user.photoURL
              ? <img src={user.photoURL} alt={user.displayName} referrerPolicy="no-referrer" />
              : user.displayName?.substring(0, 2).toUpperCase() || '??'}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white leading-tight">{user.displayName}</h2>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Total Leads</p>
          <p className="text-xl font-bold text-white">{events.length}</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Contacted</p>
          <p className="text-xl font-bold text-blue-300">{contactedCount}</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Interested</p>
          <p className="text-xl font-bold text-green-300">
            {events.filter(l => l.responseOutcome === 'Interested').length}
          </p>
        </div>
      </div>

      {/* Filter and sorting control bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/45 border border-white/5 rounded-2xl p-4 shrink-0 shadow-lg backdrop-blur-md">
        {/* Project Selector + Search */}
        <div className="flex flex-1 items-center gap-3 min-w-0 w-full">
          {/* Project Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 pr-8 text-xs text-white font-medium cursor-pointer appearance-none outline-none focus:border-primary/50"
            >
              <option value="all">All Projects</option>
              {Object.entries(projectNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary/50"
            />
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono mr-1">Show:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === 'all'
                  ? "bg-primary/20 border border-primary/30 text-primary font-bold"
                  : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              All ({events.length})
            </button>
            {STAGES.map(stage => {
              const count = events.filter(e => e.status === stage.id).length;
              return (
                <button
                  key={stage.id}
                  onClick={() => setStatusFilter(stage.id)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    statusFilter === stage.id
                      ? "bg-primary/20 border border-primary/30 text-primary font-bold"
                      : "bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  {stage.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-zinc-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-primary/45 cursor-pointer font-sans"
              >
                <option value="createdAt" className="bg-[#030712]">Date Scanned</option>
                <option value="eventName" className="bg-[#030712]">Name (A-Z)</option>
                <option value="searchType" className="bg-[#030712]">Type</option>
                <option value="date" className="bg-[#030712]">Event Date</option>
                <option value="location" className="bg-[#030712]">Location</option>
                <option value="status" className="bg-[#030712]">Pipeline Status</option>
              </select>
            </div>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title={sortDirection === 'asc' ? "Sort Ascending" : "Sort Descending"}
            >
              {sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Headers matching PipelineMode */}
      <div className="hidden md:grid grid-cols-12 gap-3 items-center w-full px-5 py-2.5 bg-zinc-950/40 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mt-1 shrink-0">
        <button
          type="button"
          onClick={() => handleHeaderClick('eventName')}
          className="col-span-3 flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-left font-bold font-mono outline-none"
        >
          Event / Vendor Name
          {sortField === 'eventName' && (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />)}
        </button>
        <button
          type="button"
          onClick={() => handleHeaderClick('searchType')}
          className="col-span-1 flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-left font-bold font-mono outline-none"
        >
          Type
          {sortField === 'searchType' && (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />)}
        </button>
        <button
          type="button"
          onClick={() => handleHeaderClick('date')}
          className="col-span-2 flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-left font-bold font-mono outline-none"
        >
          Date
          {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />)}
        </button>
        <button
          type="button"
          onClick={() => handleHeaderClick('location')}
          className="col-span-2 flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-left font-bold font-mono outline-none"
        >
          Location
          {sortField === 'location' && (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />)}
        </button>
        <button
          type="button"
          onClick={() => handleHeaderClick('status')}
          className="col-span-3 flex items-center justify-end gap-1 hover:text-white transition-colors cursor-pointer text-right font-bold font-mono outline-none w-full"
        >
          Pipeline Status
          {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0" />)}
        </button>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      {/* Lead List using PipelineCard */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar space-y-3 pb-4">
        <AnimatePresence mode="popLayout">
          {sorted.length === 0 ? (
            <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-zinc-950/5 p-6 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">No items found</span>
              <p className="text-[11px] text-slate-600 mt-2 max-w-sm font-medium">No leads matching search criteria or status filter.</p>
            </div>
          ) : (
            sorted.map(event => (
              <PipelineCard
                key={event.eventId}
                event={event}
                selectedEventId={selectedEventId}
                setSelectedEventId={setSelectedEventId}
                updateStatus={async (eventId, newStatus) => updateStatus(eventId, event.projectId, newStatus)}
                updateResponseOutcome={async (eventId, outcome) => updateResponseOutcome(eventId, event.projectId, outcome)}
                updateContactMethod={async (eventId, method) => updateContactMethod(eventId, event.projectId, method)}
                updateNotes={async (eventId, notes) => updateNotes(eventId, event.projectId, notes)}
                updateActionNotes={async (eventId, notesList, latest) => updateActionNotes(eventId, event.projectId, notesList, latest)}
                updateEventDetails={async (eventId, fields) => updateEventDetails(eventId, event.projectId, fields)}
                deleteEvent={async (eventId) => deleteEvent(eventId, event.projectId)}
                stages={STAGES.map(s => ({ id: s.id, label: s.label }))}
                projectName={projectNames[event.projectId] || 'Active Project'}
                userEmail={user.email}
                userDisplayName={user.displayName}
                onDragStart={() => {}}
                onDragEnd={() => {}}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Team Overview ───────────────────────────────────────────────────────────

const AdminMode: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snap => {
      setUsers(snap.docs.map(d => d.data() as UserProfile));
    });
    const unsubLeads = onSnapshot(query(collection(db, 'claimed_leads')), snap => {
      setClaimedLeads(snap.docs.map(d => ({ claimId: d.id, ...d.data() } as ClaimedLead)));
    });
    return () => { unsubUsers(); unsubLeads(); };
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'salesperson' : 'admin';
    await updateDoc(doc(db, 'users', userId), { role: newRole });
  };

  const getLeadsForUser = (userId: string) =>
    claimedLeads.filter(l => l.claimedBy === userId);

  if (selectedUser) {
    return (
      <SalespersonDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  const totalLeads = claimedLeads.length;
  const hotLeads = claimedLeads.filter(l => l.responseOutcome === 'Interested').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
        <p className="text-sm text-slate-400 mt-0.5">Team pipeline overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm text-slate-400">Salespeople</span>
          </div>
          <p className="text-2xl font-bold text-white">{users.filter(u => u.role !== 'admin').length}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="text-sm text-slate-400">Total Claimed Leads</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalLeads}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <span className="text-sm text-slate-400">Interested</span>
          </div>
          <p className="text-2xl font-bold text-white">{hotLeads}</p>
        </div>
      </div>

      {/* Team list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Team</h3>
        {users.map(u => {
          const leads = getLeadsForUser(u.userId);
          const contactedCount = leads.filter(l => l.status !== 'Initial').length;

          return (
            <div
              key={u.userId}
              onClick={() => setSelectedUser(u)}
              className="w-full glass rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-zinc-700 border border-white/10 flex items-center justify-center text-xs font-semibold text-white overflow-hidden shrink-0">
                    {u.photoURL
                      ? <img src={u.photoURL} alt={u.displayName} referrerPolicy="no-referrer" />
                      : u.displayName?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{u.displayName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    u.role === 'admin' ? "bg-amber-500/20 text-amber-400" : "bg-slate-700/50 text-slate-400"
                  )}>
                    {u.role}
                  </span>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{leads.length}</p>
                    <p className="text-xs text-slate-500">leads</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-300">{contactedCount}</p>
                    <p className="text-xs text-slate-500">contacted</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-300">
                      {leads.filter(l => l.responseOutcome === 'Interested').length}
                    </p>
                    <p className="text-xs text-slate-500">hot</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggleRole(u.userId, u.role); }}
                      className={cn(
                        "flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-all",
                        u.role === 'admin'
                          ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                          : "border-white/10 text-slate-400 hover:bg-white/5"
                      )}
                    >
                      <Shield className="h-3 w-3" />
                      {u.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No users have signed in yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMode;

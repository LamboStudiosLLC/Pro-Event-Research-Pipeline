import React, { useEffect, useState, useMemo, useRef } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, deleteDoc, where } from 'firebase/firestore';
import { UserProfile, SavedEvent, ResponseOutcome, ClaimedLead } from '@/src/types';
import {
  Users, TrendingUp, CheckCircle, ChevronRight, Shield,
  ArrowLeft, Search, Filter, ExternalLink, Calendar, Globe,
  ChevronDown, ArrowUp, ArrowDown, SlidersHorizontal, ChevronUp, Clock, Mail, MessageSquare,
  X, Lock, RotateCcw, Archive, ShieldAlert, Trash2
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

const AdminMode: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Lead Manager Modal States
  const [isLeadManagerOpen, setIsLeadManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerStatusFilter, setManagerStatusFilter] = useState<'all' | 'claimed' | 'retired'>('all');
  const [managerOwnerFilter, setManagerOwnerFilter] = useState<string>('all');
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [transferTargetUserId, setTransferTargetUserId] = useState<string>('');

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

  const handleUpdateLeadStatus = async (claimId: string, nextStatus: 'Claimed' | 'Retired' | 'Unclaimed') => {
    try {
      if (nextStatus === 'Unclaimed') {
        const confirmDelete = window.confirm("Are you sure you want to unclaim this lead? This will delete the claim record entirely, making it Available for anyone to claim.");
        if (confirmDelete) {
          await deleteDoc(doc(db, 'claimed_leads', claimId));
        }
      } else if (nextStatus === 'Claimed') {
        await updateDoc(doc(db, 'claimed_leads', claimId), { status: 'Initial' });
      } else if (nextStatus === 'Retired') {
        await updateDoc(doc(db, 'claimed_leads', claimId), { status: 'Retired' });
      }
    } catch (e) {
      console.error("Failed to update claim status:", e);
    }
  };

  const toggleLeadSelection = (claimId: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(claimId) ? prev.filter(id => id !== claimId) : [...prev, claimId]
    );
  };

  const handleTransferLeads = async () => {
    if (selectedLeadIds.length === 0) {
      alert("Please select at least one lead to transfer.");
      return;
    }
    if (!transferTargetUserId) {
      alert("Please select a target user to transfer the leads to.");
      return;
    }
    const targetUser = users.find(u => u.userId === transferTargetUserId);
    if (!targetUser) {
      alert("Selected target user was not found.");
      return;
    }

    const confirmTransfer = window.confirm(`Are You Sure? You are transferring ${selectedLeadIds.length} lead(s) to ${targetUser.displayName || targetUser.email || 'another user'}.`);
    if (!confirmTransfer) return;

    try {
      await Promise.all(selectedLeadIds.map(async (claimId) => {
        const claimRef = doc(db, 'claimed_leads', claimId);
        await updateDoc(claimRef, {
          claimedBy: targetUser.userId,
          claimedByName: targetUser.displayName || targetUser.email || 'Team Member'
        });
      }));

      setSelectedLeadIds([]);
      setSelectionModeActive(false);
      alert(`Successfully transferred the leads to ${targetUser.displayName}.`);
    } catch (e) {
      console.error("Failed to transfer leads:", e);
      alert("An error occurred during transfer.");
    }
  };

  const filteredManagerLeads = useMemo(() => {
    return claimedLeads.filter(l => {
      const matchesSearch = !managerSearch || l.eventName.toLowerCase().includes(managerSearch.toLowerCase());
      const matchesStatus = managerStatusFilter === 'all' ||
        (managerStatusFilter === 'retired' && l.status === 'Retired') ||
        (managerStatusFilter === 'claimed' && l.status !== 'Retired');
      const matchesOwner = managerOwnerFilter === 'all' || l.claimedBy === managerOwnerFilter;
      return matchesSearch && matchesStatus && matchesOwner;
    });
  }, [claimedLeads, managerSearch, managerStatusFilter, managerOwnerFilter]);

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
    <div className="space-y-6 select-text">
      <div>
        <h2 className="text-xl font-semibold text-white">Admin Dashboard</h2>
        <p className="text-sm text-slate-400 mt-0.5">Team pipeline overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-slate-400">Salespeople</span>
            </div>
            <p className="text-2xl font-bold text-white">{users.filter(u => u.role !== 'admin').length}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm text-slate-400">Total Claimed Leads</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLeadManagerOpen(true)}
                className="text-[10px] font-bold px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded transition-all cursor-pointer shadow-sm animate-pulse"
              >
                Lead Manager
              </button>
            </div>
            <p className="text-2xl font-bold text-white">{totalLeads}</p>
          </div>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-slate-400">Interested</span>
            </div>
            <p className="text-2xl font-bold text-white">{hotLeads}</p>
          </div>
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

      {/* Large Lead Manager Modal */}
      {isLeadManagerOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm select-text animate-fadeIn">
          <div className="bg-[#0e0f14] border border-white/10 rounded-2xl w-full max-w-4xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-text">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0 select-text">
              <div className="flex items-center gap-2 select-text">
                <ShieldAlert className="h-5 w-5 text-primary animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider select-text">
                  Master Lead Manager ({filteredManagerLeads.length})
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionModeActive(!selectionModeActive);
                    setSelectedLeadIds([]);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                    selectionModeActive
                      ? "bg-amber-500/20 border-amber-500/30 text-amber-400 font-bold"
                      : "bg-white/5 border-white/5 text-slate-300 hover:text-white"
                  )}
                >
                  {selectionModeActive ? "Exit Selection Mode" : "Move Leads"}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsLeadManagerOpen(false)}
                  className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter System Row */}
            <div className="py-4 border-b border-white/5 flex flex-col md:flex-row gap-4 shrink-0 justify-between items-start md:items-center bg-zinc-950/20 px-2 rounded-xl mt-3 select-text">
              <div className="flex flex-wrap items-center gap-3 flex-1 w-full select-text">
                {/* Search field */}
                <div className="relative min-w-[200px] flex-1 max-w-xs select-text">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search master list..."
                    value={managerSearch}
                    onChange={e => setManagerSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-650 outline-none focus:border-primary/50 font-medium font-mono"
                  />
                </div>

                {/* Status selector */}
                <select
                  value={managerStatusFilter}
                  onChange={e => setManagerStatusFilter(e.target.value as any)}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium cursor-pointer outline-none focus:border-primary/50"
                >
                  <option value="all">All Statuses</option>
                  <option value="claimed">Active Claimed</option>
                  <option value="retired">Retired / Closed</option>
                </select>

                {/* Owner selector */}
                <select
                  value={managerOwnerFilter}
                  onChange={e => setManagerOwnerFilter(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium cursor-pointer outline-none focus:border-primary/50"
                >
                  <option value="all">All Owners</option>
                  {users.map(u => (
                    <option key={u.userId} value={u.userId}>
                      {u.displayName || u.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Move / Transfer Tools */}
              {selectionModeActive && (
                <div className="flex items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-white/5 select-text">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono shrink-0">Transfer to:</span>
                  <select
                    value={transferTargetUserId}
                    onChange={e => setTransferTargetUserId(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value="">-- Choose target owner --</option>
                    {users.map(u => (
                      <option key={u.userId} value={u.userId}>
                        {u.displayName || u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleTransferLeads}
                    className="px-3 py-1 bg-primary hover:bg-secondary text-slate-900 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Submit Transfer
                  </button>
                </div>
              )}
            </div>

            {/* Master Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 pr-1 space-y-2 select-text">
              {filteredManagerLeads.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-white/5 rounded-xl">
                  No matching claimed or retired leads found in master database.
                </div>
              ) : (
                filteredManagerLeads.map((lead) => {
                  const isRetired = lead.status === 'Retired';
                  return (
                    <div
                      key={lead.claimId}
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between gap-4 select-text transition-all",
                        isRetired
                          ? "border-red-500/50 bg-red-950/10 shadow-sm shadow-red-500/5"
                          : "border-white/5 bg-zinc-950/20 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 select-text">
                        {/* Radial circles for selection */}
                        {selectionModeActive && (
                          <button
                            type="button"
                            onClick={() => toggleLeadSelection(lead.claimId)}
                            className={cn(
                              "h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer transition-all",
                              selectedLeadIds.includes(lead.claimId)
                                ? "bg-primary border-primary text-black"
                                : "border-white/20 bg-zinc-900 hover:border-white/35"
                            )}
                          >
                            {selectedLeadIds.includes(lead.claimId) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                            )}
                          </button>
                        )}

                        <div className="min-w-0 flex-1 select-text">
                          <div className="flex items-center gap-2 select-text">
                            <h4 className="font-bold text-xs text-white truncate max-w-sm select-text">
                              {lead.eventName}
                            </h4>
                            <span className={cn(
                              "text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded",
                              lead.searchType === 'vendor' ? "bg-zinc-800 text-slate-300" : "bg-primary/10 text-primary"
                            )}>
                              {lead.searchType || 'event'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 select-text truncate">
                            Owner: <strong className="text-slate-450 font-semibold">{lead.claimedByName || 'Unknown'}</strong> ({lead.claimedBy})
                          </p>
                        </div>
                      </div>

                      {/* Admin Controls */}
                      <div className="shrink-0 flex items-center gap-3 select-none">
                        {/* Status Badge indicator */}
                        <span className={cn(
                          "text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          isRetired ? "bg-red-500/10 text-red-400 border border-red-500/25" : "bg-orange-500/10 text-orange-400 border border-orange-500/25"
                        )}>
                          {isRetired ? "Retired" : "Claimed"}
                        </span>

                        {/* Status Action Selector */}
                        <select
                          value={isRetired ? 'Retired' : 'Claimed'}
                          onChange={e => handleUpdateLeadStatus(lead.claimId, e.target.value as any)}
                          className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 outline-none focus:border-primary/50 cursor-pointer font-sans"
                        >
                          <option value="Claimed">Claimed</option>
                          <option value="Retired">Retired</option>
                          <option value="Unclaimed">Unclaimed (Delete)</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMode;

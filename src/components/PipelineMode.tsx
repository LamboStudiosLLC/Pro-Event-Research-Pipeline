import React, { useEffect, useState } from 'react';
import { SavedEvent } from '@/src/types';
import { useFirebase } from './FirebaseProvider';
import { db } from '@/src/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, query as fsQuery } from 'firebase/firestore';
import { 
  ChevronRight, 
  MoreHorizontal, 
  MessageSquare, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Trash2,
  Calendar,
  MapPin,
  Clock,
  ChevronDown,
  Zap,
  Share2,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PipelineCard from './PipelineCard';

interface PipelineModeProps {
  activeProjectId: string | null;
}

const STAGES = [
  { id: 'Initial', label: 'Not Started', icon: Clock, color: 'text-gray-450' },
  { id: 'Contacted', label: 'Contacted', icon: Mail, color: 'text-blue-400' },
  { id: 'Responded', label: 'Responded', icon: MessageSquare, color: 'text-yellow-400' }
];

const PipelineMode: React.FC<PipelineModeProps> = ({ activeProjectId }) => {
  const { user } = useFirebase();
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  const [sortField, setSortField] = useState<'eventName' | 'status' | 'date' | 'createdAt'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const expandedEvent = events.find(e => e.eventId === selectedEventId);
  const expandedStageId = expandedEvent ? expandedEvent.status : null;

  useEffect(() => {
    if (!user || !activeProjectId) {
      setProjectName('');
      return;
    }
    const projRef = doc(db, 'users', user.uid, 'projects', activeProjectId);
    const unsub = onSnapshot(projRef, (docSnap) => {
      if (docSnap.exists()) {
        setProjectName(docSnap.data().name || '');
      }
    });
    return () => unsub();
  }, [user, activeProjectId]);

  const downloadPipelineCSV = () => {
    if (events.length === 0) {
      alert("No tracked events or vendors in this pipeline to export.");
      return;
    }

    const escapeCSV = (val: string) => {
      if (!val) return '""';
      return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    const headers = [
      "Salesperson",
      "App Project Name",
      "Exported Timestamp",
      "Event/Vendor Name",
      "Pipeline Status",
      "Type",
      "Date",
      "Product/Services",
      "Location / Corporate HQ",
      "Contact Method",
      "General Notes"
    ];

    const maxContacts = Math.max(3, ...events.map(e => e.contacts?.length || 0));
    const maxActions = Math.max(3, ...events.map(e => e.actionNotes?.length || 0));

    for (let i = 1; i <= maxContacts; i++) {
      headers.push(
        `Contact ${i} Name`,
        `Contact ${i} Role`,
        `Contact ${i} Email`,
        `Contact ${i} Phone`,
        `Contact ${i} Social`
      );
    }

    for (let j = 1; j <= maxActions; j++) {
      headers.push(
        `Action/Note ${j} Date`,
        `Action/Note ${j} Text`
      );
    }

    const rows: string[] = [];

    events.forEach(event => {
      const typeLabel = event.searchType === "vendor" ? "Vendor" : "Event";
      const isVendor = event.searchType === "vendor";
      const locationLabel = isVendor ? `HQ: ${event.location}` : event.location;
      const generalNotes = event.notes || "";

      const rowValues = [
        escapeCSV(`${user?.displayName || "Anonymous"} <${user?.email || "No Email"}>`),
        escapeCSV(projectName || "Active Project"),
        escapeCSV(new Date().toUTCString()),
        escapeCSV(event.eventName),
        escapeCSV(event.status),
        escapeCSV(typeLabel),
        escapeCSV(isVendor ? "" : event.date),
        escapeCSV(isVendor ? event.date : ""),
        escapeCSV(locationLabel),
        escapeCSV(event.contactMethod || "None"),
        escapeCSV(generalNotes)
      ];

      for (let i = 0; i < maxContacts; i++) {
        const c = event.contacts && event.contacts[i] ? event.contacts[i] : null;
        rowValues.push(
          escapeCSV(c?.name || ""),
          escapeCSV(c?.role || ""),
          escapeCSV(c?.email || ""),
          escapeCSV(c?.phone || ""),
          escapeCSV(c?.social || "")
        );
      }

      for (let j = 0; j < maxActions; j++) {
        const n = event.actionNotes && event.actionNotes[j] ? event.actionNotes[j] : null;
        rowValues.push(
          escapeCSV(n?.createdAt || ""),
          escapeCSV(n?.text || "")
        );
      }

      rows.push(rowValues.join(","));
    });

    const csvContent = [
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const safeProjectName = (projectName || "Project").trim().replace(/[^a-zA-Z0-9]/g, '_');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Pipeline_Share_${safeProjectName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHotAndReadyCSV = () => {
    const hotReadyEvents = events.filter(e => e.status === 'Hot & Ready');
    if (hotReadyEvents.length === 0) {
      alert("No 'Hot & Ready' events or vendors in this pipeline to export.");
      return;
    }

    const escapeCSV = (val: string) => {
      if (!val) return '""';
      return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    const headers = [
      "Salesperson",
      "App Project Name",
      "Exported Timestamp",
      "Event/Vendor Name",
      "Pipeline Status",
      "Type",
      "Date",
      "Product/Services",
      "Location / Corporate HQ",
      "Contact Method",
      "General Notes"
    ];

    const maxContacts = Math.max(3, ...hotReadyEvents.map(e => e.contacts?.length || 0));
    const maxActions = Math.max(3, ...hotReadyEvents.map(e => e.actionNotes?.length || 0));

    for (let i = 1; i <= maxContacts; i++) {
      headers.push(
        `Contact ${i} Name`,
        `Contact ${i} Role`,
        `Contact ${i} Email`,
        `Contact ${i} Phone`,
        `Contact ${i} Social`
      );
    }

    for (let j = 1; j <= maxActions; j++) {
      headers.push(
        `Action/Note ${j} Date`,
        `Action/Note ${j} Text`
      );
    }

    const rows: string[] = [];

    hotReadyEvents.forEach(event => {
      const typeLabel = event.searchType === "vendor" ? "Vendor" : "Event";
      const isVendor = event.searchType === "vendor";
      const locationLabel = isVendor ? `HQ: ${event.location}` : event.location;
      const generalNotes = event.notes || "";

      const rowValues = [
        escapeCSV(`${user?.displayName || "Anonymous"} <${user?.email || "No Email"}>`),
        escapeCSV(projectName || "Active Project"),
        escapeCSV(new Date().toUTCString()),
        escapeCSV(event.eventName),
        escapeCSV(event.status),
        escapeCSV(typeLabel),
        escapeCSV(isVendor ? "" : event.date),
        escapeCSV(isVendor ? event.date : ""),
        escapeCSV(locationLabel),
        escapeCSV(event.contactMethod || "None"),
        escapeCSV(generalNotes)
      ];

      for (let i = 0; i < maxContacts; i++) {
        const c = event.contacts && event.contacts[i] ? event.contacts[i] : null;
        rowValues.push(
          escapeCSV(c?.name || ""),
          escapeCSV(c?.role || ""),
          escapeCSV(c?.email || ""),
          escapeCSV(c?.phone || ""),
          escapeCSV(c?.social || "")
        );
      }

      for (let j = 0; j < maxActions; j++) {
        const n = event.actionNotes && event.actionNotes[j] ? event.actionNotes[j] : null;
        rowValues.push(
          escapeCSV(n?.createdAt || ""),
          escapeCSV(n?.text || "")
        );
      }

      rows.push(rowValues.join(","));
    });

    const csvContent = [
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const safeProjectName = (projectName || "Project").trim().replace(/[^a-zA-Z0-9]/g, '_');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Pipeline_Hot_Ready_${safeProjectName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!user || !activeProjectId) {
      setEvents([]);
      return;
    }
    const q = query(collection(db, 'users', user.uid, 'projects', activeProjectId, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const evs = snapshot.docs.map(doc => ({ 
        eventId: doc.id, 
        ...doc.data() 
      } as SavedEvent));
      setEvents(evs);
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  const updateStatus = async (eventId: string, newStatus: SavedEvent['status']) => {
    if (!user || !activeProjectId) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      await updateDoc(eventRef, { status: newStatus });

      // Sync status to the company-wide claimed_leads registry so the admin sees live progress
      const event = events.find(e => e.eventId === eventId);
      if (event) {
        const claimSnap = await getDocs(fsQuery(
          collection(db, 'claimed_leads'),
          where('claimedBy', '==', user.uid),
          where('normalizedName', '==', event.eventName.toLowerCase().replace(/\b(20\d{2})\b/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
        ));
        await Promise.all(claimSnap.docs.map(d => updateDoc(d.ref, { status: newStatus })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateContactMethod = async (eventId: string, contactMethod: string) => {
    if (!user || !activeProjectId) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      await updateDoc(eventRef, { contactMethod });
    } catch (e) {
      console.error(e);
    }
  };

  const updateNotes = async (eventId: string, notes: string) => {
    if (!user || !activeProjectId) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      await updateDoc(eventRef, { notes });
    } catch (e) {
      console.error(e);
    }
  };

  const updateActionNotes = async (eventId: string, actionNotes: any[], latestNoteText?: string) => {
    if (!user || !activeProjectId) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      const updateData: any = { actionNotes };
      if (latestNoteText !== undefined) {
        updateData.notes = latestNoteText;
      }
      await updateDoc(eventRef, updateData);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user || !activeProjectId) return;
    const confirmDelete = window.confirm(
      "Warning: This delete action is permanent!\n\nIf you wish to take this listing out of the pipeline and return it to the Scans list, you must delete/un-save it from the Research > List Editor > Pipeline instead.\n\nAre you sure you want to permanently delete this listing?"
    );
    if (!confirmDelete) return;

    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (e) {
      console.error(e);
    }
  };

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <div className="p-6 bg-white/5 rounded-full mb-6">
          <Clock className="h-12 w-12 text-gray-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-300">No project selected</h3>
        <p className="text-gray-500">Select or create a project to see your sales pipeline.</p>
      </div>
    );
  }

  // Filter and sort events
  const filteredEvents = events.filter(e => {
    // Only show events that belong to STAGES we are keeping
    const isOurStage = STAGES.some(s => s.id === e.status);
    if (!isOurStage) return false;

    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'eventName') {
      valA = a.eventName || '';
      valB = b.eventName || '';
    } else if (sortField === 'status') {
      valA = a.status || '';
      valB = b.status || '';
    } else if (sortField === 'date') {
      valA = a.date || '';
      valB = b.date || '';
    } else if (sortField === 'createdAt') {
      valA = (a as any).createdAt?.seconds || 0;
      valB = (b as any).createdAt?.seconds || 0;
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

  return (
    <div className="flex-1 w-full h-full flex flex-col gap-4">
      {/* Dynamic Header & Actions Bar with Filters (Merged to save space) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/45 border border-white/5 rounded-2xl p-4 shrink-0 shadow-lg backdrop-blur-md">
        {/* Left: Project title and count */}
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-primary font-mono uppercase tracking-widest font-bold">Project Loaded</span>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mt-0.5 truncate select-text">
            {projectName || "Active Project Pipeline"}
            <span className="text-[10px] text-slate-500 font-mono font-normal">({events.length} tracked items)</span>
          </h2>
        </div>

        {/* Right side group: Filters + Sorting */}
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
              All ({events.filter(e => STAGES.some(s => s.id === e.status)).length})
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

          {/* Sorting Options */}
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
                <option value="status" className="bg-[#030712]">Pipeline Status</option>
                <option value="date" className="bg-[#030712]">Event Date</option>
              </select>
            </div>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center p-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title={sortDirection === 'asc' ? "Sort Ascending" : "Sort Descending"}
            >
              {sortDirection === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table Header Row */}
      <div className="hidden md:grid grid-cols-12 gap-3 items-center w-full px-5 py-2.5 bg-zinc-950/40 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono mt-1 shrink-0">
         <span className="col-span-4">Event / Vendor Name</span>
         <span className="col-span-2">Type</span>
         <span className="col-span-3">Date / Location / Services</span>
         <span className="col-span-2 text-right">Pipeline Status</span>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      {/* Horizontal List of Table Rows */}
      <div className="flex-1 w-full overflow-y-auto custom-scrollbar space-y-3 pb-4">
        <AnimatePresence mode="popLayout">
          {sortedEvents.length === 0 ? (
            <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-zinc-950/5 p-6 text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">No items found</span>
              <p className="text-[11px] text-slate-600 mt-2 max-w-sm font-medium">Try searching or adding items on the Research tab, or adjusting your filters.</p>
            </div>
          ) : (
            sortedEvents.map(event => (
              <PipelineCard
                key={event.eventId}
                event={event}
                selectedEventId={selectedEventId}
                setSelectedEventId={setSelectedEventId}
                updateStatus={updateStatus}
                updateContactMethod={updateContactMethod}
                updateNotes={updateNotes}
                updateActionNotes={updateActionNotes}
                deleteEvent={deleteEvent}
                stages={STAGES}
                projectName={projectName}
                userEmail={user?.email || "No Email"}
                userDisplayName={user?.displayName || "Anonymous"}
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

export default PipelineMode;

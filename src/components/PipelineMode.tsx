import React, { useEffect, useState } from 'react';
import { SavedEvent } from '@/src/types';
import { useFirebase } from './FirebaseProvider';
import { db } from '@/src/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  Share2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import PipelineCard from './PipelineCard';

interface PipelineModeProps {
  activeProjectId: string | null;
}

const STAGES = [
  { id: 'Initial', label: 'Initial', icon: Clock, color: 'text-gray-400' },
  { id: 'Contacted', label: 'Contacted', icon: Mail, color: 'text-blue-400' },
  { id: 'Responded', label: 'Responded', icon: MessageSquare, color: 'text-yellow-400' },
  { id: 'Hot & Ready', label: 'Hot & Ready', icon: Zap, color: 'text-amber-400 font-bold' },
  { id: 'Declined', label: 'Declined', icon: Trash2, color: 'text-red-400' }
];

const PipelineMode: React.FC<PipelineModeProps> = ({ activeProjectId }) => {
  const { user } = useFirebase();
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [draggedOverStageId, setDraggedOverStageId] = useState<string | null>(null);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

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

  return (
    <div className="flex-1 w-full h-full flex flex-col gap-4">
      {/* Dynamic Header & Actions Bar */}
      <div className="flex items-center justify-between bg-zinc-950/40 border border-white/5 rounded-2xl p-4 shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-primary font-mono uppercase tracking-widest font-bold">Sales & Exhibition Pipeline</span>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mt-0.5 truncate select-text">
            {projectName || "Active Project Pipeline"}
            <span className="text-[10px] text-slate-500 font-mono font-normal">({events.length} tracked items)</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={downloadHotAndReadyCSV}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4.5 py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-md hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-current" />
            Share Hot & Ready
          </button>
          <button
            type="button"
            onClick={downloadPipelineCSV}
            className="flex items-center gap-2 bg-slate-200 hover:bg-white text-slate-900 font-extrabold px-4.5 py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-md hover:shadow-lg hover:shadow-white/5 cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
            Share Entire Pipeline
          </button>
        </div>
      </div>

      {/* Horizontal View Box for Stages */}
      <div className="flex-1 w-full flex gap-2 h-full items-stretch justify-between select-none pb-2 pt-2 overflow-x-auto min-h-0 custom-scrollbar">
        {STAGES.map((stage, sIdx) => {
        const stageEvents = events.filter(e => e.status === stage.id);
        const Icon = stage.icon;
        const isDraggedOver = draggedOverStageId === stage.id;
        const isReduced = !!expandedStageId && expandedStageId !== stage.id;

        return (
          <React.Fragment key={stage.id}>
            {sIdx > 0 && (
              <div className="w-[1.5px] bg-gradient-to-b from-transparent via-white/10 to-transparent shrink-0 self-stretch my-6" />
            )}
            <div 
              className={cn(
                "flex flex-col h-full rounded-2xl p-1 transition-all duration-300",
                isReduced 
                  ? "w-10 min-w-[40px] flex-none opacity-30 hover:opacity-100"
                  : expandedStageId === stage.id 
                    ? "flex-[3.5] min-w-[340px] md:min-w-[700px] lg:min-w-[850px] xl:min-w-[1000px] bg-white/[0.015]" 
                    : "flex-1 min-w-[170px]"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedOverStageId !== stage.id) {
                  setDraggedOverStageId(stage.id);
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setDraggedOverStageId(stage.id);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                setDraggedOverStageId(null);
                const evId = draggingEventId || e.dataTransfer.getData('text/plain');
                if (evId) {
                  await updateStatus(evId, stage.id as any);
                }
                setDraggingEventId(null);
              }}
            >
              <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                {isReduced ? (
                  <div className="flex items-center justify-center w-full">
                    <div 
                      className={cn("p-1.5 rounded bg-white/5 shrink-0 hover:bg-white/10 transition-all cursor-pointer")}
                      title={`${stage.label} (${stageEvents.length} items)`}
                    >
                      <Icon className={cn("h-3 w-3", stage.color)} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={cn("p-1.5 rounded bg-white/5 shrink-0", stage.color)}>
                       <Icon className="h-3 w-3" />
                    </div>
                    <h4 className="font-bold text-[9px] uppercase tracking-[0.1em] text-slate-500 truncate">{stage.label}</h4>
                    <span className="bg-white/5 text-slate-400 text-[9px] px-1.5 py-0.2 rounded-full font-mono border border-white/5 shrink-0">
                      {stageEvents.length}
                    </span>
                  </div>
                )}
              </div>

              {!isReduced && (
                <div className={cn(
                  "flex-1 space-y-3 overflow-y-auto custom-scrollbar p-1.5 rounded-xl transition-all duration-200 border-2",
                  isDraggedOver ? "bg-primary/5 border-dashed border-primary/30" : "border-transparent"
                )}>
                  <AnimatePresence mode="popLayout">
                    {stageEvents.map(event => (
                      <PipelineCard
                        key={event.eventId}
                        event={event}
                        selectedEventId={selectedEventId}
                        setSelectedEventId={setSelectedEventId}
                        onDragStart={(e, evId) => {
                          e.dataTransfer.setData('text/plain', evId);
                          setDraggingEventId(evId);
                        }}
                        onDragEnd={() => {
                          setDraggedOverStageId(null);
                          // Prevent premature cleanup before the drop target can consume the state
                          setTimeout(() => {
                            setDraggingEventId(null);
                          }, 150);
                        }}
                        updateStatus={updateStatus}
                        updateContactMethod={updateContactMethod}
                        updateNotes={updateNotes}
                        updateActionNotes={updateActionNotes}
                        deleteEvent={deleteEvent}
                        stages={STAGES}
                        projectName={projectName}
                        userEmail={user?.email || "No Email"}
                        userDisplayName={user?.displayName || "Anonymous"}
                      />
                    ))}
                  </AnimatePresence>
                  {stageEvents.length === 0 && (
                    <div className="h-20 border border-dashed border-white/5 rounded-xl flex items-center justify-center">
                      <span className="text-[9px] text-slate-800 font-bold uppercase tracking-widest">Drop here</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      </div>
    </div>
  );
};

export default PipelineMode;

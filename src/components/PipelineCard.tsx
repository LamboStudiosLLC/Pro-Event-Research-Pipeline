import React, { useState, useEffect, useRef } from 'react';
import { SavedEvent } from '@/src/types';
import { 
  Calendar, 
  MapPin, 
  ChevronDown, 
  Trash2, 
  Users,
  Mail,
  Phone,
  Link as LinkIcon,
  MessageSquare,
  Zap,
  Info,
  Bookmark,
  Briefcase,
  Maximize2,
  Minimize2,
  Share2,
  Copy
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface EmailTemplate {
  id: string;
  name: string;
  text: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'outreach1',
    name: 'Outreach & Inquiry',
    text: `Hi [Contact Name],\n\nI hope you are having an excellent week.\n\nI am reaching out representing our organization. I noticed you are involved with [Event Name] and we are very interested in learning more about your solutions and current focus.\n\nWould you have 10-15 minutes in the coming days for a brief introductory greeting call to share insights?\n\nBest regards,\n[Salesperson]`
  },
  {
    id: 'followup1',
    name: 'Post-Event Follow-up',
    text: `Hi [Contact Name],\n\nIt was great meeting you and discussing your team's objectives during [Event Name]!\n\nI wanted to share our latest resources. Our company specializes in delivering highly optimized solutions that align perfectly with the goals we spoke about.\n\nLet me know if you are open to a follow-up discussion on Tuesday or Thursday next week.\n\nBest,\n[Salesperson]`
  },
  {
    id: 'pitch1',
    name: 'Vendor Request Proposal',
    text: `Hi procurement team,\n\nWe are looking to secure a premier partnership deal. During our evaluation of [Vendor Name], we were highly impressed by the breadth of your services and corporate track records.\n\nAre you available for a exploratory sales consultation to discuss how we can work together?\n\nThank you,\n[Salesperson]`
  }
];

interface PipelineCardProps {
  event: SavedEvent;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  onDragStart: (e: React.DragEvent, eventId: string) => void;
  onDragEnd: () => void;
  updateStatus: (eventId: string, newStatus: SavedEvent['status']) => Promise<void>;
  updateContactMethod: (eventId: string, contactMethod: string) => Promise<void>;
  updateNotes: (eventId: string, notes: string) => Promise<void>;
  updateActionNotes: (eventId: string, actionNotes: any[], latestNoteText?: string) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  stages: { id: string; label: string }[];
  projectName: string;
  userEmail: string;
  userDisplayName: string;
}

const PipelineCard: React.FC<PipelineCardProps> = ({
  event,
  selectedEventId,
  setSelectedEventId,
  onDragStart,
  onDragEnd,
  updateStatus,
  updateContactMethod,
  updateNotes,
  updateActionNotes,
  deleteEvent,
  stages,
  projectName,
  userEmail,
  userDisplayName
}) => {
  const [canDrag, setCanDrag] = useState(true);
  const [featuredNoteId, setFeaturedNoteId] = useState<string | null>(null);
  const [newNoteValue, setNewNoteValue] = useState('');
  const isExpanded = selectedEventId === event.eventId;
  const cardRef = useRef<HTMLDivElement>(null);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [emailText, setEmailText] = useState('');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSavingTemplateMode, setIsSavingTemplateMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
    if (selectedTemplateId === id) {
      setSelectedTemplateId('');
      setEmailText('');
    }
  };

  // Load templates from localStorage on mount & when card is expanded
  useEffect(() => {
    if (isExpanded) {
      const stored = localStorage.getItem('email_templates');
      if (stored) {
        try {
          setTemplates(JSON.parse(stored));
        } catch (e) {
          setTemplates(DEFAULT_TEMPLATES);
        }
      } else {
        setTemplates(DEFAULT_TEMPLATES);
        localStorage.setItem('email_templates', JSON.stringify(DEFAULT_TEMPLATES));
      }
    }
  }, [isExpanded]);

  const applyReplacements = (tplText: string) => {
    let text = tplText;
    const nameVal = event.eventName;
    const salespersonName = userDisplayName || "Sales Representative";
    const contactNameVal = (event.contacts && event.contacts[0]?.name) || "Team";
    
    // replace variables
    text = text.replace(/\[Event Name\]/gi, nameVal);
    text = text.replace(/\[Vendor Name\]/gi, nameVal);
    text = text.replace(/\[Event\]/gi, nameVal);
    text = text.replace(/\[Vendor\]/gi, nameVal);
    
    text = text.replace(/\[Salesperson\]/gi, salespersonName);
    text = text.replace(/\[Contact Name\]/gi, contactNameVal);
    
    return text;
  };

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    if (!id) {
      setEmailText("");
      return;
    }
    const found = templates.find(t => t.id === id);
    if (found) {
      const resolved = applyReplacements(found.text);
      setEmailText(resolved);
    }
  };

  const handleConfirmSaveTemplate = () => {
    if (!newTemplateName.trim()) {
      alert("Please enter a template name.");
      return;
    }
    if (!emailText.trim()) {
      alert("Please enter some text in the composer to save as a template.");
      return;
    }

    const newTemplate: EmailTemplate = {
      id: Math.random().toString(36).substring(2, 11),
      name: newTemplateName.trim(),
      text: emailText
    };

    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('email_templates', JSON.stringify(updated));
    setSelectedTemplateId(newTemplate.id);
    setIsSavingTemplateMode(false);
    setNewTemplateName("");
    alert(`Template "${newTemplate.name}" saved successfully!`);
  };

  const handleCopyText = () => {
    if (!emailText) return;
    navigator.clipboard.writeText(emailText);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleLaunchEmailProgram = () => {
    const contactsList = event.contacts || [];
    if (contactsList.length > 0) {
      setIsContactSelectorOpen(true);
    } else {
      const subject = `Outreach - ${event.eventName}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;
    }
  };

  const notesList = event.actionNotes || [];
  const featuredNote = notesList.find(n => n.id === featuredNoteId) || notesList[0];

  // Click outside detector to minimize card and restore defaults
  useEffect(() => {
    if (!isExpanded) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSelectedEventId(null);
      }
    };

    // Delay attachment so we don't immediately intercept the opening click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 120);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isExpanded, setSelectedEventId]);

  const handleSaveCardNote = async () => {
    if (!newNoteValue.trim()) return;
    
    const newNote = {
      id: Math.random().toString(36).substring(2, 11),
      text: newNoteValue.trim(),
      createdAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    const updatedNotes = [newNote, ...notesList];
    await updateActionNotes(event.eventId, updatedNotes, newNoteValue.trim());
    setNewNoteValue('');
    setFeaturedNoteId(newNote.id);
  };

  const handleDeleteCardNote = async (noteId: string) => {
    const updatedNotes = notesList.filter(note => note.id !== noteId);
    if (featuredNoteId === noteId) {
      setFeaturedNoteId(null);
    }
    await updateActionNotes(event.eventId, updatedNotes, updatedNotes[0]?.text || '');
  };

  const downloadSingleCardCSV = () => {
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

    const maxContacts = Math.max(3, event.contacts?.length || 0);
    const maxActions = Math.max(3, (event.actionNotes || []).length);

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

    const typeLabel = event.searchType === "vendor" ? "Vendor" : "Event";
    const isVendor = event.searchType === "vendor";
    const locationLabel = isVendor ? `HQ: ${event.location}` : event.location;
    const generalNotes = event.notes || "";

    const rowValues = [
      escapeCSV(`${userDisplayName} <${userEmail}>`),
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

    const csvContent = [
      headers.join(","),
      rowValues.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const safeEventName = event.eventName.trim().replace(/[^a-zA-Z0-9]/g, '_');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Card_Share_${safeEventName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      ref={cardRef}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable={canDrag}
      onDragStart={(e) => onDragStart(e, event.eventId)}
      onDragEnd={onDragEnd}
      className={cn(
        "glass p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing group relative shadow-xl select-text w-full",
        isExpanded ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5 shrink-0" : "border-white/5 hover:border-primary/40 hover:bg-white/[0.04]"
      )}
    >
      {/* Expand/Collapse Button in the Upper Right Corner */}
      <div className="absolute top-2.5 right-2 z-20">
         <button 
          type="button"
          draggable={false}
          onMouseDown={(e) => {
            e.stopPropagation();
            setCanDrag(false);
          }}
          onMouseEnter={() => setCanDrag(false)}
          onMouseLeave={() => setCanDrag(true)}
          onClick={(e) => { 
            e.stopPropagation(); 
            setSelectedEventId(isExpanded ? null : event.eventId); 
          }}
          className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded border border-white/5 transition-all cursor-pointer"
          title={isExpanded ? "Minimize Card" : "Expand Card"}
         >
           {isExpanded ? <Minimize2 className="h-3 w-3 text-primary" /> : <Maximize2 className="h-3 w-3" />}
         </button>
      </div>

      {/* Top Header Section (Click anywhere here triggers Expand/Collapse toggle) */}
      <div 
        className="cursor-pointer select-text pr-8 pb-1"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedEventId(isExpanded ? null : event.eventId);
        }}
        title="Click card header to expand or edit detail views"
      >
        <h5 className="font-bold text-[12px] mb-2 leading-tight tracking-tight text-white group-hover:text-primary transition-colors truncate">
          {event.eventName}
        </h5>
        
        {event.isSandbox && (
          <div className="mb-2 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded px-1.5 py-1 text-[8.5px] font-semibold leading-tight flex items-start gap-1">
            <span className="shrink-0 h-1.5 w-1.5 rounded-full bg-amber-500 mt-0.5" />
            <span>Sandbox Test Record. Please delete after testing.</span>
          </div>
        )}
        
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 truncate" title={event.searchType === 'vendor' ? "Services & Solutions" : "Dates"}>
            {event.searchType === 'vendor' ? (
              <Briefcase className="h-2.5 w-2.5 text-primary/60 shrink-0" />
            ) : (
              <Calendar className="h-2.5 w-2.5 text-primary/60 shrink-0" />
            )}
            <span className="truncate">{event.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 truncate" title={event.searchType === 'vendor' ? "Corporate Headquarters" : "Event Location"}>
            <MapPin className="h-2.5 w-2.5 text-primary/60 shrink-0" />
            <span className="truncate">{event.searchType === 'vendor' ? `HQ: ${event.location}` : event.location}</span>
          </div>
        </div>
      </div>

      {/* Interactive elements section - disable dragging when hovering or interacting here */}
      <div 
        className="space-y-2 mt-2" 
        onMouseEnter={() => setCanDrag(false)}
        onMouseLeave={() => setCanDrag(true)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 justify-between">
          {/* Status Dropdown with Reduced Width */}
          <div className="relative flex-1 max-w-[120px] min-w-[75px]">
            <select 
              value={event.status}
              onChange={(e) => { 
                e.stopPropagation(); 
                updateStatus(event.eventId, e.target.value as any); 
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-zinc-900/60 border border-white/5 rounded pl-1.5 pr-5 py-1 text-[9px] font-semibold text-slate-300 focus:outline-none focus:border-primary/40 appearance-none transition-all cursor-pointer relative z-10"
            >
              {stages.map(s => <option key={s.id} value={s.id} className="bg-[#030712]">{s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-slate-500 pointer-events-none z-20" />
          </div>

          {/* Share & Trash Buttons Side-by-Side in lower right corner */}
          <div className="flex items-center gap-1 shrink-0">
             <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                downloadSingleCardCSV();
              }}
              className="p-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded border border-white/5 hover:border-white/10 transition-all cursor-pointer flex items-center justify-center h-[22px] w-[22px]"
              title="Share Card CSV"
             >
               <Share2 className="h-3.5 w-3.5" />
             </button>

             <button 
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                deleteEvent(event.eventId); 
              }}
              className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer flex items-center justify-center h-[22px] w-[22px]"
              title="Delete Event"
             >
               <Trash2 className="h-3.5 w-3.5" />
             </button>
          </div>
        </div>

        {event.status === 'Contacted' && (
          <div className="flex items-center justify-between bg-black/40 p-1 rounded border border-white/5 mt-1">
            <span className="text-[8px] uppercase tracking-wider font-bold text-slate-500 pl-1">Method:</span>
            <select
              value={event.contactMethod || 'Email'}
              onChange={(e) => updateContactMethod(event.eventId, e.target.value)}
              className="bg-zinc-900 border border-white/15 rounded px-1 py-0.5 text-[8px] text-primary focus:outline-none focus:border-primary/40 cursor-pointer"
            >
              <option value="Email" className="bg-[#030712]">Email</option>
              <option value="Phone Call" className="bg-[#030712]">Phone Call</option>
              <option value="LinkedIn" className="bg-[#030712]">LinkedIn</option>
              <option value="In Person" className="bg-[#030712]">In Person</option>
              <option value="Other" className="bg-[#030712]">Other</option>
            </select>
          </div>
        )}
      </div>

      {/* Expanded view for viewing ALL contact information details and notes */}
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-white/10 space-y-3"
          onMouseEnter={() => setCanDrag(false)}
          onMouseLeave={() => setCanDrag(true)}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Grid Layout taking advantage of 3-column wide layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Columns 1 & 2: Email Composer or Details Overview */}
            {isComposerOpen ? (
              <div key="composer-box" className="col-span-1 md:col-span-2 bg-[#090d16]/85 p-4 rounded-xl border border-primary/25 flex flex-col justify-between shadow-2xl relative select-text mb-2 min-h-[320px] h-full space-y-3">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider font-mono">AI Email Composer</span>
                  </div>
                  
                  {/* Template actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Custom Dropdown menu with red delete "X" */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                        className="bg-black/60 border border-white/10 hover:border-white/20 rounded px-2.5 py-1 text-[9px] text-slate-205 focus:outline-none focus:border-primary/40 flex items-center justify-between gap-1.5 font-mono font-medium min-w-[130px] max-w-[170px] cursor-pointer"
                      >
                        <span className="truncate">
                          {selectedTemplateId ? (templates.find(t => t.id === selectedTemplateId)?.name || 'Custom Draft') : '-- Choose Template --'}
                        </span>
                        <ChevronDown className="h-2.5 w-2.5 text-slate-450 shrink-0" />
                      </button>
                      
                      {isTemplateMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsTemplateMenuOpen(false)} />
                          <div className="absolute right-0 mt-1 w-[220px] bg-[#0c101a] border border-white/10 rounded-lg shadow-2xl py-1 z-50 max-h-[180px] overflow-y-auto custom-scrollbar">
                            {templates.length === 0 ? (
                              <div className="px-3 py-2 text-[8px] text-slate-450 italic">No templates available.</div>
                            ) : (
                              templates.map(tpl => (
                                <div
                                  key={tpl.id}
                                  className="flex items-center justify-between px-2.5 py-1.5 hover:bg-white/[0.04] text-[9.5px] text-slate-200 transition-colors cursor-pointer group"
                                  onClick={() => {
                                    handleSelectTemplate(tpl.id);
                                    setIsTemplateMenuOpen(false);
                                  }}
                                >
                                  <span className="truncate pr-2 font-sans font-medium">{tpl.name}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTemplate(tpl.id);
                                    }}
                                    className="p-1 hover:bg-red-500/10 text-red-500 hover:text-red-400 rounded cursor-pointer transition-all shrink-0 font-bold"
                                    title="Delete Template"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Button Save As Template */}
                    {isSavingTemplateMode ? (
                      <div className="flex items-center bg-black/60 border border-white/10 rounded px-1.5 py-0.5 gap-1.5 min-w-[180px]">
                        <input
                          type="text"
                          placeholder="Template Name..."
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                          className="bg-transparent border-none text-[9px] text-white focus:outline-none w-[90px] font-sans"
                        />
                        <button
                          type="button"
                          onClick={handleConfirmSaveTemplate}
                          className="px-2 py-0.5 bg-primary hover:bg-secondary text-slate-900 font-bold rounded text-[8px] cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSavingTemplateMode(false);
                            setNewTemplateName("");
                          }}
                          className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded text-[8px] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSavingTemplateMode(true)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded text-[9px] font-bold cursor-pointer transition-all hover:text-white"
                      >
                        Save As Template
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Composition space - utilizes the full remaining height of the container */}
                <div className="relative select-text flex-grow flex flex-col min-h-[180px] md:min-h-[220px]">
                  <textarea
                    value={emailText}
                    onChange={(e) => {
                      setEmailText(e.target.value);
                      setSelectedTemplateId(""); // clear selected if they edit
                    }}
                    placeholder="Write or paste your email outreach draft here, or select a template from the dropdown menu to auto-fill placeholders like [Event Name] or [Vendor Name]..."
                    className="w-full flex-grow bg-black/50 border border-white/5 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 h-full custom-scrollbar font-sans select-text leading-relaxed resize-none scrollbar-thin"
                  />
                </div>

                {/* Footer with actions: Copy Text, New Email client */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/5 shrink-0">
                  <div className="text-[8px] text-slate-500 font-mono">
                    Dynamic variables used: <span className="text-primary font-bold">{event.eventName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Copy Text */}
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white border border-white/10 rounded-lg text-[9px] font-bold cursor-pointer transition-all"
                    >
                      <Copy className="h-3 w-3 text-slate-450" />
                      <span>{copiedDraft ? "Copied!" : "Copy Text"}</span>
                    </button>

                    {/* Open in Default Email Client */}
                    <button
                      type="button"
                      onClick={handleLaunchEmailProgram}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-primary hover:bg-secondary text-slate-900 font-bold rounded-lg text-[9px] cursor-pointer transition-all shadow-md shrink-0"
                    >
                      <Zap className="h-3.5 w-3.5 text-slate-900 animate-pulse" />
                      <span>New Email</span>
                    </button>

                    {/* Button to Close Composer */}
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(false)}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-450 hover:text-white rounded-lg text-[9px] cursor-pointer border border-white/10"
                    >
                      Close Composer
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Column 1: Record Overview Description */}
                <div className="space-y-3 bg-black/35 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between h-full select-text min-h-[320px]">
                  <div className="space-y-2.5 select-text flex-1 flex flex-col h-full">
                    <div className="flex items-center gap-2.5 select-text pb-1.5 border-b border-white/5 shrink-0">
                      {event.logoUrl ? (
                        <img src={event.logoUrl} alt={event.eventName} referrerPolicy="no-referrer" className="w-9 h-9 rounded object-contain bg-white/5 p-0.5 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center font-bold text-primary font-mono text-[11px] shrink-0">
                          {event.eventName.trim().charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 select-text">
                        <span className="text-[7.5px] uppercase tracking-widest text-primary font-bold font-mono block">Overview Profile</span>
                        <h4 className="text-[11.5px] font-bold text-white leading-tight truncate">{event.eventName}</h4>
                      </div>
                    </div>

                    {event.website && (
                      <div className="text-[9.5px] text-slate-400 truncate flex items-center gap-1.5 select-text shrink-0">
                        <LinkIcon className="h-3 w-3 text-slate-600 shrink-0" />
                        <a href={event.website.startsWith('http') ? event.website : `https://${event.website}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate select-text">
                          {event.website}
                        </a>
                      </div>
                    )}

                    <div className="flex-grow flex flex-col min-h-0 select-text pt-1">
                      <span className="font-semibold text-slate-400 block mb-1.5 text-[8.5px] uppercase tracking-wider font-mono shrink-0">Detailed Bio/Description:</span>
                      <div className="text-[10px] text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5 overflow-y-auto custom-scrollbar select-text flex-grow min-h-[160px] max-h-[320px]">
                        {event.description || "No full description compiled for this pipeline entry yet. Use the Search or AI Assistant to fetch detailed metadata and corporate focus updates."}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Status Log Context - Now populating with all user notes */}
                <div className="space-y-3 bg-black/35 p-3.5 rounded-xl border border-white/5 flex flex-col justify-between select-text min-h-[320px]">
                  <div className="space-y-2.5 select-text flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/5 shrink-0">
                      <div className="flex items-center gap-1.5 select-text">
                        <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                        <label className="text-[8px] uppercase font-bold text-slate-300 tracking-widest font-mono">
                          Active General Notes
                        </label>
                      </div>
                      <span className="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold font-mono">
                        {notesList.length} Entries
                      </span>
                    </div>

                    {/* Scrollable Timeline list of user notes separated by timestamp subtitles */}
                    <div className="flex-1 overflow-y-auto min-h-[140px] max-h-[260px] custom-scrollbar space-y-3 pr-1 py-1 select-text scrollbar-thin">
                      {notesList.length === 0 ? (
                        <div className="text-[9.5px] text-slate-500 italic py-4 text-center">
                          No logging timeline or notes registered yet. Type updates below.
                        </div>
                      ) : (
                        notesList.map((note) => (
                          <div 
                            key={note.id} 
                            className="p-2.5 rounded bg-white/[0.015] border border-white/5 relative group/note select-text transition-all hover:bg-white/[0.03]"
                          >
                            <div className="flex justify-between items-center gap-2 mb-1 border-b border-white/[0.03] pb-1 select-text">
                              <span className="text-[7.5px] text-primary/80 font-mono tracking-tight select-text font-semibold">
                                {note.createdAt}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCardNote(note.id)}
                                className="opacity-0 group-hover/note:opacity-100 p-0.5 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded transition-all cursor-pointer"
                                title="Delete log entry"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-250 select-text break-words leading-relaxed whitespace-pre-wrap font-sans">
                              {note.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Note Creator Input Field inside Center Column */}
                  <div className="space-y-2 pt-2 border-t border-white/5 select-text shrink-0">
                    <textarea
                      placeholder="Type a new update, action log, or note here..."
                      value={newNoteValue}
                      onChange={(e) => setNewNoteValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[9.5px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 min-h-[42px] max-h-[80px] resize-y custom-scrollbar font-sans select-text scrollbar-thin"
                    />
                    {newNoteValue.trim() && (
                      <div className="flex justify-end select-text">
                        <button
                          type="button"
                          onClick={handleSaveCardNote}
                          className="px-2.5 py-1 bg-primary text-[8.5px] hover:bg-secondary text-slate-900 rounded font-bold transition-all cursor-pointer shadow-md"
                        >
                          Save Entry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Column 3: Stacked Contacts AND Action logs - now take full height with enlarged Compose Email at top */}
            <div className="space-y-3.5 col-span-1 flex flex-col h-full select-text">
              {/* Larger Compose Email Button at top of Column 3 */}
              <button
                type="button"
                onClick={() => setIsComposerOpen(!isComposerOpen)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[9.5px] uppercase tracking-widest bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 hover:border-primary/45 rounded-xl font-bold transition-all cursor-pointer shadow-md shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <Mail className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                <span>{isComposerOpen ? "Close Email Composer" : "Compose Email"}</span>
              </button>

              {/* Contacts Info Box - taking full remaining height */}
              <div className="bg-[#040812]/50 p-3.5 rounded-xl border border-white/5 space-y-3 select-text shadow-inner flex-grow flex flex-col justify-between h-full">
                <div className="space-y-3 select-text flex-grow flex flex-col min-h-0 h-full">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-white/5 shrink-0">
                    <Users className="h-3 w-3 text-primary" />
                    <label className="text-[8px] uppercase font-bold text-slate-300 tracking-widest font-mono">
                      Channel Contacts ({(event.contacts || []).length})
                    </label>
                  </div>
                  
                  {(event.contacts || []).length === 0 ? (
                    <div className="text-[9px] text-slate-500 italic py-2 text-center select-text font-mono">No contacts specified.</div>
                  ) : (
                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-0.5 select-text flex-1 max-h-[380px] scrollbar-thin">
                      {(event.contacts || []).map((contact, cIdx) => (
                        <div 
                          key={cIdx} 
                          className="p-2.5 rounded bg-white/[0.015] hover:bg-white/[0.035] border border-white/5 text-[10px] transition-all space-y-1.5 select-text"
                        >
                          <div className="flex flex-col gap-0.5 select-text">
                            <span className="font-semibold text-slate-200 select-text text-[10.5px]">
                              {contact.name}
                            </span>
                            {contact.role && (
                              <span className="text-[7px] uppercase tracking-widest text-primary font-bold px-1.5 py-0.5 bg-primary/10 rounded border border-primary/10 self-start mt-0.5 font-mono">
                                {contact.role}
                              </span>
                            )}
                          </div>
                          
                          {/* Detailed communication coordinates */}
                          <div className="space-y-1 text-[9px] text-slate-400 font-mono select-text mt-1.5">
                            {contact.email && (
                              <div className="flex items-center gap-1.5 truncate select-text">
                                <Mail className="h-2.5 w-2.5 text-slate-600 shrink-0" />
                                <span className="select-text text-slate-300">{contact.email}</span>
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-1.5 truncate select-text">
                                <Phone className="h-2.5 w-2.5 text-slate-600 shrink-0" />
                                <span className="select-text">{contact.phone}</span>
                              </div>
                            )}
                            {contact.social && (
                              <div className="flex items-center gap-1.5 truncate select-text">
                                <LinkIcon className="h-2.5 w-2.5 text-slate-600 shrink-0" />
                                <span className="select-text">{contact.social}</span>
                              </div>
                            )}
                            {contact.contactInfo && (
                              <div className="text-[8.5px] text-slate-400 font-mono break-all whitespace-pre-wrap bg-black/20 p-1.5 rounded mt-1.5 select-text">
                                <span className="select-text">{contact.contactInfo}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Contact Selector Modal Overlay for populating target To: recipient */}
          {isContactSelectorOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 select-text">
              <div className="bg-[#0b0f19] border border-primary/25 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative select-text">
                <h4 className="text-[11px] font-bold font-mono text-primary uppercase tracking-wider">Select Contact Recipient</h4>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Choose a contact from <strong className="text-white">{event.eventName}</strong> to set as the "To" recipient for your outreach email.
                </p>
                
                <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar select-text">
                  {(event.contacts || []).map((contact, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const mailToAddr = contact.email || '';
                        const subject = `Outreach - ${event.eventName}`;
                        window.location.href = `mailto:${encodeURIComponent(mailToAddr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;
                        setIsContactSelectorOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] hover:bg-primary/10 border border-white/5 hover:border-primary/25 transition-all flex flex-col gap-0.5 group/item cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-slate-200 group-hover/item:text-primary transition-colors">{contact.name}</span>
                      <span className="text-[7.5px] uppercase tracking-widest text-[#a855f7] font-mono">{contact.role || "No Role Listed"}</span>
                      {contact.email ? (
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 group-hover/item:text-white transition-colors">{contact.email}</span>
                      ) : (
                        <span className="text-[9px] text-red-400/60 font-mono mt-0.5 italic">No email address on file</span>
                      )}
                    </button>
                  ))}
                  
                  {/* Option to proceed with no specific email */}
                  <button
                    type="button"
                    onClick={() => {
                      const subject = `Outreach - ${event.eventName}`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailText)}`;
                      setIsContactSelectorOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-black/40 hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center text-slate-450 hover:text-white cursor-pointer"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">Send without recipient</span>
                    <span className="text-[7.5px] text-slate-500 font-mono">Fill in To: field manually in draft</span>
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setIsContactSelectorOpen(false)}
                    className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 hover:border-white/10 rounded-lg text-[9px] font-bold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      )}
    </motion.div>
  );
};

export default PipelineCard;

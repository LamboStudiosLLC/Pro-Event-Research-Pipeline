import React, { useState, useEffect } from 'react';
import { ResearchResult, SavedEvent, ActionNote, ResearchCueItem } from '@/src/types';
import { useFirebase } from './FirebaseProvider';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, query as fsQuery, onSnapshot, deleteDoc } from 'firebase/firestore';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Heart, 
  Share2, 
  Download, 
  Copy,
  PlusCircle,
  Clock,
  Briefcase,
  Users,
  Zap,
  CheckCircle,
  Bookmark,
  Trash2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Layers,
  Globe,
  Linkedin,
  Image,
  Upload,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const getSimulatedResult = (name: string, searchType: 'event' | 'vendor'): ResearchResult => {
  const cleanName = name.trim();
  const domain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') || "example";
  
  if (searchType === 'vendor') {
    return {
      eventName: cleanName,
      date: "Event App Development, Attendee Tracking, Lead Retrieval",
      location: "Chicago, IL, USA",
      description: `${cleanName} is a premier global event solutions provider specializing in experiential design, interactive trade show booths, and cutting-edge audio-visual integrations. Under the Event Industry ecosystem, they provide robust, high-performance lead retrieval and attendee engagement platforms that empower exhibitors.`,
      website: `https://www.${domain}.com`,
      logoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60",
      contacts: [
        { role: "CEO & Co-Founder", name: "Sarah Jenkins", email: `s.jenkins@${domain}.com`, phone: "+1 (312) 555-0192", social: `https://linkedin.com/in/sarah-jenkins-${domain}` },
        { role: "VP of Sales", name: "Michael Chen", email: `m.chen@${domain}.com`, phone: "+1 (312) 555-0195", social: `https://linkedin.com/in/michael-chen-${domain}` },
        { role: "Event Operations Lead", name: "Jessica Taylor", email: `j.taylor@${domain}.com`, phone: "+1 (312) 555-0199", social: `https://linkedin.com/in/jessica-taylor-${domain}` }
      ],
      searchType: 'vendor',
      isSandbox: true
    };
  } else {
    return {
      eventName: cleanName,
      date: "October 14-17, 2026",
      location: "Las Vegas Convention Center, LV",
      description: `${cleanName} is the year's leading trade show and conference, gathering thousands of industry professionals, tech innovators, and visionary speakers. This landmark event hosts interactive workshops, showcase booths, and high-value networking sessions centering on modern digital transformation.`,
      website: `https://www.${domain}.com`,
      logoUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=128&auto=format&fit=crop&q=60",
      contacts: [
        { role: "Event Director", name: "Christopher Vance", email: `c.vance@${domain}.com`, phone: "+1 (702) 555-0143", social: `https://linkedin.com/in/christopher-vance-${domain}` },
        { role: "Head of Exhibitor Partnerships", name: "Amanda Ross", email: `a.ross@${domain}.com`, phone: "+1 (702) 555-0147", social: `https://linkedin.com/in/amanda-ross-${domain}` },
        { role: "Marketing Coordinator", name: "David Kim", email: `d.kim@${domain}.com`, phone: "+1 (702) 555-0151", social: `https://linkedin.com/in/david-kim-${domain}` }
      ],
      searchType: 'event',
      isSandbox: true
    };
  }
};

const generateLogoScreenshot = (eventName: string, sType: 'event' | 'vendor'): string => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Create realistic browser mock background
    // Deep starry gradient
    const grad = ctx.createLinearGradient(0, 0, 120, 120);
    if (sType === 'vendor') {
      grad.addColorStop(0, '#090d16'); // slate-950/900
      grad.addColorStop(1, '#0e7490'); // cyan-700
    } else {
      grad.addColorStop(0, '#0a0512'); // dark purple
      grad.addColorStop(1, '#4f46e5'); // indigo-600
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 120, 120);

    // Grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 6; x < 120; x += 12) {
      for (let y = 6; y < 120; y += 12) {
        ctx.beginPath();
        ctx.arc(x, y, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Modern mockup browser head
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 120, 16);

    // Mac dots
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(6, 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(12, 8, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(18, 8, 2, 0, Math.PI * 2); ctx.fill();

    // URL address input box mockup
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fillRect(28, 4, 82, 8);

    // Badge glass container
    const isVendor = sType === 'vendor';
    const initText = eventName
      ? eventName.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase()
      : 'E';

    // Center logo badge glass card
    const cardGrad = ctx.createLinearGradient(30, 26, 90, 86);
    cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    cardGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = cardGrad;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    
    // Fallback rounded rect support
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(30, 26, 60, 60, 10);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(30, 26, 60, 60);
      ctx.strokeRect(30, 26, 60, 60);
    }

    // Initials letter and shine
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 6;
    ctx.fillText(initText, 60, 56);

    // Tag text branding bottom
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(isVendor ? 'VENDOR' : 'EVENT', 60, 102);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.warn("Canvas generate logo failed, using placeholder", err);
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60";
  }
};

const parseCSV = (text: string): string[] => {
  const results: string[] = [];
  const lines = text.split(/\r?\n/);
  
  let headers: string[] = [];
  let headerIndex = -1;
  let firstLineIdx = -1;

  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row: string[] = [];
    let insideQuote = false;
    let currentField = '';
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    
    const cleanedRow = row.map(field => {
      if ((field.startsWith('"') && field.endsWith('"')) || (field.startsWith("'") && field.endsWith("'"))) {
        return field.slice(1, -1).trim();
      }
      return field;
    });

    if (firstLineIdx === -1) {
      firstLineIdx = rows.length;
      headers = cleanedRow;
    }
    rows.push(cleanedRow);
  }

  if (rows.length === 0) return [];

  const nameHeaders = ['event name', 'event_name', 'name', 'event', 'title', 'show', 'campaign', 'text'];
  for (let colIdx = 0; colIdx < headers.length; colIdx++) {
    const h = headers[colIdx].toLowerCase().trim();
    if (nameHeaders.some(nh => h === nh || h.includes(nh))) {
      headerIndex = colIdx;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
  }

  for (let rIdx = 1; rIdx < rows.length; rIdx++) {
    const fieldVal = rows[rIdx][headerIndex];
    if (fieldVal && fieldVal.trim()) {
      results.push(fieldVal.trim());
    }
  }

  if (results.length === 0 && rows.length > 0) {
    rows.forEach(r => {
      if (r[0] && r[0].trim()) {
        results.push(r[0].trim());
      }
    });
  }

  return results;
};

interface ResearchModeProps {
  activeProjectId: string | null;
  setActiveProjectId?: (id: string | null) => void;
}

const ResearchMode: React.FC<ResearchModeProps> = ({ activeProjectId, setActiveProjectId }) => {
  const { user } = useFirebase();
  const [queryText, setQueryText] = useState('');
  const [filters, setFilters] = useState({ date: '', location: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(true);
  const [expandedContacts, setExpandedContacts] = useState<Record<number, boolean>>({});
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [researchCue, setResearchCue] = useState<ResearchCueItem[]>([]);
  const [cueExpanded, setCueExpanded] = useState(true);
  const [savedEventsExpanded, setSavedEventsExpanded] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [copiedContactIdx, setCopiedContactIdx] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite');
  const [leftActiveTab, setLeftActiveTab] = useState<'cue' | 'scans' | 'pipeline'>('cue');
  const [scannedList, setScannedList] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'event' | 'vendor'>('event');
  
  const [simulationMode, setSimulationMode] = useState<boolean>(() => localStorage.getItem('research_sim_mode') === 'true');
  const [spendingCapError, setSpendingCapError] = useState<string | null>(null);
  const [showBillingHelp, setShowBillingHelp] = useState(false);
  const [quickFiltersExpanded, setQuickFiltersExpanded] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMultipleModalOpen, setIsMultipleModalOpen] = useState(false);
  const [multipleScanInputs, setMultipleScanInputs] = useState<string[]>(['', '']);
  const [multipleResults, setMultipleResults] = useState<ResearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(0);
  const [currentScanningEvent, setCurrentScanningEvent] = useState<string>('');

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactRole, setNewContactRole] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactSocial, setNewContactSocial] = useState('');

  const [isVerifyingLinkedIn, setIsVerifyingLinkedIn] = useState(false);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);

  const handleLinkedInVerify = async () => {
    if (!result || !result.contacts || result.contacts.length === 0) {
      alert("No contacts available to verify.");
      return;
    }

    setIsVerifyingLinkedIn(true);
    setVerifyStatusMessage("Searching LinkedIn matches & retrieving verified contact details via LinkUp API...");

    try {
      const response = await fetch('/api/linkedin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: result.contacts,
          companyName: result.eventName
        })
      });

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.contacts) {
        const updatedContacts = data.contacts;
        
        let socialCount = 0;
        let emailCount = 0;

        for (let i = 0; i < result.contacts.length; i++) {
          const oldC = result.contacts[i];
          const newC = updatedContacts[i];
          if (!oldC.social && newC.social) socialCount++;
          if (!oldC.email && newC.email) emailCount++;
        }

        const updatedResult = {
          ...result,
          contacts: updatedContacts
        };
        setResult(updatedResult);

        if (multipleResults.length > 0) {
          const updatedMultiple = multipleResults.map((item, idx) => {
            if (idx === currentResultIndex || item.eventName === result.eventName) {
              return { ...item, contacts: updatedContacts };
            }
            return item;
          });
          setMultipleResults(updatedMultiple);
        }

        const evId = (result as any).eventId;
        if (evId && user && activeProjectId) {
          try {
            const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
            await setDoc(eventRef, {
              contacts: updatedContacts
            }, { merge: true });
          } catch (err) {
            console.error("Failed to update contacts on saved event:", err);
          }
        }

        setVerifyStatusMessage(`Verification Complete! Added ${socialCount} LinkedIn handles and ${emailCount} verified emails.`);
        setTimeout(() => setVerifyStatusMessage(null), 6000);
      }
    } catch (err: any) {
      console.error("LinkedIn Verification error:", err);
      setVerifyStatusMessage(`Verification error: ${err.message || 'An error occurred during query'}`);
      setTimeout(() => setVerifyStatusMessage(null), 6000);
    } finally {
      setIsVerifyingLinkedIn(false);
    }
  };

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [expandedActionNotes, setExpandedActionNotes] = useState<Record<string, boolean>>({});
  const [copiedLogo, setCopiedLogo] = useState(false);

  const [editingCell, setEditingCell] = useState<{
    contactIdx: number;
    fieldName: 'role' | 'name' | 'email' | 'phone' | 'social';
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const handleAddContact = async (role: string, name: string, email: string, phone: string, social: string) => {
    if (!result) return;
    const newContact = { 
      role, 
      name, 
      email, 
      phone, 
      social, 
      contactInfo: [email, phone, social].filter(Boolean).join(' | ') 
    };
    const updatedContacts = [...(result.contacts || []), newContact];
    const updatedResult = {
      ...result,
      contacts: updatedContacts
    };
    setResult(updatedResult);

    if (multipleResults.length > 0) {
      const updatedMultiple = multipleResults.map((item, idx) => {
        if (idx === currentResultIndex || item.eventName === result.eventName) {
          return { ...item, contacts: updatedContacts };
        }
        return item;
      });
      setMultipleResults(updatedMultiple);
    }

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, {
          contacts: updatedContacts
        }, { merge: true });
      } catch (err) {
        console.error("Failed to add contact to saved event:", err);
      }
    }
  };

  const submitNewContact = async () => {
    if (!newContactRole.trim() || !newContactName.trim()) {
      alert("Please enter both Title/Role and Contact Name.");
      return;
    }
    await handleAddContact(
      newContactRole.trim(), 
      newContactName.trim(), 
      newContactEmail.trim(), 
      newContactPhone.trim(), 
      newContactSocial.trim()
    );
    setIsAddingContact(false);
    setNewContactRole('');
    setNewContactName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setNewContactSocial('');
  };

  const handleNoteChange = (text: string) => {
    setNoteText(text);
    if (result) {
      result.notes = text;
    }
  };

  const handleSaveNoteHistory = async (text: string) => {
    if (!result || !text.trim()) return;
    
    const newNote: ActionNote = {
      id: Math.random().toString(36).substring(2, 11),
      text: text.trim(),
      createdAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };

    const updatedActionNotes = [newNote, ...(result.actionNotes || [])];
    
    const updatedResult = {
      ...result,
      actionNotes: updatedActionNotes,
      notes: text.trim()
    };
    
    setResult(updatedResult);
    
    if (multipleResults.length > 0) {
      const updatedMultiple = multipleResults.map((item, idx) => {
        if (idx === currentResultIndex || item.eventName === result.eventName) {
          return { ...item, actionNotes: updatedActionNotes, notes: text.trim() };
        }
        return item;
      });
      setMultipleResults(updatedMultiple);
    }

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, {
          actionNotes: updatedActionNotes,
          notes: text.trim()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to save action note history:", err);
      }
    }
    
    setNoteText('');
    setIsAddingNote(false);
  };

  const handleDeleteActionNote = async (noteId: string) => {
    if (!result) return;
    
    const updatedActionNotes = (result.actionNotes || []).filter(note => note.id !== noteId);
    
    const updatedResult = {
      ...result,
      actionNotes: updatedActionNotes
    };
    setResult(updatedResult);

    if (multipleResults.length > 0) {
      const updatedMultiple = multipleResults.map((item, idx) => {
        if (idx === currentResultIndex || item.eventName === result.eventName) {
          return { ...item, actionNotes: updatedActionNotes };
        }
        return item;
      });
      setMultipleResults(updatedMultiple);
    }

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, {
          actionNotes: updatedActionNotes
        }, { merge: true });
      } catch (err) {
        console.error("Failed to delete action note history:", err);
      }
    }
  };

  const handleSaveNote = async () => {
    await handleSaveNoteHistory(noteText);
  };

  const saveInlineCell = async (contactIdx: number, fieldName: 'role' | 'name' | 'email' | 'phone' | 'social') => {
    if (!result) return;
    const updatedContacts = (result.contacts || []).map((c, idx) => {
      if (idx === contactIdx) {
        const updatedContact = {
          ...c,
          [fieldName]: editingValue.trim()
        };
        updatedContact.contactInfo = [
          updatedContact.email,
          updatedContact.phone,
          updatedContact.social
        ].filter(Boolean).join(' | ');
        return updatedContact;
      }
      return c;
    });

    const updatedResult = {
      ...result,
      contacts: updatedContacts
    };
    setResult(updatedResult);

    if (multipleResults.length > 0) {
      const updatedMultiple = multipleResults.map((item, idx) => {
        if (idx === currentResultIndex || item.eventName === result.eventName) {
          return { ...item, contacts: updatedContacts };
        }
        return item;
      });
      setMultipleResults(updatedMultiple);
    }

    setEditingCell(null);

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, {
          contacts: updatedContacts
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update contact in saved event:", err);
      }
    }
  };

  const handleDeleteSavedEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !activeProjectId) return;
    try {
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId);
      await deleteDoc(eventRef);
      if (result && (result as any).eventId === eventId) {
        setResult(null);
        setIsSaved(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting event: " + (err as Error).message);
    }
  };

  const handleCopyText = async (text: string, idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContactIdx(idx);
      setTimeout(() => setCopiedContactIdx(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContact = async (contactIdx: number) => {
    if (!result) return;
    const updatedContacts = (result.contacts || []).filter((_, idx) => idx !== contactIdx);
    const updatedResult = {
      ...result,
      contacts: updatedContacts
    };
    setResult(updatedResult);

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, {
          contacts: updatedContacts
        }, { merge: true });
      } catch (err) {
        console.error("Failed to delete contact from saved event:", err);
      }
    }
  };

  // Fetch saved events for A-Z list
  useEffect(() => {
    if (!user || !activeProjectId) {
      setSavedEvents([]);
      return;
    }
    const q = fsQuery(collection(db, 'users', user.uid, 'projects', activeProjectId, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        eventId: doc.id,
        ...doc.data()
      } as SavedEvent));
      // Sort A-Z by eventName
      list.sort((a, b) => a.eventName.localeCompare(b.eventName));
      setSavedEvents(list);
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  // Fetch research cue list
  useEffect(() => {
    if (!user || !activeProjectId) {
      setResearchCue([]);
      return;
    }
    const q = fsQuery(collection(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        cueId: doc.id,
        ...doc.data()
      } as ResearchCueItem));
      // Sort A-Z by eventName
      list.sort((a, b) => a.eventName.localeCompare(b.eventName));
      setResearchCue(list);
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  // Fetch scan history
  useEffect(() => {
    if (!user || !activeProjectId) {
      setScannedList([]);
      return;
    }
    const q = fsQuery(collection(db, 'users', user.uid, 'projects', activeProjectId, 'scans'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        scanId: doc.id,
        ...doc.data()
      } as any));
      // Sort by createdAt descending (most recent first)
      list.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        return (a.eventName || '').localeCompare(b.eventName || '');
      });
      setScannedList(list);
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  const saveToScans = async (data: ResearchResult) => {
    if (!user || !activeProjectId || !data || !data.eventName) return;
    try {
      const scanId = encodeURIComponent(data.eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100);
      const scanRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'scans', scanId);
      await setDoc(scanRef, {
        eventName: data.eventName,
        date: data.date || '',
        location: data.location || '',
        description: data.description || '',
        contacts: data.contacts || [],
        website: data.website || '',
        logoUrl: data.logoUrl || '',
        notes: data.notes || '',
        actionNotes: data.actionNotes || [],
        searchType: data.searchType || 'event',
        yearFounded: data.yearFounded || '',
        isSandbox: data.isSandbox || false,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to save scan history:", err);
    }
  };

  const handleDeleteScannedEvent = async (scanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !activeProjectId) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'scans', scanId));
    } catch (err) {
      console.error("Failed to delete scanned event:", err);
    }
  };

  useEffect(() => {
    if (!user || !activeProjectId) {
      setProjectName('');
      return;
    }
    const projRef = doc(db, 'users', user.uid, 'projects', activeProjectId);
    const unsubscribe = onSnapshot(projRef, (docSnap) => {
      if (docSnap.exists()) {
        setProjectName(docSnap.data().name || '');
      }
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  // Sync if current result is saved
  useEffect(() => {
    if (!result) {
      setIsSaved(false);
      setNoteText('');
      setIsAddingNote(false);
      return;
    }
    const exists = savedEvents.some(e => e.eventName.toLowerCase() === result.eventName.toLowerCase() || e.eventId === (result as any).eventId);
    setIsSaved(exists);
    const existingNotes = result.notes || (result as any).notes || '';
    setNoteText(existingNotes);
    if (existingNotes) {
      setIsAddingNote(true);
    }
  }, [result, savedEvents]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText) return;

    setLoading(true);
    setResult(null);
    setIsSaved(false);

    if (simulationMode) {
      try {
        // Simulate real response delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 1200));
        const data = getSimulatedResult(queryText, searchType);
        setResult(data);
        await saveToScans(data);
        setSpendingCapError(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: queryText, filters, model: selectedModel, searchType })
      });
      const data = await response.json();
      if (data.error) {
        const errStr = String(data.error + " " + data.details).toLowerCase();
        if (
          data.code === 'SPENDING_CAP_EXCEEDED' || 
          data.code === 'QUOTA_EXCEEDED' || 
          errStr.includes("spending cap") || 
          errStr.includes("spend cap") || 
          errStr.includes("quota") || 
          errStr.includes("resource_exhausted") || 
          errStr.includes("429") || 
          response.status === 429
        ) {
          setSpendingCapError(data.error || "Your Google AI Studio project has exceeded its spending cap or rate limits.");
        }
        throw new Error(data.details || data.error);
      }
      setResult(data);
      await saveToScans(data);
      setSpendingCapError(null);
    } catch (error: any) {
      console.error(error);
      const errStr = String(error.message).toLowerCase();
      if (errStr.includes("spending cap") || errStr.includes("spend cap") || errStr.includes("quota") || errStr.includes("exhausted") || errStr.includes("429")) {
        // Shown nicely via the banner
        if (!spendingCapError) {
          setSpendingCapError(error.message || "Your project has exceeded its monthly spending cap on Google AI Studio.");
        }
      } else {
        alert(error.message || "Research failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCueSearch = async (item: ResearchCueItem) => {
    setQueryText(item.eventName);
    setSearchType(item.searchType || 'event');
    
    setLoading(true);
    setResult(null);
    setIsSaved(false);

    if (simulationMode) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const data = getSimulatedResult(item.eventName, item.searchType || 'event');
        setResult(data);
        await saveToScans(data);
        setSpendingCapError(null);
        if (item.cueId && user && activeProjectId) {
          await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventName: item.eventName, 
          filters, 
          model: selectedModel, 
          searchType: item.searchType || 'event' 
        })
      });

      const data = await response.json();
      if (data.error) {
        const errStr = String(data.error + " " + data.details).toLowerCase();
        if (
          data.code === 'SPENDING_CAP_EXCEEDED' || 
          data.code === 'QUOTA_EXCEEDED' || 
          errStr.includes("spending") || 
          errStr.includes("quota") || 
          errStr.includes("429")
        ) {
          setSpendingCapError(data.error || "Limited quota exceeded on AI Studio.");
        }
        throw new Error(data.details || data.error);
      }
      setResult(data);
      await saveToScans(data);
      setSpendingCapError(null);
      if (item.cueId && user && activeProjectId) {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to research.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCueItem = async (cueId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !activeProjectId) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', cueId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!user || !result) return;

    let targetProjectId = activeProjectId;

    if (isSaved) {
      if (!targetProjectId) return;
      const savedEv = savedEvents.find(e => e.eventName.toLowerCase() === result.eventName.toLowerCase() || e.eventId === (result as any).eventId);
      if (savedEv && savedEv.eventId) {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'projects', targetProjectId, 'events', savedEv.eventId));
          setIsSaved(false);
        } catch (e) {
          console.error("Failed to unsave event from pipeline:", e);
          alert("Failed to unsave event from pipeline");
        }
      }
      return;
    }

    if (!targetProjectId) {
      const name = prompt("Select or Create a Project to save your events.\nTo + Create a New Project, enter the name here:");
      if (!name || !name.trim()) return;
      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
          userId: user.uid,
          name: name.trim(),
          createdAt: serverTimestamp()
        });
        targetProjectId = docRef.id;
        if (setActiveProjectId) {
          setActiveProjectId(targetProjectId);
        }
      } catch (e) {
        console.error("Failed to create project:", e);
        alert("Failed to create project");
        return;
      }
    }

    if (!targetProjectId) return;

    try {
      const eventId = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'users', user.uid, 'projects', targetProjectId, 'events', eventId), {
        ...result,
        eventId: eventId,
        projectId: targetProjectId,
        userId: user.uid,
        notes: noteText || result.notes || '',
        status: 'Initial',
        createdAt: serverTimestamp()
      });
      setIsSaved(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save event");
    }
  };

  const downloadCSV = () => {
    if (!result) return;
    const escapeCSV = (val: string) => {
      if (!val) return '""';
      return `"${val.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    const headers = [
      "Salesperson",
      "App Project Name",
      "Exported Timestamp",
      "Event/Vendor Name",
      "Website",
      "Details (Description)",
      "Location",
      "Date",
      "Product/Services"
    ];

    const maxContacts = Math.max(3, result.contacts?.length || 0);
    const maxActions = Math.max(3, (result.actionNotes || []).length);

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

    const detailsText = result.description || '';
    const isVendor = result.searchType === 'vendor';
    const rowValues = [
      escapeCSV(`${user?.displayName || "Anonymous"} <${user?.email || "No Email"}>`),
      escapeCSV(projectName || "Active Project"),
      escapeCSV(new Date().toUTCString()),
      escapeCSV(result.eventName),
      escapeCSV(result.website || ''),
      escapeCSV(detailsText),
      escapeCSV(result.location),
      escapeCSV(isVendor ? '' : result.date),
      escapeCSV(isVendor ? result.date : '')
    ];

    for (let i = 0; i < maxContacts; i++) {
      const c = result.contacts && result.contacts[i] ? result.contacts[i] : null;
      rowValues.push(
        escapeCSV(c?.name || ""),
        escapeCSV(c?.role || ""),
        escapeCSV(c?.email || ""),
        escapeCSV(c?.phone || ""),
        escapeCSV(c?.social || "")
      );
    }

    for (let j = 0; j < maxActions; j++) {
      const n = result.actionNotes && result.actionNotes[j] ? result.actionNotes[j] : null;
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
    link.setAttribute("href", url);
    link.setAttribute("download", `${result.eventName.replace(/\s+/g, '_')}_research.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadCueCSV = () => {
    if (researchCue.length === 0) {
      alert("No events/vendors in your research cue to export.");
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
      "Name",
      "Website",
      "Target Type",
      "Focus / Services Offered"
    ];

    const rows = researchCue.map(item => [
      escapeCSV(`${user?.displayName || "Anonymous"} <${user?.email || "No Email"}>`),
      escapeCSV(projectName || "Active Project"),
      escapeCSV(new Date().toUTCString()),
      escapeCSV(item.eventName),
      escapeCSV(item.website || ''),
      escapeCSV(item.searchType || 'event'),
      escapeCSV(item.servicesOffered || '')
    ].join(","));

    const csvContent = [
      headers.join(","),
      ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Research_Cue_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadProjectCSV = () => {
    if (savedEvents.length === 0) {
      alert("No saved events in this project to export.");
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
      "Details (Description)",
      "Location",
      "Date",
      "Product/Services",
      "Status",
      "Contact Method",
      "Pipeline Notes"
    ];

    const maxContacts = Math.max(3, ...savedEvents.map(e => e.contacts?.length || 0));
    const maxActions = Math.max(3, ...savedEvents.map(e => (e.actionNotes || []).length || 0));

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

    savedEvents.forEach(event => {
      const detailsText = event.description || '';
      const pipelineNotes = event.notes || '';
      const isVendor = event.searchType === 'vendor';

      const rowValues = [
        escapeCSV(`${user?.displayName || "Anonymous"} <${user?.email || "No Email"}>`),
        escapeCSV(projectName || "Active Project"),
        escapeCSV(new Date().toUTCString()),
        escapeCSV(event.eventName),
        escapeCSV(detailsText),
        escapeCSV(event.location),
        escapeCSV(isVendor ? '' : event.date),
        escapeCSV(isVendor ? event.date : ''),
        escapeCSV(event.status),
        escapeCSV(event.contactMethod || ''),
        escapeCSV(pipelineNotes)
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
    link.setAttribute("href", url);
    link.setAttribute("download", `Project_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform: 'email' | 'social') => {
    if (!result) return;
    if (platform === 'email') {
      // 1. Export CSV
      downloadCSV();

      // 2. Generate detailed ASCII table with updated columns
      const contactsList = result.contacts && result.contacts.length > 0 
        ? result.contacts 
        : [{ role: 'N/A', name: 'N/A', email: 'N/A', phone: 'N/A', social: 'N/A', contactInfo: 'N/A' }];
      
      let tableHeader  = "| ROLE             | CONTACT NAME          | EMAIL                        | PHONE          | SOCIAL HANDLE        |\n";
      let tableDivider = "|------------------|-----------------------|------------------------------|----------------|----------------------|\n";
      let tableRows = "";
      contactsList.forEach(c => {
        const role = (c.role || 'N/A').padEnd(16).substring(0, 16);
        const name = (c.name || 'N/A').padEnd(21).substring(0, 21);
        const email = (c.email || c.contactInfo || 'N/A').padEnd(28).substring(0, 28);
        const phone = (c.phone || 'N/A').padEnd(14).substring(0, 14);
        const social = (c.social || 'N/A').padEnd(20).substring(0, 20);
        tableRows += `| ${role} | ${name} | ${email} | ${phone} | ${social} |\n`;
      });

      const tableContent = tableHeader + tableDivider + tableRows;

      const bodyContent = `Hi,

Here is the digital footprint and contact sheet for the scanned event:

EVENT DETAILS
==================================================
Event Name:  ${result.eventName}
Website:     ${result.website || 'N/A'}
Date:        ${result.date}
Location:    ${result.location}
Description: ${result.description || 'Verified trade show or conference'}

VERIFIED CONTACTS TABLE
==================================================
${tableContent}

*Note: The detailed CSV file has also been exported and saved to your device.*

Best regards,
Pro Event Research Team`;

      window.location.href = `mailto:?subject=${encodeURIComponent(`Event Scan Report: ${result.eventName}`)}&body=${encodeURIComponent(bodyContent)}`;
    } else {
      const text = `Check out this event: ${result.eventName} in ${result.location} on ${result.date}`;
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    }
  };

  const handleAddInputField = () => {
    setMultipleScanInputs([...multipleScanInputs, '']);
  };

  const handleRemoveInputField = (index: number) => {
    if (multipleScanInputs.length <= 1) return;
    setMultipleScanInputs(multipleScanInputs.filter((_, idx) => idx !== index));
  };

  const handleInputChange = (index: number, val: string) => {
    const nextInputs = [...multipleScanInputs];
    nextInputs[index] = val;
    setMultipleScanInputs(nextInputs);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const parsedNames = parseCSV(text);
      if (parsedNames.length === 0) {
        alert("No event names could be resolved from the CSV. Please ensure you have a column with a header like 'Event Name', 'Event', 'Name', or similar.");
        return;
      }

      const currentFilled = multipleScanInputs.filter(item => item.trim() !== '');
      let newInputs: string[];
      if (currentFilled.length === 0) {
        newInputs = parsedNames;
      } else {
        newInputs = [...currentFilled, ...parsedNames];
      }

      if (newInputs.length < 2) {
        while (newInputs.length < 2) {
          newInputs.push('');
        }
      }

      setMultipleScanInputs(newInputs);
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleMultipleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventNames = multipleScanInputs.map(name => name.trim()).filter(Boolean);
    if (eventNames.length === 0) {
      alert("Please enter at least one event name.");
      return;
    }

    setLoading(true);
    setResult(null);
    setMultipleResults([]);
    setCurrentResultIndex(0);
    setIsSaved(false);
    setIsMultipleModalOpen(false);

    const fetchedResults: ResearchResult[] = [];

    for (let i = 0; i < eventNames.length; i++) {
      const name = eventNames[i];
      setCurrentScanningEvent(name);

      if (simulationMode) {
        try {
          await new Promise(resolve => setTimeout(resolve, 600));
          const data = getSimulatedResult(name, searchType);
          fetchedResults.push(data);
          await saveToScans(data);
          setSpendingCapError(null);
        } catch (err) {
          console.error(err);
        }
        continue;
      }

      try {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName: name, filters, model: selectedModel, searchType })
        });
        const data = await response.json();
        if (data && !data.error) {
          fetchedResults.push(data);
          await saveToScans(data);
        } else {
          console.error(`Error researching "${name}":`, data?.details || data?.error);
          const errStr = String(data?.error + " " + data?.details).toLowerCase();
          if (
            data?.code === 'SPENDING_CAP_EXCEEDED' || 
            data?.code === 'QUOTA_EXCEEDED' || 
            errStr.includes("spending cap") || 
            errStr.includes("spend cap") || 
            errStr.includes("quota") || 
            errStr.includes("429") || 
            errStr.includes("resource_exhausted") || 
            response.status === 429
          ) {
            setSpendingCapError(data.error || "Many requests failed due to a billing cap on AI Studio.");
          }
        }
      } catch (err) {
        console.error(`Failed to research "${name}":`, err);
      }
    }

    setLoading(false);
    setCurrentScanningEvent('');

    if (fetchedResults.length > 0) {
      setMultipleResults(fetchedResults);
      setCurrentResultIndex(0);
      setResult(fetchedResults[0]);
      setQueryText(fetchedResults[0].eventName);
    } else {
      alert("All cued event scans failed. If your API key triggered a spending limit error on Google AI Studio, please turn on Simulation Mode to try out the app's rich pipeline features.");
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full gap-6">
      {/* Sidebar Filters & Saved Events */}
      <aside className="w-72 flex flex-col p-5 glass border-r shrink-0 rounded-2xl h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto custom-scrollbar pr-1 select-text">
          {/* List Editor Subtitle */}
          <div className="flex items-center gap-2 px-1 shrink-0">
            <Edit3 className="h-4 w-4 text-primary" />
            <h4 className="text-xs font-bold text-white uppercase tracking-widest">List Editor</h4>
          </div>

          {/* Navigation Tabs */}
          <div className="shrink-0 flex border-b border-white/5 p-1 bg-zinc-950/20 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setLeftActiveTab('cue')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none",
                leftActiveTab === 'cue'
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              Cue ({researchCue.length})
            </button>
            <button
              type="button"
              onClick={() => setLeftActiveTab('scans')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none",
                leftActiveTab === 'scans'
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              Scans ({scannedList.length})
            </button>
            <button
              type="button"
              onClick={() => setLeftActiveTab('pipeline')}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none",
                leftActiveTab === 'pipeline'
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              )}
            >
              Pipeline ({savedEvents.length})
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {leftActiveTab === 'cue' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 mt-1">
                {researchCue.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center p-4 text-center select-none h-32">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No items cued</span>
                  </div>
                ) : (
                  researchCue.map((ev) => {
                    const isSelected = queryText.toLowerCase() === ev.eventName.toLowerCase();
                    return (
                      <div key={ev.cueId} className="relative group select-text">
                        <button
                          type="button"
                          onClick={() => {
                            setQueryText(ev.eventName);
                            setSearchType(ev.searchType || 'event');
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 pr-12 rounded-lg text-[11px] transition-all flex flex-col gap-0.5 border cursor-pointer select-text",
                            isSelected 
                              ? "bg-primary/15 border-primary/40 text-white font-medium" 
                              : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                          )}
                        >
                          <span className="truncate w-full block font-semibold select-text">{ev.eventName}</span>
                        </button>
                        
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                          <button
                            type="button"
                            onClick={() => handleTriggerCueSearch(ev)}
                            className="p-1.5 bg-primary/10 hover:bg-primary/25 text-primary rounded border border-primary/20 cursor-pointer"
                            title="Run deep research"
                          >
                            <Search className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCueItem(ev.cueId, e)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-500 rounded border border-red-500/20 cursor-pointer"
                            title="Remove from cue"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {leftActiveTab === 'scans' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 mt-1">
                {scannedList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center p-4 text-center select-none h-32">
                    <Search className="h-5 w-5 text-slate-700 mb-1.5" />
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No scans finished yet</span>
                  </div>
                ) : (
                  scannedList.map((ev) => {
                    const isSelected = result && (result.eventName.toLowerCase() === ev.eventName.toLowerCase());
                    const isInPipeline = savedEvents.some(s => s.eventName.toLowerCase() === ev.eventName.toLowerCase());
                    return (
                      <div key={ev.scanId} className="relative group select-text">
                        <button
                          type="button"
                          onClick={() => {
                            setResult(ev);
                            setQueryText(ev.eventName);
                            setSearchType(ev.searchType || 'event');
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 pr-8 rounded-lg text-xs transition-all flex flex-col gap-0.5 border cursor-pointer select-text",
                            isSelected 
                              ? "bg-primary/10 border-primary/30 text-white font-medium" 
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5 w-full">
                            <span className={cn(
                              "truncate font-semibold select-text",
                              isInPipeline ? "text-slate-500 font-normal" : "text-white"
                            )}>
                              {ev.eventName}
                            </span>
                            {isInPipeline && (
                              <span className="text-[8.5px] text-slate-500 shrink-0 font-medium italic">
                                in pipeline
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 truncate w-full block select-text">
                            {ev.searchType === 'vendor' ? `HQ: ${ev.location} • ${ev.date}` : `${ev.location} • ${ev.date}`}
                          </span>
                          {ev.isSandbox && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[8px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded self-start select-none">
                              ⚠️ Sandbox Test
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handleDeleteScannedEvent(ev.scanId, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                          title="Delete scan"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {leftActiveTab === 'pipeline' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 mt-1">
                {savedEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center p-4 text-center select-none h-32">
                    <Bookmark className="h-5 w-5 text-slate-700 mb-1.5" />
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No events saved to pipeline</span>
                  </div>
                ) : (
                  savedEvents.map((ev) => {
                    const isSelected = result && (result.eventName === ev.eventName || (result as any).eventId === ev.eventId);
                    return (
                      <div key={ev.eventId} className="relative group select-text">
                        <button
                          type="button"
                          onClick={() => {
                            setResult(ev);
                            setQueryText(ev.eventName);
                            setSearchType(ev.searchType || 'event');
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 pr-8 rounded-lg text-xs transition-all flex flex-col gap-0.5 border cursor-pointer select-text",
                            isSelected 
                              ? "bg-primary/10 border-primary/30 text-white font-medium" 
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                          )}
                        >
                          <span className="truncate w-full block font-semibold text-white select-text">{ev.eventName}</span>
                          <span className="text-[9px] text-slate-500 truncate w-full block select-text">
                            {ev.searchType === 'vendor' ? `HQ: ${ev.location} • ${ev.date}` : `${ev.location} • ${ev.date}`}
                          </span>
                          {ev.isSandbox && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[8px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded self-start select-none">
                              ⚠️ Sandbox Test
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => handleDeleteSavedEvent(ev.eventId, e)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                          title="Remove from pipeline"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Collapsible Quick Filters Section */}
          <div className="shrink-0 border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={() => setQuickFiltersExpanded(!quickFiltersExpanded)}
              className="flex items-center justify-between w-full text-left focus:outline-none cursor-pointer group"
              title="Click to toggle Quick Filters collapse"
            >
              <label className="text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-slate-300 font-bold cursor-pointer select-none transition-colors">
                Quick Filters
              </label>
              <ChevronDown 
                className={cn(
                  "h-3.5 w-3.5 text-slate-500 group-hover:text-slate-350 transition-transform cursor-pointer",
                  quickFiltersExpanded ? "rotate-0 text-primary" : "-rotate-90"
                )} 
              />
            </button>
            {quickFiltersExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-3 overflow-hidden"
              >
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Location</p>
                  <div className="relative">
                    <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. Europe"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded px-8 py-1.5 text-xs outline-none focus:border-primary/50 text-white"
                      value={filters.location}
                      onChange={e => setFilters({...filters, location: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Event Date</p>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="e.g. Nov 2024"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded px-8 py-1.5 text-xs outline-none focus:border-primary/50 text-white"
                      value={filters.date}
                      onChange={e => setFilters({...filters, date: e.target.value})}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="shrink-0 pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-mono tracking-wider">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-3 w-3 animate-pulse" />
                AI Intelligence
              </div>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase",
                simulationMode ? "bg-amber-500/15 text-amber-400 border border-amber-500/10" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/10"
              )}>
                {simulationMode ? "Simulated" : "Live API"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextMode = !simulationMode;
                setSimulationMode(nextMode);
                if (nextMode) {
                  localStorage.setItem('research_sim_mode', 'true');
                } else {
                  localStorage.removeItem('research_sim_mode');
                }
              }}
              className="w-full text-center py-1.5 bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-[9.5px] text-slate-400 hover:text-slate-250 transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              {simulationMode ? "⚡ Live Gemini API" : "🎨 Sandbox Mode"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col space-y-6 overflow-hidden">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex space-x-3 shrink-0">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder={searchType === 'event' ? "Search trade shows, conferences, or keywords..." : "Search event vendor, supplier, or company names..."}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full h-12 bg-zinc-900/50 glass border-white/10 rounded-xl px-12 pr-[125px] text-sm text-white focus:ring-1 focus:ring-primary outline-none placeholder:text-slate-600"
            />
            <Search className="h-5 w-5 absolute left-4 top-3.5 text-slate-500" />
            
            {/* Always visible stacked vertical buttons */}
            <div className="absolute right-2 top-1.5 bottom-1.5 flex flex-col justify-between gap-1">
              <button
                type="button"
                onClick={() => setSearchType('event')}
                className={cn(
                  "h-[18px] px-2 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center min-w-[96px]",
                  searchType === 'event'
                    ? "bg-slate-200 text-slate-900 border-white/80 active:scale-95 shadow-sm"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-700/80 hover:text-zinc-300 active:scale-95"
                )}
              >
                Search Event
              </button>
              <button
                type="button"
                onClick={() => setSearchType('vendor')}
                className={cn(
                  "h-[18px] px-2 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center min-w-[96px]",
                  searchType === 'vendor'
                    ? "bg-slate-200 text-slate-900 border-white/80 active:scale-95 shadow-sm"
                    : "bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border-zinc-700/80 hover:text-zinc-300 active:scale-95"
                )}
              >
                Search Vendor
              </button>
            </div>
          </div>

          {/* AI Model Selection Dropdown */}
          <div className="relative flex shrink-0">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading}
              className="h-12 bg-[#0c0d12]/90 border border-white/10 rounded-xl px-4 pr-10 text-xs text-primary font-bold focus:ring-1 focus:ring-primary outline-none cursor-pointer appearance-none transition-colors hover:border-white/20"
            >
              <option value="gemini-3.5-flash" className="bg-[#030712] text-slate-300 font-bold">
                ⚡ Gemini 3.5 Flash
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-[#030712] text-slate-300">
                🌱 Gemini 3.1 Lite (Affordable)
              </option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="relative flex shrink-0">
            <button 
              type="submit"
              disabled={loading}
              className="px-6 h-12 bg-primary hover:bg-secondary text-slate-900 rounded-l-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 border-r border-slate-900/10 cursor-pointer"
            >
              {loading ? "Scanning..." : "Run Scan"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-3 h-12 bg-primary hover:bg-secondary text-slate-900 rounded-r-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              title="More scan methods"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      if (queryText) {
                        const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                        handleSearch(fakeEvent);
                      } else {
                        alert("Please enter an event name in the search field first.");
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Search className="h-4 w-4 text-primary" />
                    Single Event Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsMultipleModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer font-bold border-t border-white/5 pt-2 mt-1"
                  >
                    <Layers className="h-4 w-4 text-primary" />
                    Multiple Events Scan...
                  </button>
                </div>
              </>
            )}
          </div>
          
          {result && (
            <button 
              type="button"
              onClick={() => handleShare('email')}
              className="px-4 h-12 glass border-white/10 rounded-xl flex items-center text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Share report via Email (Export & Table)"
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}
        </form>

        {/* Simulation Sandbox Status Indicator */}
        {simulationMode && !spendingCapError && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-amber-200">Sandbox Simulation Active</h4>
                <p className="text-[10px] text-slate-400 truncate">Saves system resources. Generates high-quality simulated trade show & vendor entries instantly without API credit cost.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimulationMode(false);
                localStorage.removeItem('research_sim_mode');
              }}
              className="bg-[#0c0d12] hover:bg-zinc-900 border border-amber-500/20 text-slate-300 hover:text-white px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all active:scale-[0.95] cursor-pointer shrink-0"
            >
              Disable Sandbox
            </button>
          </div>
        )}

        {/* Spending Cap & Quota interactive Alert Box */}
        {spendingCapError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row gap-5 items-start">
            <div className="absolute top-0 right-0 p-3">
              <button 
                type="button" 
                onClick={() => setSpendingCapError(null)} 
                className="text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-red-500/15 p-3 rounded-xl shrink-0">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Google AI Studio Key - Spending Cap Exceeded
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                The Gemini API calls returned a <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-red-300">429 RESOURCE_EXHAUSTED</code> error. 
                Your attached AI Studio API key has exceeded its monthly spending ceiling. This is managed entirely under your billing account settings.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <a 
                  href="https://ai.studio/spend" 
                  target="_blank" 
                  referrerPolicy="no-referrer"
                  className="bg-slate-200 hover:bg-white text-slate-900 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Manage Spend Cap in AI Studio
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSimulationMode(true);
                    localStorage.setItem('research_sim_mode', 'true');
                    setSpendingCapError(null);
                  }}
                  className="bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 text-amber-200 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 animate-pulse"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Enable Sandbox Simulation Mode
                </button>
                <button
                  type="button"
                  onClick={() => setShowBillingHelp(!showBillingHelp)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {showBillingHelp ? "Hide troubleshooting guide" : "Show troubleshooting guide"}
                </button>
              </div>

              {showBillingHelp && (
                <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-white/5 space-y-3 text-slate-300 select-text font-sans">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">How to resolve Google AI Studio Spend Cap errors:</h4>
                  <ol className="list-decimal list-inside text-[11px] space-y-2 leading-relaxed">
                    <li>
                      Visit your <a href="https://ai.studio/spend" target="_blank" referrerPolicy="no-referrer" className="text-primary hover:underline font-semibold">AI Studio Spend Console</a>, verify which Google Project is active, and raise the monthly spending cap threshold.
                    </li>
                    <li>
                      If using a Free Tier prompt billing plan, note that Google places daily/monthly query and model constraints that cannot be raised without enabling pay-as-you-go billing.
                    </li>
                    <li>
                      Alternatively, generate or obtain a new API key from another billing project, then paste it inside the builder's <strong className="text-white">Settings &gt; Secrets</strong> panel under the variable name <code className="font-mono bg-white/5 px-1 py-0.5 rounded text-primary">GEMINI_API_KEY</code>.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
             <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center space-y-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="p-4 bg-primary/10 rounded-full"
                >
                  <Search className="h-10 w-10 text-primary" />
                </motion.div>
                <div className="text-center">
                  <h4 className="text-sm font-bold tracking-widest text-primary uppercase">Analyzing Digital Footprint</h4>
                  {currentScanningEvent && (
                    <p className="text-xs text-slate-300 mt-2">
                      Researching cued item: <span className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 inline-block font-bold">{currentScanningEvent}</span>
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">Cross-referencing verified databases & directories...</p>
                  <p className="text-[9px] text-slate-550 mt-1.5 max-w-lg mx-auto leading-relaxed">
                    EventMarketer, ConferenceMonkey, 10Times, ConferenceIndex, IndustryEvents, AllConferenceAlert, FeaturedCustomers, Blooloop, LinkedIn & Google Search
                  </p>
                </div>
             </div>
        ) : result ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 glass rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Table Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-white/10 rounded text-[11px] font-semibold text-white">Event Database</div>
                <h3 className="text-sm font-bold text-primary truncate max-w-[200px]">{result.eventName}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  disabled={isSaved}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer",
                    isSaved ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                  )}
                >
                  <Heart className={cn("h-3 w-3", isSaved && "fill-current")} />
                  <span>{isSaved ? "SAVED" : "SAVE TO PIPELINE"}</span>
                </button>
                <button 
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>EXPORT CSV</span>
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Event Details Section (Fully Expanded & Styled) */}
              <div className="p-5 bg-zinc-950/40 rounded-xl border border-white/10 flex flex-col gap-5 items-start relative overflow-hidden">
                {result.isSandbox && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/35 text-amber-250 rounded-lg p-2.5 text-[11px] font-medium flex items-center gap-2 mb-1">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span><strong>Test Record:</strong> Generated in Sandbox Mode. Please delete this test record after testing.</span>
                  </div>
                )}

                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <h4 className="text-base font-extrabold text-white tracking-tight">{result.eventName}</h4>
                    {result.website && (
                      <a 
                        href={result.website.startsWith('http') ? result.website : `https://${result.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] font-mono tracking-tight transition-all"
                      >
                        <Globe className="h-3 w-3" />
                        {result.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                  </div>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1 text-slate-300">
                      {result.searchType === 'vendor' ? (
                        <>
                          <Briefcase className="h-3.5 w-3.5 text-primary/75 shrink-0" />
                          <span className="text-slate-400">Services:</span> {result.date}
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 text-primary/75 shrink-0" />
                          {result.location}
                        </>
                      )}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                    <span className="flex items-center gap-1 text-slate-300">
                      {result.searchType === 'vendor' ? (
                        <>
                          <MapPin className="h-3 w-3 text-primary/75 shrink-0" />
                          <span className="text-slate-400">HQ:</span> {result.location}
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3 w-3 text-primary/75 shrink-0" />
                          {result.date}
                        </>
                      )}
                    </span>
                    {result.yearFounded && result.yearFounded !== 'n/a' && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0" />
                        <span className="flex items-center gap-1 text-slate-300">
                          <span className="text-slate-400">Year Founded:</span> {result.yearFounded}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Thin horizontal divider line between the Services/HQ details and description */}
                  <div className="my-3.5 border-t border-white/10 w-full" />

                  <p className="text-xs text-slate-300 leading-relaxed max-w-4xl whitespace-pre-wrap select-text">
                    {result.description || "Digital intelligence scanned and cross-referenced from Google and social indexes."}
                  </p>
                </div>
              </div>

              {/* Verified Contact Sheet Header */}
              <div className="border-t border-white/5 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Contacts</h4>
                    </div>
                    
                    <button
                      onClick={handleLinkedInVerify}
                      disabled={isVerifyingLinkedIn || !result || !result.contacts || result.contacts.length === 0}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 border border-primary/20 ${
                        isVerifyingLinkedIn 
                          ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-white/10'
                          : 'bg-primary/10 hover:bg-primary/25 hover:border-primary/40 text-primary active:scale-[0.98]'
                      }`}
                    >
                      <Zap className={`h-3 w-3 shrink-0 ${isVerifyingLinkedIn ? 'animate-bounce text-slate-400' : 'text-primary animate-pulse'}`} />
                      {isVerifyingLinkedIn ? 'Enriching Data...' : 'LinkedIn Verify/Add Contacts'}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono italic">Verification may take 1-3 minutes, but often identifies more contact emails. Uses AI Credits.</span>
                  </div>
                </div>

                {verifyStatusMessage && (
                  <div className="mb-3.5 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between text-xs text-slate-200 transition-all duration-300">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        {isVerifyingLinkedIn ? (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        ) : null}
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary animate-pulse"></span>
                      </span>
                      <span className="font-medium">{verifyStatusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Contacts Sheet structured columns */}
                <div className="border border-white/5 rounded-xl overflow-hidden bg-[#0c0d12]">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
                        <th className="p-3 pl-4 w-[18%]">Role / Title</th>
                        <th className="p-3 w-[20%]">Contact Name</th>
                        <th className="p-3 w-[24%]">Email</th>
                        <th className="p-3 w-[18%]">Phone</th>
                        <th className="p-3 w-[12%]">Social Handle</th>
                        <th className="p-3 pr-4 w-[8%] text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] divide-y divide-white/5">
                      {(result.contacts || []).map((contact, idx) => {
                        const isEditingRole = editingCell?.contactIdx === idx && editingCell?.fieldName === 'role';
                        const isEditingName = editingCell?.contactIdx === idx && editingCell?.fieldName === 'name';
                        const isEditingEmail = editingCell?.contactIdx === idx && editingCell?.fieldName === 'email';
                        const isEditingPhone = editingCell?.contactIdx === idx && editingCell?.fieldName === 'phone';
                        const isEditingSocial = editingCell?.contactIdx === idx && editingCell?.fieldName === 'social';

                        return (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                            
                            {/* ROLE / TITLE */}
                            <td 
                              className="p-3 pl-4 font-semibold text-slate-300 border-l border-white/5 relative"
                              onDoubleClick={() => {
                                setEditingCell({ contactIdx: idx, fieldName: 'role' });
                                setEditingValue(contact.role || '');
                              }}
                            >
                              {isEditingRole ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => saveInlineCell(idx, 'role')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineCell(idx, 'role');
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full bg-zinc-900 border border-primary/50 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate cursor-text text-slate-300 select-text" title="Double click to edit">
                                  {contact.role || <span className="text-slate-600 italic">No Title</span>}
                                </div>
                              )}
                            </td>

                            {/* NAME */}
                            <td 
                              className="p-3 text-white font-medium"
                              onDoubleClick={() => {
                                setEditingCell({ contactIdx: idx, fieldName: 'name' });
                                setEditingValue(contact.name || '');
                              }}
                            >
                              {isEditingName ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => saveInlineCell(idx, 'name')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineCell(idx, 'name');
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full bg-zinc-900 border border-primary/50 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate cursor-text flex items-center justify-between select-text" title="Double click to edit">
                                  <span>{contact.name || <span className="text-slate-600 italic">No Name</span>}</span>
                                  {contact.name && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyText(contact.name, idx * 10, e)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 text-slate-500 hover:text-white rounded transition-all cursor-pointer"
                                      title="Copy name"
                                    >
                                      {copiedContactIdx === idx * 10 ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* EMAIL */}
                            <td 
                              className="p-3 text-slate-300 font-mono"
                              onDoubleClick={() => {
                                setEditingCell({ contactIdx: idx, fieldName: 'email' });
                                setEditingValue(contact.email || '');
                              }}
                            >
                              {isEditingEmail ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => saveInlineCell(idx, 'email')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineCell(idx, 'email');
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full bg-zinc-900 border border-primary/50 rounded px-1.5 py-1 text-[11px] font-mono text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate cursor-text flex items-center justify-between select-text" title="Double click to edit">
                                  <span>{contact.email || <span className="text-slate-700 font-sans italic">-</span>}</span>
                                  {contact.email && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyText(contact.email!, idx * 10 + 1, e)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 text-slate-500 hover:text-white rounded transition-all cursor-pointer"
                                      title="Copy email"
                                    >
                                      {copiedContactIdx === idx * 10 + 1 ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* PHONE */}
                            <td 
                              className="p-3 text-slate-300 font-mono"
                              onDoubleClick={() => {
                                setEditingCell({ contactIdx: idx, fieldName: 'phone' });
                                setEditingValue(contact.phone || '');
                              }}
                            >
                              {isEditingPhone ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => saveInlineCell(idx, 'phone')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineCell(idx, 'phone');
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full bg-zinc-900 border border-primary/50 rounded px-1.5 py-1 text-[11px] font-mono text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate cursor-text flex items-center justify-between select-text" title="Double click to edit">
                                  <span>{contact.phone || <span className="text-slate-700 font-sans italic">-</span>}</span>
                                  {contact.phone && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleCopyText(contact.phone!, idx * 10 + 2, e)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 text-slate-500 hover:text-white rounded transition-all cursor-pointer"
                                      title="Copy phone"
                                    >
                                      {copiedContactIdx === idx * 10 + 2 ? (
                                        <Check className="h-3 w-3 text-green-400" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* SOCIAL */}
                            <td 
                              className="p-3 text-primary font-mono text-xs"
                              onDoubleClick={() => {
                                setEditingCell({ contactIdx: idx, fieldName: 'social' });
                                setEditingValue(contact.social || '');
                              }}
                            >
                              {isEditingSocial ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={() => saveInlineCell(idx, 'social')}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineCell(idx, 'social');
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  className="w-full bg-zinc-900 border border-primary/50 rounded px-1.5 py-1 text-[11px] font-mono text-white focus:outline-none"
                                />
                              ) : (
                                <div className="truncate cursor-text" title="Double click to edit">
                                  {contact.social ? (
                                    <a 
                                      href={contact.social.startsWith('http') ? contact.social : `https://${contact.social}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-center gap-1 inline-flex text-primary font-sans font-medium text-[11px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Linkedin className="h-2.5 w-2.5 shrink-0" />
                                      {contact.social.includes('linkedin.com/in/') 
                                        ? contact.social.split('linkedin.com/in/')[1]?.replace(/\/$/, '') || 'LinkedIn'
                                        : 'Profile'}
                                    </a>
                                  ) : (
                                    <span className="text-slate-700 font-sans italic">-</span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* ACTIONS */}
                            <td className="p-3 pr-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteContact(idx)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer"
                                title="Delete contact"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </td>

                          </tr>
                        );
                      })}

                      {/* Add Custom Contact Form Row */}
                      {isAddingContact && (
                        <tr className="bg-white/[0.03] border-t-2 border-primary/50">
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Title / Role (e.g. CEO)"
                              value={newContactRole}
                              onChange={(e) => setNewContactRole(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50 font-medium"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Contact Name"
                              value={newContactName}
                              onChange={(e) => setNewContactName(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-primary/50 font-medium"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Email Address"
                              value={newContactEmail}
                              onChange={(e) => setNewContactEmail(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-primary/50"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="Phone Number"
                              value={newContactPhone}
                              onChange={(e) => setNewContactPhone(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-primary/50"
                            />
                          </td>
                          <td className="p-2.5" colSpan={2}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Social profile URL"
                                value={newContactSocial}
                                onChange={(e) => setNewContactSocial(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-white/10 rounded px-2 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-primary/50"
                              />
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={submitNewContact}
                                  className="px-2.5 py-1 bg-primary hover:bg-secondary text-slate-900 rounded font-bold text-xs transition-all cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsAddingContact(false);
                                    setNewContactRole('');
                                    setNewContactName('');
                                    setNewContactEmail('');
                                    setNewContactPhone('');
                                    setNewContactSocial('');
                                  }}
                                  className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Double click instruction moved under the contacts box */}
                <div className="mt-1.5 text-right">
                  <span className="text-[9.5px] text-slate-550 font-mono">Double-click any cell to edit the text inline</span>
                </div>
              </div>

              {/* Collapsible Action Notes History list section */}
              <div className="border-t border-white/5 pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">My Notes</h4>
                  <span className="bg-white/5 text-slate-400 text-[9px] px-1.5 py-0.2 rounded-full font-mono border border-white/5 shrink-0">
                    {(result.actionNotes || []).length}
                  </span>
                </div>

                {(result.actionNotes || []).length === 0 ? (
                  <div className="p-4 bg-[#0c0d12]/30 border border-white/5 rounded-xl text-center text-slate-500 italic text-xs">
                    No action notes logged yet. Use "Add Note" below to save timestamped notes.
                  </div>
                ) : (
                  <div className="space-y-2 select-text">
                    {(result.actionNotes || []).map((note) => {
                      const isNoteExpanded = !!expandedActionNotes[note.id];
                      return (
                        <div 
                          key={note.id} 
                          className={cn(
                            "p-3 rounded-xl border transition-all cursor-pointer select-text",
                            isNoteExpanded 
                              ? "bg-primary/5 border-primary/35" 
                              : "bg-[#0c0d12] border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
                          )}
                          onClick={() => setExpandedActionNotes({
                            ...expandedActionNotes,
                            [note.id]: !isNoteExpanded
                          })}
                        >
                          <div className="flex items-center justify-between gap-3 select-text">
                            <div className="flex items-center gap-2 select-text min-w-0 flex-1">
                              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                                {note.createdAt}
                              </span>
                              <p className={cn(
                                "text-xs text-slate-300 font-medium select-text truncate flex-1 md:max-w-2xl",
                                isNoteExpanded ? "hidden" : "block"
                              )}>
                                {note.text}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteActionNote(note.id);
                                }}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded border border-red-500/20 transition-all cursor-pointer"
                                title="Delete action note"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <div className="text-slate-500">
                                {isNoteExpanded ? (
                                  <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 transition-transform" />
                                )}
                              </div>
                            </div>
                          </div>
                          {isNoteExpanded && (
                            <div className="mt-2.5 pt-2.5 border-t border-white/5 text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed">
                              {note.text}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Contact/Note control row */}
              <div className="flex flex-col items-center justify-center py-4 bg-[#0c0d12]/40 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingContact(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-white border border-primary/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Contact
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNote(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Note
                  </button>
                </div>

                {isAddingNote && (
                  <div className="w-full max-w-xl bg-zinc-950 p-4 rounded-xl border border-white/10 shadow-2xl space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Bookmark className="h-3 w-3 text-primary" />
                        EVENT NOTE / REMINDER
                      </span>
                    </div>
                    <textarea
                      placeholder="Type a note about this event, client or key discussion points to remember..."
                      value={noteText}
                      onChange={(e) => handleNoteChange(e.target.value)}
                      className="w-full h-24 bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 resize-y"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        className="px-3 py-1 bg-primary hover:bg-secondary text-slate-900 rounded font-bold text-xs transition-all cursor-pointer"
                      >
                        Save Note
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNote(false);
                          if (!result.notes) {
                            setNoteText('');
                          }
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Note Panel */}
            <div className="h-12 shrink-0 border-t border-white/10 flex items-center px-4 bg-zinc-900/40">
              <span className="text-[10px] font-bold text-primary mr-4 uppercase tracking-tighter">SOURCES:</span>
              <span className="text-[9.5px] text-slate-550 truncate" title="EventMarketer, ConferenceMonkey, 10Times, ConferenceIndex, IndustryEvents, AllConferenceAlert, FeaturedCustomers, Blooloop, LinkedIn, Google Search Engine">
                EventMarketer, ConferenceMonkey, 10Times, ConferenceIndex, IndustryEvents, AllConferenceAlert, FeaturedCustomers, Blooloop, LinkedIn, Google
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 glass rounded-2xl flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <Search className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-300">Ready to Scan</h3>
            <p className="text-slate-500 max-w-sm mt-2 text-sm">Enter an event name above to start the deep online scan for contacts and intelligence.</p>
          </div>
        )}
        {multipleResults.length > 0 && (
          <div className="shrink-0 flex items-center justify-between p-3.5 bg-[#0e0f14]/85 border border-white/5 rounded-xl mt-auto shadow-2xl">
            <span className="text-[11px] text-slate-400 font-mono">
              Result <strong className="text-primary">{currentResultIndex + 1}</strong> of <strong className="text-slate-200">{multipleResults.length}</strong> scanned events
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentResultIndex === 0}
                onClick={() => {
                  const newIdx = currentResultIndex - 1;
                  setCurrentResultIndex(newIdx);
                  setResult(multipleResults[newIdx]);
                  setQueryText(multipleResults[newIdx].eventName);
                }}
                className="p-1 px-2.5 text-[11px] font-bold tracking-tight text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              
              <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto custom-scrollbar whitespace-nowrap px-1">
                {multipleResults.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrentResultIndex(idx);
                      setResult(multipleResults[idx]);
                      setQueryText(multipleResults[idx].eventName);
                    }}
                    className={cn(
                      "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer border",
                      idx === currentResultIndex 
                        ? "bg-primary border-primary text-slate-900" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentResultIndex === multipleResults.length - 1}
                onClick={() => {
                  const newIdx = currentResultIndex + 1;
                  setCurrentResultIndex(newIdx);
                  setResult(multipleResults[newIdx]);
                  setQueryText(multipleResults[newIdx].eventName);
                }}
                className="p-1 px-2.5 text-[11px] font-bold tracking-tight text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center gap-1 transition-all cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Multiple Events Modal */}
      {isMultipleModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0e0f14] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Submit Multiple Event Scans</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsMultipleModalOpen(false)}
                className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMultipleSubmit} className="flex-1 flex flex-col min-h-0 pt-4">
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Enter multiple event names below. Click the submit button to cue up scan jobs for each event sequentially. We will scrape and summarize all relevant data so you can audit them page-by-page.
              </p>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 max-h-[350px]">
                {multipleScanInputs.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="text-[10px] font-mono text-slate-600 w-5 text-right">{idx + 1}.</div>
                    <input
                      type="text"
                      placeholder={`e.g. CES 2026 or Event #${idx + 1}`}
                      value={val}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      className="flex-1 h-9 bg-zinc-900/50 border border-white/10 rounded-lg px-3 text-xs text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none placeholder:text-slate-600"
                    />
                    {multipleScanInputs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInputField(idx)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 cursor-pointer"
                        title="Remove event name"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center gap-3 pb-4 select-text">
                <button
                  type="button"
                  onClick={handleAddInputField}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-bold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Event to Cue
                </button>
                <span className="text-white/20 text-xs">|</span>
                <label className="flex items-center gap-1 text-[11px] text-primary hover:underline font-bold cursor-pointer select-none">
                  <Upload className="h-3.5 w-3.5" />
                  Upload .CSV to Cue
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsMultipleModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-secondary text-slate-900 rounded-xl text-xs font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 cursor-pointer"
                >
                  Scan Multiple Events ({multipleScanInputs.filter(Boolean).length})
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResearchMode;

import React, { useState, useEffect } from 'react';
import { ResearchResult, SavedEvent, ActionNote, ResearchCueItem, ClaimedLead } from '@/src/types';
import { useFirebase } from './FirebaseProvider';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, setDoc, doc, query as fsQuery, onSnapshot, deleteDoc, getDocs, where, updateDoc } from 'firebase/firestore';
import { normalizeName, normalizeDomain, isLeadMatch, isClaimExpired } from '@/src/lib/leadMatching';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Filter, 
  Send,
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
  Edit3,
  Flame,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface ImportModalContact {
  role: string;
  name: string;
  email: string;
  phone: string;
  social: string;
  selected: boolean;
  isNew: boolean;
  enrichedFields?: string[];
}

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

const formatDate = (raw: string): string => {
  if (!raw) return '';
  const rangeParts = raw.split(' – ');
  if (rangeParts.length === 2) {
    const [s, e] = rangeParts.map(p => new Date(p.trim() + 'T00:00:00'));
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return raw;
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.toLocaleDateString('en-US', { month: 'long' })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    }
    return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  const d = new Date(raw + 'T00:00:00');
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

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
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [leftActiveTab, setLeftActiveTab] = useState<'cue' | 'scans' | 'pipeline'>('cue');
  const [scannedList, setScannedList] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'event' | 'vendor'>('event');
  
  // Cue Selection Scan Mode States
  const [cueSelectModeActive, setCueSelectModeActive] = useState(false);
  const [selectedCueItems, setSelectedCueItems] = useState<ResearchCueItem[]>([]);

  // List Selection Mode States (Cue, Scans, Pipeline)
  const [listSelectMode, setListSelectMode] = useState(false);
  const [selectedListItems, setSelectedListItems] = useState<string[]>([]);

  useEffect(() => {
    setSelectedListItems([]);
  }, [leftActiveTab]);
  
  const filteredCue = researchCue.filter(cue => 
    !cue?.eventName || !savedEvents.some(saved => saved?.eventName?.toLowerCase() === cue.eventName.toLowerCase())
  );
  
  const filteredScans = scannedList.filter(scan => 
    !scan?.eventName || !savedEvents.some(saved => saved?.eventName?.toLowerCase() === scan.eventName.toLowerCase())
  );
  
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

  const [isToolDropdownOpen, setIsToolDropdownOpen] = useState(false);
  const [isSingleSelectionMode, setIsSingleSelectionMode] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [isFindingMore, setIsFindingMore] = useState(false);
  const [isScrapingFirecrawl, setIsScrapingFirecrawl] = useState(false);
  const [isScrapeDropdownOpen, setIsScrapeDropdownOpen] = useState(false);
  const [customScrapeUrl, setCustomScrapeUrl] = useState('');

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importModalContacts, setImportModalContacts] = useState<ImportModalContact[]>([]);
  const [importModalSource, setImportModalSource] = useState<'firecrawl' | 'findMore'>('firecrawl');

  const [projects, setProjects] = useState<any[]>([]);
  const [isTransferDropdownOpen, setIsTransferDropdownOpen] = useState(false);
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'claimed_leads'), snap => {
      setClaimedLeads(snap.docs.map(d => ({ claimId: d.id, ...d.data() } as ClaimedLead)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = fsQuery(collection(db, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(d => ({
        projectId: d.id,
        ...d.data()
      }));
      setProjects(projs);
    });
    return () => unsubscribe();
  }, [user]);

  const handleToggleListItem = (id: string) => {
    setSelectedListItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllListItems = () => {
    let ids: string[] = [];
    if (leftActiveTab === 'cue') {
      ids = filteredCue.map(c => c.cueId);
    } else if (leftActiveTab === 'scans') {
      ids = filteredScans.map(s => s.scanId);
    } else if (leftActiveTab === 'pipeline') {
      ids = savedEvents.map(e => e.eventId);
    }
    setSelectedListItems(ids);
  };

  const handleDeselectAllListItems = () => {
    setSelectedListItems([]);
  };

  const handleBulkMoveToPipeline = async () => {
    if (!user || !activeProjectId || selectedListItems.length === 0) return;

    if (!confirm(`Are you sure you want to move the ${selectedListItems.length} selected items to the Pipeline?`)) {
      return;
    }

    setLoading(true);
    try {
      for (const itemId of selectedListItems) {
        let itemToSave: any = null;
        if (leftActiveTab === 'cue') {
          const cueItem = researchCue.find(c => c.cueId === itemId);
          if (cueItem) {
            itemToSave = {
              eventName: cueItem.eventName,
              website: cueItem.website || '',
              date: '',
              location: '',
              description: '',
              contacts: [],
              searchType: cueItem.searchType || 'event',
              isSandbox: cueItem.isSandbox || false,
            };
          }
        } else if (leftActiveTab === 'scans') {
          itemToSave = scannedList.find(s => s.scanId === itemId);
        }

        if (itemToSave) {
          const eventId = Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId), {
            ...itemToSave,
            eventId: eventId,
            projectId: activeProjectId,
            userId: user.uid,
            notes: itemToSave.notes || '',
            status: 'Initial',
            createdAt: serverTimestamp()
          });

          // Delete from scans
          const scanInList = scannedList.find(s => s.eventName.toLowerCase() === itemToSave.eventName.toLowerCase());
          if (scanInList) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'scans', scanInList.scanId));
          }

          // Delete from cue
          const cueItem = researchCue.find(c => c.eventName.toLowerCase() === itemToSave.eventName.toLowerCase());
          if (cueItem) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', cueItem.cueId));
          }
        }
      }
      setSelectedListItems([]);
      setListSelectMode(false);
    } catch (e) {
      console.error(e);
      alert("Error moving items to pipeline");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkTransferLeads = async (targetProjId: string, targetProjName: string) => {
    if (!user || !activeProjectId || selectedListItems.length === 0) return;

    if (!confirm(`Are you sure you want to transfer ${selectedListItems.length} selected items to project "${targetProjName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      for (const itemId of selectedListItems) {
        let itemToTransfer: any = null;
        let eventIdToDelete: string | null = null;
        let scanIdToDelete: string | null = null;
        let cueIdToDelete: string | null = null;

        if (leftActiveTab === 'cue') {
          const cueItem = researchCue.find(c => c.cueId === itemId);
          if (cueItem) {
            itemToTransfer = {
              eventName: cueItem.eventName,
              website: cueItem.website || '',
              date: '',
              location: '',
              description: '',
              contacts: [],
              searchType: cueItem.searchType || 'event',
              isSandbox: cueItem.isSandbox || false,
            };
            cueIdToDelete = cueItem.cueId;
            const scanInList = scannedList.find(s => s.eventName.toLowerCase() === cueItem.eventName.toLowerCase());
            if (scanInList) scanIdToDelete = scanInList.scanId;
          }
        } else if (leftActiveTab === 'scans') {
          const scanItem = scannedList.find(s => s.scanId === itemId);
          if (scanItem) {
            itemToTransfer = scanItem;
            scanIdToDelete = scanItem.scanId;
            const cueItem = researchCue.find(c => c.eventName.toLowerCase() === scanItem.eventName.toLowerCase());
            if (cueItem) cueIdToDelete = cueItem.cueId;
          }
        } else if (leftActiveTab === 'pipeline') {
          const savedItem = savedEvents.find(s => s.eventId === itemId);
          if (savedItem) {
            itemToTransfer = savedItem;
            eventIdToDelete = savedItem.eventId;
            const scanInList = scannedList.find(s => s.eventName.toLowerCase() === savedItem.eventName.toLowerCase());
            if (scanInList) scanIdToDelete = scanInList.scanId;
            const cueItem = researchCue.find(c => c.eventName.toLowerCase() === savedItem.eventName.toLowerCase());
            if (cueItem) cueIdToDelete = cueItem.cueId;
          }
        }

        if (itemToTransfer) {
          const scanId = encodeURIComponent(itemToTransfer.eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100);
          const targetScanRef = doc(db, 'users', user.uid, 'projects', targetProjId, 'scans', scanId);

          await setDoc(targetScanRef, {
            eventName: itemToTransfer.eventName,
            date: itemToTransfer.date || '',
            location: itemToTransfer.location || '',
            description: itemToTransfer.description || '',
            contacts: itemToTransfer.contacts || [],
            website: itemToTransfer.website || '',
            logoUrl: itemToTransfer.logoUrl || '',
            notes: itemToTransfer.notes || '',
            actionNotes: itemToTransfer.actionNotes || [],
            searchType: itemToTransfer.searchType || 'event',
            yearFounded: itemToTransfer.yearFounded || '',
            isSandbox: itemToTransfer.isSandbox || false,
            createdAt: serverTimestamp()
          }, { merge: true });

          if (eventIdToDelete) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventIdToDelete));
          }
          if (scanIdToDelete) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'scans', scanIdToDelete));
          }
          if (cueIdToDelete) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', cueIdToDelete));
          }
        }
      }
      setSelectedListItems([]);
      setListSelectMode(false);
    } catch (e) {
      console.error(e);
      alert("Error transferring items");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInCurrentAndFindMore = async () => {
    if (!result) return;

    setIsVerifyingLinkedIn(true);
    setVerifyStatusMessage("Step 1/2: Verifying current contacts via LinkedIn matches & LinkUp API...");

    let currentBaselineContacts = result.contacts || [];

    try {
      if (currentBaselineContacts.length > 0) {
        const response = await fetch('/api/contacts-enrich', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contacts: currentBaselineContacts,
            companyName: result.eventName
          })
        });

        if (!response.ok) {
          throw new Error(`Enrichment failed: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && data.contacts) {
          currentBaselineContacts = data.contacts;

          const updatedResult = {
            ...result,
            contacts: currentBaselineContacts
          };
          setResult(updatedResult);

          if (multipleResults.length > 0) {
            const updatedMultiple = multipleResults.map((item, idx) => {
              if (idx === currentResultIndex || item.eventName === result.eventName) {
                return { ...item, contacts: currentBaselineContacts };
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
                contacts: currentBaselineContacts
              }, { merge: true });
            } catch (err) {
              console.error("Failed to update contacts on saved event:", err);
            }
          }
        }
      }

      setVerifyStatusMessage("Step 2/2: Searching LinkedIn & social indexes for additional key contacts...");
      setIsFindingMore(true);

      const existingNames = currentBaselineContacts.map(c => c.name).filter(Boolean);

      const response = await fetch('/api/find-more-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: result.eventName,
          existingNames,
          searchType: result.searchType || 'event'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to find more contacts: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.contacts && Array.isArray(data.contacts)) {
        const newContacts = data.contacts;
        const processed: ImportModalContact[] = [];

        newContacts.forEach((nc: any) => {
          if (!nc.name) return;

          const existing = currentBaselineContacts.find(
            (cc) => cc.name && cc.name.toLowerCase().trim() === nc.name.toLowerCase().trim()
          );

          if (existing) {
            const enrichedFields: string[] = [];
            if (!existing.email && nc.email) enrichedFields.push("email");
            if (!existing.phone && nc.phone) enrichedFields.push("phone");
            if (!existing.social && nc.social) enrichedFields.push("social");

            if (enrichedFields.length > 0) {
              processed.push({
                role: nc.role || existing.role || 'Staff',
                name: existing.name,
                email: nc.email || existing.email || '',
                phone: nc.phone || existing.phone || '',
                social: nc.social || existing.social || '',
                selected: true,
                isNew: false,
                enrichedFields
              });
            }
          } else {
            processed.push({
              role: nc.role || 'Staff',
              name: nc.name,
              email: nc.email || '',
              phone: nc.phone || '',
              social: nc.social || '',
              selected: true,
              isNew: true
            });
          }
        });

        if (processed.length > 0) {
          setImportModalContacts(processed);
          setImportModalSource('findMore');
          setIsImportModalOpen(true);
          setVerifyStatusMessage("Current & Find More Search Complete! Ready to preview results.");
        } else {
          setVerifyStatusMessage("Current & Find More Search Complete! No additional contacts found.");
          setTimeout(() => setVerifyStatusMessage(null), 5000);
        }
      }
    } catch (err: any) {
      console.error("LinkedIn Current & Find More error:", err);
      setVerifyStatusMessage(`Search error: ${err.message || 'An error occurred during query'}`);
      setTimeout(() => setVerifyStatusMessage(null), 6000);
    } finally {
      setIsVerifyingLinkedIn(false);
      setIsFindingMore(false);
    }
  };

  const handleLinkedInVerify = async () => {
    if (!result || !result.contacts || result.contacts.length === 0) {
      alert("No contacts available to verify.");
      return;
    }

    setIsVerifyingLinkedIn(true);
    setVerifyStatusMessage("Searching LinkedIn matches & retrieving verified contact details via LinkUp API...");

    try {
      const response = await fetch('/api/contacts-enrich', {
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

  const handleVerifySelected = async () => {
    if (!result || !result.contacts || result.contacts.length === 0) {
      alert("No contacts available to verify.");
      return;
    }
    if (selectedContacts.length === 0) {
      alert("Please select at least one contact to verify.");
      return;
    }

    setIsVerifyingLinkedIn(true);
    setVerifyStatusMessage(`Searching LinkedIn matches & retrieving verified contact details for ${selectedContacts.length} selected contacts...`);

    const contactsToVerify = result.contacts.filter((_, idx) => selectedContacts.includes(idx));

    try {
      const response = await fetch('/api/contacts-enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contacts: contactsToVerify,
          companyName: result.eventName
        })
      });

      if (!response.ok) {
        throw new Error(`Enrichment failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.contacts) {
        const enrichedSubset = data.contacts;
        
        let socialCount = 0;
        let emailCount = 0;

        // Map the enriched contacts back into their original positions
        const updatedContacts = result.contacts.map((oldC, idx) => {
          if (selectedContacts.includes(idx)) {
            // Find the enriched contact in the returned array
            const subsetIdx = selectedContacts.indexOf(idx);
            const newC = enrichedSubset[subsetIdx];
            if (newC) {
              if (!oldC.social && newC.social) socialCount++;
              if (!oldC.email && newC.email) emailCount++;
              return {
                ...oldC,
                social: newC.social || oldC.social,
                email: newC.email || oldC.email
              };
            }
          }
          return oldC;
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
        } else {
          // If not saved to pipeline yet, save to scans so they survive
          await saveToScans(updatedResult);
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
      setIsSingleSelectionMode(false);
      setSelectedContacts([]);
    }
  };

  const handleFindMoreContacts = async () => {
    if (!result) return;

    setIsFindingMore(true);
    setVerifyStatusMessage("Searching LinkedIn & social indexes for additional key contacts...");

    const existingNames = (result.contacts || []).map(c => c.name).filter(Boolean);

    try {
      const response = await fetch('/api/find-more-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companyName: result.eventName,
          existingNames,
          searchType: result.searchType || 'event'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to find more contacts: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.contacts && Array.isArray(data.contacts)) {
        const newContacts = data.contacts;
        const currentContacts = result.contacts || [];
        const processed: ImportModalContact[] = [];

        newContacts.forEach((nc: any) => {
          if (!nc.name) return;

          const existing = currentContacts.find(
            (cc) => cc.name && cc.name.toLowerCase().trim() === nc.name.toLowerCase().trim()
          );

          if (existing) {
            const enrichedFields: string[] = [];
            if (!existing.email && nc.email) enrichedFields.push("email");
            if (!existing.phone && nc.phone) enrichedFields.push("phone");
            if (!existing.social && nc.social) enrichedFields.push("social");

            if (enrichedFields.length > 0) {
              processed.push({
                role: nc.role || existing.role || 'Staff',
                name: existing.name,
                email: nc.email || existing.email || '',
                phone: nc.phone || existing.phone || '',
                social: nc.social || existing.social || '',
                selected: true,
                isNew: false,
                enrichedFields
              });
            }
          } else {
            processed.push({
              role: nc.role || 'Staff',
              name: nc.name,
              email: nc.email || '',
              phone: nc.phone || '',
              social: nc.social || '',
              selected: true,
              isNew: true
            });
          }
        });

        if (processed.length > 0) {
          setImportModalContacts(processed);
          setImportModalSource('findMore');
          setIsImportModalOpen(true);
          setVerifyStatusMessage("Contacts Search Complete! Ready to preview results.");
        } else {
          setVerifyStatusMessage("Contacts Search Complete! No new contacts or details found.");
          setTimeout(() => setVerifyStatusMessage(null), 4000);
        }
      }
    } catch (err: any) {
      console.error("Find More Contacts error:", err);
      setVerifyStatusMessage(`Error finding contacts: ${err.message || 'An error occurred'}`);
      setTimeout(() => setVerifyStatusMessage(null), 6000);
    } finally {
      setIsFindingMore(false);
    }
  };

  const handleFirecrawlScrape = async (overrideUrl?: string) => {
    const urlToScrape = overrideUrl || (result ? result.website : "");
    if (!urlToScrape) {
      alert("No website URL available to scrape.");
      return;
    }

    setIsScrapingFirecrawl(true);
    setVerifyStatusMessage(`Crawling & extracting contacts from ${urlToScrape} via Firecrawl...`);

    try {
      const response = await fetch('/api/firecrawl-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: urlToScrape,
          companyName: result?.eventName || "",
          officialWebsite: result?.website || ""
        })
      });

      if (!response.ok) {
        throw new Error(`Scraping failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.contacts && Array.isArray(data.contacts)) {
        if (data.warnings && data.warnings.length > 0) {
          alert(`⚠️ Email Validation Warning:\n\nRemoved ${data.warnings.length} email address(es) that belonged to domains outside of the event/vendor website (e.g., random or government domains).`);
        }
        const scraped = data.contacts;
        const currentContacts = result.contacts || [];
        const processed: ImportModalContact[] = [];

        scraped.forEach((sc: any) => {
          if (!sc.name) return;

          const existing = currentContacts.find(
            (cc) => cc.name && cc.name.toLowerCase().trim() === sc.name.toLowerCase().trim()
          );

          if (existing) {
            const enrichedFields: string[] = [];
            if (!existing.email && sc.email) enrichedFields.push("email");
            if (!existing.phone && sc.phone) enrichedFields.push("phone");
            if (!existing.social && sc.social) enrichedFields.push("social");

            if (enrichedFields.length > 0) {
              processed.push({
                role: sc.role || existing.role || 'Staff',
                name: existing.name,
                email: sc.email || existing.email || '',
                phone: sc.phone || existing.phone || '',
                social: sc.social || existing.social || '',
                selected: true,
                isNew: false,
                enrichedFields
              });
            }
          } else {
            processed.push({
              role: sc.role || 'Staff',
              name: sc.name,
              email: sc.email || '',
              phone: sc.phone || '',
              social: sc.social || '',
              selected: true,
              isNew: true
            });
          }
        });

        if (processed.length > 0) {
          setImportModalContacts(processed);
          setImportModalSource('firecrawl');
          setIsImportModalOpen(true);
          setVerifyStatusMessage("Site Scrape Complete! Ready to preview results.");
        } else {
          setVerifyStatusMessage("Site Scrape Complete! Roster is already up to date.");
          setTimeout(() => setVerifyStatusMessage(null), 4000);
        }
      }
    } catch (err: any) {
      console.error("Firecrawl Scrape error:", err);
      setVerifyStatusMessage(`Scraping error: ${err.message || 'An error occurred during query'}`);
      setTimeout(() => setVerifyStatusMessage(null), 6000);
    } finally {
      setIsScrapingFirecrawl(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result) return;
    const selectedToImport = importModalContacts.filter(c => c.selected);
    if (selectedToImport.length === 0) {
      alert("No contacts selected to import.");
      return;
    }

    const currentContacts = [...(result.contacts || [])];
    let addedCount = 0;
    let enrichedCount = 0;

    selectedToImport.forEach(item => {
      if (item.isNew) {
        currentContacts.push({
          role: item.role,
          name: item.name,
          email: item.email,
          phone: item.phone,
          social: item.social,
          contactInfo: [item.email, item.phone, item.social].filter(Boolean).join(' | ')
        });
        addedCount++;
      } else {
        const matchIdx = currentContacts.findIndex(cc => cc.name && cc.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        if (matchIdx !== -1) {
          const existing = currentContacts[matchIdx];
          let enrichedThisContact = false;
          if (item.enrichedFields?.includes("email")) {
            existing.email = item.email;
            enrichedThisContact = true;
          }
          if (item.enrichedFields?.includes("phone")) {
            existing.phone = item.phone;
            enrichedThisContact = true;
          }
          if (item.enrichedFields?.includes("social")) {
            existing.social = item.social;
            enrichedThisContact = true;
          }
          if (enrichedThisContact) {
            existing.contactInfo = [existing.email, existing.phone, existing.social].filter(Boolean).join(' | ');
            enrichedCount++;
          }
        }
      }
    });

    const updatedResult = {
      ...result,
      contacts: currentContacts
    };
    setResult(updatedResult);

    if (multipleResults.length > 0) {
      const updatedMultiple = multipleResults.map((item, idx) => {
        if (idx === currentResultIndex || item.eventName === result.eventName) {
          return { ...item, contacts: currentContacts };
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
          contacts: currentContacts
        }, { merge: true });
      } catch (err) {
        console.error("Failed to update contacts on saved event:", err);
      }
    } else {
      await saveToScans(updatedResult);
    }

    setIsImportModalOpen(false);
    
    const sourceLabel = importModalSource === 'firecrawl' ? 'Site Scrape' : 'LinkedIn Search';
    setVerifyStatusMessage(`${sourceLabel} Import Complete! Imported ${addedCount} new contact(s) and enriched ${enrichedCount} contact(s).`);
    setTimeout(() => setVerifyStatusMessage(null), 6000);
  };

  const handleTransferLead = async (targetProjId: string, targetProjName: string) => {
    if (!user || !activeProjectId || !result) return;

    if (!confirm(`Are you sure you want to transfer "${result.eventName}" to project "${targetProjName}"?`)) {
      return;
    }

    try {
      const scanId = encodeURIComponent(result.eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100);
      const targetScanRef = doc(db, 'users', user.uid, 'projects', targetProjId, 'scans', scanId);

      // 1. Copy lead data to scans collection of the target project
      await setDoc(targetScanRef, {
        eventName: result.eventName,
        date: result.date || '',
        location: result.location || '',
        description: result.description || '',
        contacts: result.contacts || [],
        website: result.website || '',
        logoUrl: result.logoUrl || '',
        notes: result.notes || noteText || '',
        actionNotes: result.actionNotes || [],
        searchType: result.searchType || 'event',
        yearFounded: result.yearFounded || '',
        isSandbox: result.isSandbox || false,
        createdAt: serverTimestamp()
      }, { merge: true });

      // 2. Delete from current project events (pipeline)
      const evId = (result as any).eventId;
      if (evId) {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId));
      }

      // 3. Delete from current project scans
      const scanInList = scannedList.find(s => s.eventName.toLowerCase() === result.eventName.toLowerCase());
      const currentScanId = scanInList?.scanId || scanId;
      await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'scans', currentScanId));

      // 4. Delete from current project cue
      const cueItem = researchCue.find(c => c.eventName.toLowerCase() === result.eventName.toLowerCase());
      if (cueItem) {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', cueItem.cueId));
      }

      // 5. Update local multiple results if active
      if (multipleResults.length > 0) {
        const updatedMultiple = multipleResults.filter(item => item.eventName.toLowerCase() !== result.eventName.toLowerCase());
        setMultipleResults(updatedMultiple);
        if (updatedMultiple.length > 0) {
          const nextIdx = Math.min(currentResultIndex, updatedMultiple.length - 1);
          setCurrentResultIndex(nextIdx);
          setResult(updatedMultiple[nextIdx]);
        } else {
          setResult(null);
          setQueryText('');
          setIsSaved(false);
        }
      } else {
        setResult(null);
        setQueryText('');
        setIsSaved(false);
      }

      setVerifyStatusMessage(`Successfully transferred "${result.eventName}" to "${targetProjName}".`);
      setTimeout(() => setVerifyStatusMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to transfer lead:", err);
      alert(`Failed to transfer lead: ${err.message || 'An error occurred'}`);
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
      contactInfo: [email, phone, social].filter(Boolean).join(' | '),
      manuallyAdded: true,
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
        await setDoc(eventRef, { contacts: updatedContacts }, { merge: true });
      } catch (err) {
        console.error("Failed to add contact to saved event:", err);
      }
    } else {
      // No saved event yet — persist to scans so contacts survive navigation
      await saveToScans(updatedResult);
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

    const confirmDelete = window.confirm("Are you sure? Scan $Tokens used curating this lead.");
    if (!confirmDelete) return;

    try {
      const targetEvent = savedEvents.find(ev => ev.eventId === eventId || (ev as any).docId === eventId);
      const docIdToDelete = (targetEvent as any)?.docId || eventId;
      
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', docIdToDelete);
      await deleteDoc(eventRef);

      if (eventId && eventId !== docIdToDelete) {
        try { await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', eventId)); } catch {}
      }

      if (targetEvent) {
        // Return status to Available / Unclaimed in claimed_leads database
        const claimSnap = await getDocs(fsQuery(
          collection(db, 'claimed_leads'),
          where('claimedBy', '==', user.uid)
        ));
        const matches = claimSnap.docs.filter(d =>
          isLeadMatch(
            { eventName: targetEvent.eventName, website: targetEvent.website },
            { eventName: d.data().eventName, website: d.data().website }
          )
        );
        await Promise.all(matches.map(d => deleteDoc(d.ref)));

        await saveToScans(targetEvent as any);
      }

      if (result && ((result as any).eventId === eventId || (result as any).docId === eventId || result.eventName.toLowerCase() === targetEvent?.eventName.toLowerCase())) {
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
    const contact = (result.contacts || [])[contactIdx];
    if (!confirm(`Remove ${contact?.name || 'this contact'} from the contact sheet?`)) return;

    const updatedContacts = (result.contacts || []).filter((_, idx) => idx !== contactIdx);
    const updatedResult = { ...result, contacts: updatedContacts };
    setResult(updatedResult);

    if (multipleResults.length > 0) {
      setMultipleResults(multipleResults.map((item, idx) =>
        idx === currentResultIndex || item.eventName === result.eventName
          ? { ...item, contacts: updatedContacts }
          : item
      ));
    }

    const evId = (result as any).eventId;
    if (evId && user && activeProjectId) {
      try {
        const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', evId);
        await setDoc(eventRef, { contacts: updatedContacts }, { merge: true });
      } catch (err) {
        console.error("Failed to delete contact from saved event:", err);
      }
    }
    await saveToScans(updatedResult);
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
        ...doc.data(),
        eventId: doc.id,
        docId: doc.id
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
        ...doc.data(),
        cueId: doc.id,
        docId: doc.id
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
        ...doc.data(),
        scanId: doc.id,
        docId: doc.id
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

  // If the lead is already in the pipeline, update it with fresh scan data
  // while preserving pipeline-specific fields (status, notes, actionNotes, etc.)
  const syncScanToPipeline = async (data: ResearchResult) => {
    if (!user || !activeProjectId) return;
    const existing = savedEvents.find(e =>
      e.eventName.toLowerCase() === data.eventName.toLowerCase() ||
      e.eventId === (data as any).eventId
    );
    if (!existing) return;
    try {
      const manualContacts = (existing.contacts || []).filter(c => c.manuallyAdded);
      const mergedContacts = [
        ...(data.contacts || []),
        ...manualContacts.filter(mc =>
          !(data.contacts || []).some(sc => sc.name.toLowerCase() === mc.name.toLowerCase())
        )
      ];
      const eventRef = doc(db, 'users', user.uid, 'projects', activeProjectId, 'events', existing.eventId);
      await setDoc(eventRef, {
        contacts: mergedContacts,
        description: data.description || existing.description,
        date: data.date || existing.date,
        location: data.location || existing.location,
        website: data.website || existing.website,
        logoUrl: data.logoUrl || existing.logoUrl,
        yearFounded: data.yearFounded || existing.yearFounded,
      }, { merge: true });
    } catch (err) {
      console.error('Failed to sync scan to pipeline:', err);
    }
  };

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

  // When a scan returns a different event name than the cue item (e.g. HubSpot INBOUND → UNBOUND),
  // update the claimed_lead's metadata so future status syncs can find it correctly.
  const syncClaimedLeadMetadata = async (originalName: string, scannedData: ResearchResult) => {
    if (!user || scannedData.eventName === originalName) return;
    try {
      const snap = await getDocs(fsQuery(
        collection(db, 'claimed_leads'),
        where('claimedBy', '==', user.uid),
        where('normalizedName', '==', normalizeName(originalName))
      ));
      await Promise.all(snap.docs.map(d => updateDoc(d.ref, {
        eventName: scannedData.eventName,
        website: scannedData.website || d.data().website,
        normalizedName: normalizeName(scannedData.eventName),
        normalizedDomain: normalizeDomain(scannedData.website || ''),
      })));
    } catch (e) {
      console.error('Failed to sync claimed lead metadata:', e);
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
        const manualContacts = (result?.contacts || []).filter(c => c.manuallyAdded);
        if (manualContacts.length > 0) {
          data.contacts = [...(data.contacts || []), ...manualContacts];
        }
        setResult(data);
        await saveToScans(data);
        await syncScanToPipeline(data);
        await syncClaimedLeadMetadata(item.eventName, data);
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
      const manualContacts = (result?.contacts || []).filter(c => c.manuallyAdded);
      if (manualContacts.length > 0) {
        data.contacts = [...(data.contacts || []), ...manualContacts];
      }
      setResult(data);
      await saveToScans(data);
      await syncScanToPipeline(data);
      await syncClaimedLeadMetadata(item.eventName, data);
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

  const handleDeleteCueItem = async (cueId: string, eventName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !activeProjectId) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', cueId));
      const claimSnap = await getDocs(fsQuery(
        collection(db, 'claimed_leads'),
        where('claimedBy', '==', user.uid),
        where('normalizedName', '==', normalizeName(eventName))
      ));
      await Promise.all(claimSnap.docs.map(d => deleteDoc(d.ref)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCueSelection = (item: ResearchCueItem) => {
    setSelectedCueItems(prev => {
      const exists = prev.some(c => c.cueId === item.cueId);
      if (exists) {
        return prev.filter(c => c.cueId !== item.cueId);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleRunCueSelectionScans = async () => {
    if (selectedCueItems.length === 0) return;

    setLoading(true);
    setResult(null);
    setMultipleResults([]);
    setCurrentResultIndex(0);
    setIsSaved(false);

    const itemsToScan = [...selectedCueItems];
    setCueSelectModeActive(false);
    setSelectedCueItems([]);

    const fetchedResults: ResearchResult[] = [];

    for (let i = 0; i < itemsToScan.length; i++) {
      const item = itemsToScan[i];
      const name = item.eventName;
      const searchType = item.searchType || 'event';
      setCurrentScanningEvent(name);

      if (simulationMode) {
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const data = getSimulatedResult(name, searchType);
          fetchedResults.push(data);
          await saveToScans(data);
          await syncScanToPipeline(data);
          await syncClaimedLeadMetadata(name, data);
          setSpendingCapError(null);
          if (item.cueId && user && activeProjectId) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
          }
        } catch (err) {
          console.error(err);
        }
        continue;
      }

      try {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            eventName: name, 
            filters, 
            model: 'gemini-3.5-flash', 
            searchType 
          })
        });
        const data = await response.json();
        if (data && !data.error) {
          fetchedResults.push(data);
          await saveToScans(data);
          await syncScanToPipeline(data);
          await syncClaimedLeadMetadata(name, data);
          setSpendingCapError(null);
          if (item.cueId && user && activeProjectId) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
          }
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
      alert("All selected cue scans failed. If your API key triggered a spending limit error on Google AI Studio, please turn on Simulation Mode to try out the app's rich pipeline features.");
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
          // Move that listing out of the Pipeline and back into the Scans list!
          await saveToScans(result);
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

      // Remove from scans and cue
      const scanInList = scannedList.find(s => s.eventName.toLowerCase() === result.eventName.toLowerCase());
      if (scanInList) {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', targetProjectId, 'scans', scanInList.scanId));
      }
      const cueItem = researchCue.find(c => c.eventName.toLowerCase() === result.eventName.toLowerCase());
      if (cueItem) {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', targetProjectId, 'research_cue', cueItem.cueId));
      }

      // Advance to next cue item, or clear the panel if the cue is empty
      const remainingCue = researchCue.filter(c => c.eventName.toLowerCase() !== result.eventName.toLowerCase());
      if (remainingCue.length > 0) {
        const next = remainingCue[0];
        setQueryText(next.eventName);
        setSearchType(next.searchType || 'event');
        const scanned = scannedList.find(s => s.eventName.toLowerCase() === next.eventName.toLowerCase());
        const saved = savedEvents.find(s => s.eventName.toLowerCase() === next.eventName.toLowerCase());
        if (scanned) {
          setResult(scanned);
        } else if (saved) {
          setResult(saved);
        } else {
          setResult({
            eventName: next.eventName,
            website: next.website || '',
            date: '',
            location: '',
            description: '',
            contacts: [],
            searchType: next.searchType || 'event',
            isSandbox: false,
          });
        }
      } else {
        setResult(null);
        setQueryText('');
      }
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
    if (filteredCue.length === 0) {
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

    const rows = filteredCue.map(item => [
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

      const activeClaimedLeadsList = claimedLeads.filter(cl => !isClaimExpired(cl.claimedAt));
      const claimedInCsv = parsedNames.filter(name =>
        activeClaimedLeadsList.some(cl => isLeadMatch({ eventName: name }, { eventName: cl.eventName, website: cl.website }))
      );

      if (claimedInCsv.length > 0) {
        alert(`⚠️ CSV FILE CONTAINS ALREADY CLAIMED ITEMS!\n\nThe following ${claimedInCsv.length} event/vendor names in your CSV are already claimed in the database:\n\n${claimedInCsv.map(n => `• ${n}`).join('\n')}\n\nPlease revise your CSV file to remove these claimed items and re-upload.`);
        e.target.value = '';
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

    const activeClaimedLeadsList = claimedLeads.filter(cl => !isClaimExpired(cl.claimedAt));
    const claimedMatchesInInput = eventNames.filter(name =>
      activeClaimedLeadsList.some(cl => isLeadMatch({ eventName: name }, { eventName: cl.eventName, website: cl.website }))
    );
    if (claimedMatchesInInput.length > 0) {
      alert(`Cannot submit batch scan: The following items are already claimed in the database:\n\n${claimedMatchesInInput.map(n => `• ${n}`).join('\n')}\n\nPlease remove or revise these claimed items before submitting.`);
      return;
    }

    if (!user || !activeProjectId) {
      alert("No active project or user context found.");
      return;
    }

    setLoading(true);
    setResult(null);
    setMultipleResults([]);
    setCurrentResultIndex(0);
    setIsSaved(false);
    setIsMultipleModalOpen(false);

    // 1. Add all items to the Cue in Firestore and register claimed leads
    const addedCueItems: ResearchCueItem[] = [];
    try {
      for (const name of eventNames) {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue'), {
          eventName: name,
          searchType: searchType,
          isSandbox: simulationMode,
          createdAt: serverTimestamp()
        });
        addedCueItems.push({
          cueId: docRef.id,
          eventName: name,
          website: '',
          servicesOffered: '',
          searchType: searchType,
          isSandbox: simulationMode,
          createdAt: null
        });

        await addDoc(collection(db, 'claimed_leads'), {
          eventName: name,
          website: '',
          normalizedDomain: '',
          normalizedName: normalizeName(name),
          searchType: searchType,
          claimedBy: user.uid,
          claimedByName: user.displayName || user.email || '',
          claimedAt: serverTimestamp(),
          status: 'Initial',
        });
      }
    } catch (err) {
      console.error("Failed to add items to cue:", err);
      alert("Failed to initialize some items into the Scan Cue.");
      setLoading(false);
      return;
    }

    const fetchedResults: ResearchResult[] = [];

    // 2. Scan sequentially
    for (let i = 0; i < addedCueItems.length; i++) {
      const item = addedCueItems[i];
      const name = item.eventName;
      const currentSearchType = item.searchType || 'event';
      setCurrentScanningEvent(name);

      if (simulationMode) {
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          const data = getSimulatedResult(name, currentSearchType);
          fetchedResults.push(data);
          await saveToScans(data);
          await syncScanToPipeline(data);
          await syncClaimedLeadMetadata(name, data);
          setSpendingCapError(null);
          if (item.cueId && user && activeProjectId) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
          }
        } catch (err) {
          console.error(err);
        }
        continue;
      }

      try {
        const response = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            eventName: name, 
            filters, 
            model: 'gemini-3.5-flash', 
            searchType: currentSearchType 
          })
        });
        const data = await response.json();
        if (data && !data.error) {
          fetchedResults.push(data);
          await saveToScans(data);
          await syncScanToPipeline(data);
          await syncClaimedLeadMetadata(name, data);
          setSpendingCapError(null);
          if (item.cueId && user && activeProjectId) {
            await deleteDoc(doc(db, 'users', user.uid, 'projects', activeProjectId, 'research_cue', item.cueId));
          }
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
      alert("All selected multi-scan events failed. If your API key triggered a spending limit error on Google AI Studio, please turn on Simulation Mode to try out the app's rich pipeline features.");
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden h-full gap-6">
      {/* Sidebar Filters & Saved Events */}
      <aside className="w-72 flex flex-col p-5 glass border-r shrink-0 rounded-2xl h-full overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto custom-scrollbar pr-1 select-text">
          {/* List Editor Subtitle */}
          <div className="flex items-center justify-between px-1 shrink-0">
            <div className="flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">List Editor</h4>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !listSelectMode;
                setListSelectMode(nextVal);
                if (!nextVal) {
                  setSelectedListItems([]);
                }
              }}
              className="text-[10px] text-primary hover:text-secondary font-bold font-mono tracking-wide uppercase transition-all cursor-pointer hover:underline"
            >
              {listSelectMode ? "Cancel Select" : "Select from list"}
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="shrink-0 flex border border-white/5 p-1 bg-zinc-950/45 rounded-2xl gap-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setLeftActiveTab('cue')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none border",
                leftActiveTab === 'cue'
                  ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200 hover:from-zinc-850 hover:to-zinc-900 hover:border-white/10"
              )}
            >
              <span>Cue</span>
              <span className={cn(
                "px-1.5 py-0.5 text-[9px] font-bold rounded-md border",
                leftActiveTab === 'cue'
                  ? "bg-black/60 text-primary border-black/45 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.8)]"
                  : "bg-zinc-950/80 text-zinc-500 border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
              )}>
                {filteredCue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLeftActiveTab('scans')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none border",
                leftActiveTab === 'scans'
                  ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200 hover:from-zinc-850 hover:to-zinc-900 hover:border-white/10"
              )}
            >
              <span>Scans</span>
              <span className={cn(
                "px-1.5 py-0.5 text-[9px] font-bold rounded-md border",
                leftActiveTab === 'scans'
                  ? "bg-black/60 text-primary border-black/45 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.8)]"
                  : "bg-zinc-950/80 text-zinc-500 border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
              )}>
                {filteredScans.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLeftActiveTab('pipeline')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all text-center cursor-pointer select-none border",
                leftActiveTab === 'pipeline'
                  ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200 hover:from-zinc-850 hover:to-zinc-900 hover:border-white/10"
              )}
            >
              <span>Pipeline</span>
              <span className={cn(
                "px-1.5 py-0.5 text-[9px] font-bold rounded-md border",
                leftActiveTab === 'pipeline'
                  ? "bg-black/60 text-primary border-black/45 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.8)]"
                  : "bg-zinc-950/80 text-zinc-500 border-white/5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]"
              )}>
                {savedEvents.length}
              </span>
            </button>
          </div>

          {/* List Editor Selection Active Bar */}
          {listSelectMode && (
            <div className="shrink-0 p-3 bg-zinc-950/80 border border-white/10 rounded-2xl flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-primary font-mono uppercase tracking-wider">
                  {selectedListItems.length} Selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllListItems}
                    className="text-slate-400 hover:text-white transition-all underline cursor-pointer text-[9.5px]"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600 font-normal">|</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllListItems}
                    className="text-slate-400 hover:text-white transition-all underline cursor-pointer text-[9.5px]"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2">
                {leftActiveTab !== 'pipeline' && (
                  <button
                    type="button"
                    disabled={selectedListItems.length === 0 || loading}
                    onClick={handleBulkMoveToPipeline}
                    className="flex-1 py-1.5 px-2 bg-gradient-to-b from-teal-500 to-teal-605 hover:from-teal-400 hover:to-teal-500 text-white font-bold rounded-xl text-[10px] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1 shadow"
                  >
                    <Send className="h-3 w-3 text-white" />
                    <span>Move to Pipeline</span>
                  </button>
                )}

                {/* Transfer Lead Dropdown in Selection Mode */}
                <div className="relative flex-1">
                  <button
                    type="button"
                    disabled={selectedListItems.length === 0 || loading}
                    onClick={() => setIsTransferDropdownOpen(!isTransferDropdownOpen)}
                    className="w-full py-1.5 px-2 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold rounded-xl text-[10px] transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1 shadow"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin-slow text-white" />
                    <span>Transfer Lead</span>
                    <ChevronDown className="h-3 w-3 text-white shrink-0" />
                  </button>

                  {isTransferDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsTransferDropdownOpen(false)} />
                      <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl p-1 z-40 flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar select-none">
                        <div className="px-2.5 py-1 text-[8px] font-extrabold uppercase text-slate-500 tracking-wider border-b border-white/5 pb-1 mb-1">
                          Transfer to Project:
                        </div>
                        {projects.filter(p => p.projectId !== activeProjectId).length === 0 ? (
                          <div className="px-2.5 py-2 text-[10px] text-slate-500 italic text-center">
                            No other projects found
                          </div>
                        ) : (
                          projects
                            .filter(p => p.projectId !== activeProjectId)
                            .map(p => (
                              <button
                                key={p.projectId}
                                type="button"
                                onClick={() => {
                                  setIsTransferDropdownOpen(false);
                                  handleBulkTransferLeads(p.projectId, p.name);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer truncate"
                                title={p.name}
                              >
                                {p.name}
                              </button>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Tab Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {leftActiveTab === 'cue' && (
              <div className="flex-1 flex flex-col min-h-0">
                {cueSelectModeActive && (
                  <div className="shrink-0 p-3 mb-2 bg-primary/10 border border-primary/20 rounded-xl flex flex-col gap-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                        {selectedCueItems.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCueSelectModeActive(false);
                          setSelectedCueItems([]);
                        }}
                        className="text-[9px] text-slate-400 hover:text-white transition-all underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={selectedCueItems.length === 0 || loading}
                      onClick={handleRunCueSelectionScans}
                      className="w-full py-2 px-3 bg-primary hover:bg-secondary text-slate-900 font-bold rounded-lg text-xs transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <Zap className="h-3.5 w-3.5 fill-slate-900" />
                      Run {selectedCueItems.length} Scan{selectedCueItems.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}

                <div className={cn(
                  "flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 mt-1 rounded-xl p-1 transition-all duration-300",
                  (cueSelectModeActive || listSelectMode) ? "border-2 border-primary/30 bg-[#0c0d12]/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" : ""
                )}>
                  {filteredCue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center p-4 text-center select-none h-32">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No items cued</span>
                    </div>
                  ) : (
                    filteredCue.map((ev) => {
                      const isSelected = queryText.toLowerCase() === ev.eventName.toLowerCase();
                      const isCueItemSelected = selectedCueItems.some(c => c.cueId === ev.cueId);
                      const selectionIndex = selectedCueItems.findIndex(c => c.cueId === ev.cueId);
                      const isListSelected = selectedListItems.includes(ev.cueId);
                      const listSelectedIndex = selectedListItems.indexOf(ev.cueId);
                      return (
                        <div key={ev.cueId} className="relative group select-text">
                          <button
                            type="button"
                            onClick={() => {
                              if (cueSelectModeActive) {
                                handleToggleCueSelection(ev);
                              } else if (listSelectMode) {
                                handleToggleListItem(ev.cueId);
                              } else {
                                setQueryText(ev.eventName);
                                setSearchType(ev.searchType || 'event');
                                // Load from scanned list or saved events if available
                                const scanned = scannedList.find(s => s.eventName.toLowerCase() === ev.eventName.toLowerCase());
                                const saved = savedEvents.find(s => s.eventName.toLowerCase() === ev.eventName.toLowerCase());
                                if (scanned) {
                                  setResult(scanned);
                                } else if (saved) {
                                  setResult(saved);
                                } else {
                                  // Stub so the panel renders without needing a scan
                                  setResult({
                                    eventName: ev.eventName,
                                    website: ev.website || '',
                                    date: '',
                                    location: '',
                                    description: '',
                                    contacts: [],
                                    searchType: ev.searchType || 'event',
                                    isSandbox: ev.isSandbox || false,
                                  });
                                }
                              }
                            }}
                            className={cn(
                              "w-full text-left px-2.5 py-2 pr-12 rounded-lg text-[11px] transition-all flex items-center gap-2 border cursor-pointer select-text",
                              (cueSelectModeActive && isCueItemSelected) || (listSelectMode && isListSelected)
                                ? "bg-primary/20 border-primary text-white font-medium"
                                : !(cueSelectModeActive || listSelectMode) && isSelected 
                                ? "bg-primary/15 border-primary/40 text-white font-medium" 
                                : "bg-white/[0.01] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                            )}
                          >
                            {cueSelectModeActive && (
                              <div className={cn(
                                "w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all text-[9.5px] font-black",
                                isCueItemSelected
                                  ? "border-primary bg-primary text-slate-900"
                                  : "border-slate-500 hover:border-slate-400 text-transparent"
                              )}>
                                {isCueItemSelected ? (selectionIndex + 1) : null}
                              </div>
                            )}
                            {listSelectMode && (
                              <div className={cn(
                                "w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all text-[9.5px] font-black",
                                isListSelected
                                  ? "border-primary bg-primary text-slate-900"
                                  : "border-slate-500 hover:border-slate-400 text-transparent"
                              )}>
                                {isListSelected ? (listSelectedIndex + 1) : null}
                              </div>
                            )}
                            <span className="truncate w-full block font-semibold select-text">{ev.eventName}</span>
                          </button>
                          
                          {!(cueSelectModeActive || listSelectMode) && (
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
                                onClick={(e) => handleDeleteCueItem(ev.cueId, ev.eventName, e)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-500 rounded border border-red-500/20 cursor-pointer"
                                title="Remove from cue"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {leftActiveTab === 'scans' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5 mt-1">
                {filteredScans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center p-4 text-center select-none h-32">
                    <Search className="h-5 w-5 text-slate-700 mb-1.5" />
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">No scans finished yet</span>
                  </div>
                ) : (
                  filteredScans.map((ev) => {
                    const isSelected = result && (result.eventName.toLowerCase() === ev.eventName.toLowerCase());
                    const isInPipeline = savedEvents.some(s => s.eventName.toLowerCase() === ev.eventName.toLowerCase());
                    return (
                      <div key={ev.scanId} className="relative group select-text">
                        <button
                          type="button"
                          onClick={() => {
                            if (listSelectMode) {
                              handleToggleListItem(ev.scanId);
                            } else {
                              setResult(ev);
                              setQueryText(ev.eventName);
                              setSearchType(ev.searchType || 'event');
                            }
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 pr-8 rounded-lg text-xs transition-all flex items-center gap-2 border cursor-pointer select-text",
                            listSelectMode && selectedListItems.includes(ev.scanId)
                              ? "bg-primary/20 border-primary text-white font-medium"
                              : !listSelectMode && isSelected 
                              ? "bg-primary/10 border-primary/30 text-white font-medium" 
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                          )}
                        >
                          {listSelectMode && (
                            <div className={cn(
                              "w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all text-[9.5px] font-black",
                              selectedListItems.includes(ev.scanId)
                                ? "border-primary bg-primary text-slate-900"
                                : "border-slate-500 hover:border-slate-400 text-transparent"
                            )}>
                              {selectedListItems.includes(ev.scanId) ? (selectedListItems.indexOf(ev.scanId) + 1) : null}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
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
                              {ev.searchType === 'vendor' ? `HQ: ${ev.location} • ${formatDate(ev.date)}` : `${ev.location} • ${formatDate(ev.date)}`}
                            </span>
                            {ev.isSandbox && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[8px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded self-start select-none">
                                ⚠️ Sandbox Test
                              </span>
                            )}
                          </div>
                        </button>
                        {!listSelectMode && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleDeleteScannedEvent(ev.scanId, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                            title="Delete scan"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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
                            if (listSelectMode) {
                              handleToggleListItem(ev.eventId);
                            } else {
                              setResult(ev);
                              setQueryText(ev.eventName);
                              setSearchType(ev.searchType || 'event');
                            }
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-2 pr-8 rounded-lg text-xs transition-all flex items-center gap-2 border cursor-pointer select-text",
                            listSelectMode && selectedListItems.includes(ev.eventId)
                              ? "bg-primary/20 border-primary text-white font-medium"
                              : !listSelectMode && isSelected 
                              ? "bg-primary/10 border-primary/30 text-white font-medium" 
                              : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-white/10"
                          )}
                        >
                          {listSelectMode && (
                            <div className={cn(
                              "w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all text-[9.5px] font-black",
                              selectedListItems.includes(ev.eventId)
                                ? "border-primary bg-primary text-slate-900"
                                : "border-slate-500 hover:border-slate-400 text-transparent"
                            )}>
                              {selectedListItems.includes(ev.eventId) ? (selectedListItems.indexOf(ev.eventId) + 1) : null}
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="truncate w-full block font-semibold text-white select-text">{ev.eventName}</span>
                            <span className="text-[9px] text-slate-500 truncate w-full block select-text">
                              {ev.searchType === 'vendor' ? `HQ: ${ev.location} • ${formatDate(ev.date)}` : `${ev.location} • ${formatDate(ev.date)}`}
                            </span>
                            {ev.isSandbox && (
                              <span className="inline-flex items-center gap-1 mt-1 text-[8px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded self-start select-none">
                                ⚠️ Sandbox Test
                              </span>
                            )}
                          </div>
                        </button>
                        {!listSelectMode && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => handleDeleteSavedEvent(ev.eventId, e)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20"
                            title="Remove from pipeline"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
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
              readOnly
              placeholder="Select an item from Cue, Scans, or Pipeline from the left column..."
              value={queryText}
              className="w-full h-12 bg-zinc-900/50 glass border-white/10 rounded-xl px-4 text-sm text-white focus:outline-none placeholder:text-slate-600 font-semibold cursor-default select-text"
            />
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
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      setLeftActiveTab('cue');
                      setCueSelectModeActive(true);
                      setSelectedCueItems([]);
                    }}
                    className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-300 hover:bg-white/5 transition-all flex items-center gap-2 cursor-pointer font-bold border-t border-white/5 pt-2 mt-1"
                  >
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Select From Cue
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
                  className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer",
                    isSaved ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                  )}
                >
                  <Send className="h-3 w-3" />
                  <span>{isSaved ? "IN PIPELINE" : "MOVE TO PIPELINE"}</span>
                </button>

                {/* Transfer Lead Dropdown Button */}
                <div className="relative inline-block">
                  <button 
                    onClick={() => setIsTransferDropdownOpen(!isTransferDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3 animate-spin-slow" />
                    <span>TRANSFER LEAD</span>
                    <ChevronDown className="h-3 w-3 text-amber-400 shrink-0" />
                  </button>

                  {isTransferDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown on click outside */}
                      <div className="fixed inset-0 z-30" onClick={() => setIsTransferDropdownOpen(false)} />
                      <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl p-1 z-40 flex flex-col gap-0.5 max-h-60 overflow-y-auto custom-scrollbar select-none">
                        <div className="px-2.5 py-1 text-[8px] font-extrabold uppercase text-slate-500 tracking-wider border-b border-white/5 pb-1 mb-1">
                          Transfer to Project:
                        </div>
                        {projects.filter(p => p.projectId !== activeProjectId).length === 0 ? (
                          <div className="px-2.5 py-2 text-[10px] text-slate-500 italic text-center">
                            No other projects found
                          </div>
                        ) : (
                          projects
                            .filter(p => p.projectId !== activeProjectId)
                            .map(p => (
                              <button
                                key={p.projectId}
                                type="button"
                                onClick={() => {
                                  setIsTransferDropdownOpen(false);
                                  handleTransferLead(p.projectId, p.name);
                                }}
                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer truncate"
                                title={p.name}
                              >
                                {p.name}
                              </button>
                            ))
                        )}
                      </div>
                    </>
                  )}
                </div>

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
                          <span className="text-slate-400">Services:</span> {formatDate(result.date)}
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
                          {formatDate(result.date)}
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
                  <div className="flex flex-wrap items-center gap-3 relative select-none">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest">Contacts</h4>
                    </div>

                    {isSingleSelectionMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleVerifySelected}
                          disabled={isVerifyingLinkedIn || selectedContacts.length === 0}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 border border-primary/20",
                            selectedContacts.length === 0 || isVerifyingLinkedIn
                              ? "bg-slate-800 text-slate-400 cursor-not-allowed border-white/10"
                              : "bg-primary/20 hover:bg-primary/30 hover:border-primary/55 text-primary active:scale-[0.98] cursor-pointer"
                          )}
                        >
                          <Zap className="h-3 w-3 shrink-0 text-primary animate-pulse" />
                          <span>Verify Selected ({selectedContacts.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSingleSelectionMode(false);
                            setSelectedContacts([]);
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase bg-zinc-800 hover:bg-zinc-700 text-slate-300 border border-white/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => handleFirecrawlScrape()}
                            disabled={isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl || !result || !result.website}
                            className="px-3 py-1.5 rounded-l-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 border border-amber-500/25 border-r-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 active:scale-[0.98] cursor-pointer"
                          >
                            <Flame className="h-3 w-3 shrink-0 text-amber-500 animate-pulse" />
                            <span>{isScrapingFirecrawl ? "Scraping..." : "Site Scrape+"}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setIsScrapeDropdownOpen(!isScrapeDropdownOpen)}
                            disabled={isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl || !result}
                            className="px-2 py-1.5 rounded-r-lg text-[10px] font-bold tracking-wider transition-all border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 active:scale-[0.98] cursor-pointer border-l-white/10 flex items-center justify-center"
                          >
                            <ChevronDown className="h-3 w-3 text-amber-500 shrink-0 transition-transform duration-200" style={{ transform: isScrapeDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                          </button>

                          {isScrapeDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setIsScrapeDropdownOpen(false)} />
                              <div className="absolute left-0 mt-1 top-full w-64 rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl p-3 z-40 flex flex-col gap-2">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scrape Custom URL</div>
                                <div className="flex gap-1.5 items-center">
                                  <input
                                    type="url"
                                    placeholder="https://example.com/about"
                                    value={customScrapeUrl}
                                    onChange={(e) => setCustomScrapeUrl(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!customScrapeUrl) return;
                                      handleFirecrawlScrape(customScrapeUrl);
                                      setIsScrapeDropdownOpen(false);
                                      setCustomScrapeUrl('');
                                    }}
                                    disabled={!customScrapeUrl}
                                    className="p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Run Custom Scrape"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setIsToolDropdownOpen(!isToolDropdownOpen)}
                            disabled={isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl || !result || !result.contacts || result.contacts.length === 0}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all uppercase flex items-center gap-1.5 border border-primary/20 bg-primary/10 hover:bg-primary/25 hover:border-primary/40 text-primary active:scale-[0.98] cursor-pointer"
                          >
                            <Zap className="h-3 w-3 shrink-0 text-primary animate-pulse" />
                            <span>LinkedIn Tool</span>
                            <ChevronDown className="h-3 w-3 text-primary shrink-0 transition-transform duration-200" style={{ transform: isToolDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                          </button>

                          {isToolDropdownOpen && (
                            <>
                              {/* Backdrop to close dropdown on click outside */}
                              <div className="fixed inset-0 z-30" onClick={() => setIsToolDropdownOpen(false)} />
                              <div className="absolute left-0 mt-1.5 w-44 rounded-xl border border-white/10 bg-[#0e0f14] shadow-2xl p-1 z-40 flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSingleSelectionMode(true);
                                    setSelectedContacts([]);
                                    setIsToolDropdownOpen(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                >
                                  Single Contacts
                                </button>
                                 <button
                                    type="button"
                                    onClick={() => {
                                      setIsToolDropdownOpen(false);
                                      handleLinkedInVerify();
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                  >
                                    Current Contacts
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsToolDropdownOpen(false);
                                      handleFindMoreContacts();
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                                  >
                                    Find More Contacts
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsToolDropdownOpen(false);
                                      handleLinkedInCurrentAndFindMore();
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer border-t border-white/5 pt-1.5 mt-0.5"
                                  >
                                    Current & Find More
                                  </button>
                                </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono italic">Verification may take 1-3 minutes. Uses AI Credits.</span>
                  </div>
                </div>

                {verifyStatusMessage && (
                  <div className={cn(
                    "mb-3.5 p-3 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-all duration-300 border",
                    (isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl)
                      ? "bg-orange-500/10 border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.45)]"
                      : "bg-primary/10 border-primary/20"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2 w-2 shrink-0">
                        {isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl ? (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                        ) : null}
                        <span className={cn(
                          "relative inline-flex rounded-full h-2 w-2 animate-pulse",
                          (isVerifyingLinkedIn || isFindingMore || isScrapingFirecrawl) ? "bg-orange-500" : "bg-primary"
                        )}></span>
                      </span>
                      <span className="font-medium">{verifyStatusMessage}</span>
                    </div>
                  </div>
                )}

                {/* Contacts Sheet structured columns */}
                <div className={cn(
                  "border rounded-xl overflow-hidden bg-[#0c0d12] transition-all duration-300",
                  isSingleSelectionMode 
                    ? "border-primary/55 ring-2 ring-primary/40 shadow-[0_0_20px_rgba(244,63,94,0.08)] scale-[1.002]" 
                    : "border-white/5"
                )}>
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/10 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
                        {isSingleSelectionMode && <th className="p-3 pl-4 w-[6%] text-center">Select</th>}
                        <th className={cn("p-3 w-[18%]", isSingleSelectionMode ? "pl-2" : "pl-4")}>Role / Title</th>
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
                            {isSingleSelectionMode && (
                              <td className="p-3 text-center border-r border-white/5">
                                <div className="flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (selectedContacts.includes(idx)) {
                                        setSelectedContacts(selectedContacts.filter(i => i !== idx));
                                      } else {
                                        setSelectedContacts([...selectedContacts, idx]);
                                      }
                                    }}
                                    className={cn(
                                      "h-4 w-4 rounded-full border flex items-center justify-center transition-all cursor-pointer",
                                      selectedContacts.includes(idx)
                                        ? "bg-primary border-primary text-black"
                                        : "border-white/20 hover:border-white/40 bg-transparent text-transparent"
                                    )}
                                  >
                                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                                  </button>
                                </div>
                              </td>
                            )}
                            
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
                                <div className="whitespace-normal break-words cursor-text text-slate-300 select-text" title="Double click to edit">
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
                                <div className="flex items-center gap-1 cursor-text select-text" title="Double click cell or click edit icon to edit">
                                  {contact.social ? (
                                    <>
                                      <a 
                                        href={contact.social.startsWith('http') ? contact.social : `https://${contact.social}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline flex items-center gap-1 inline-flex text-primary font-sans font-medium text-[11px] truncate max-w-[80%]"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Linkedin className="h-2.5 w-2.5 shrink-0" />
                                        {contact.social.includes('linkedin.com/in/') 
                                          ? contact.social.split('linkedin.com/in/')[1]?.replace(/\/$/, '') || 'LinkedIn'
                                          : 'Profile'}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCell({ contactIdx: idx, fieldName: 'social' });
                                          setEditingValue(contact.social || '');
                                        }}
                                        className="p-1 hover:bg-white/10 text-slate-500 hover:text-white rounded transition-all cursor-pointer shrink-0 ml-auto"
                                        title="Edit social handle"
                                      >
                                        <Edit3 className="h-2.5 w-2.5" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-slate-700 font-sans italic">-</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCell({ contactIdx: idx, fieldName: 'social' });
                                          setEditingValue('');
                                        }}
                                        className="p-1 hover:bg-white/10 text-slate-500 hover:text-white rounded transition-all cursor-pointer shrink-0 ml-auto opacity-0 group-hover:opacity-100"
                                        title="Add social handle"
                                      >
                                        <Edit3 className="h-2.5 w-2.5" />
                                      </button>
                                    </>
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

                    </tbody>
                  </table>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[9.5px] text-slate-550 font-mono">Double-click any cell to edit inline</span>
                  {!isAddingContact && (
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Add Contact
                    </button>
                  )}
                </div>

                {/* Add Contact Form Panel */}
                {isAddingContact && (
                  <div className="mt-3 p-4 bg-[#0c0d12]/60 border border-primary/30 rounded-xl space-y-3">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-bold">New Contact</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Title / Role (e.g. CEO) *"
                        value={newContactRole}
                        onChange={(e) => setNewContactRole(e.target.value)}
                        className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Contact Name *"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Email Address"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                      />
                      <input
                        type="text"
                        placeholder="Social / LinkedIn URL"
                        value={newContactSocial}
                        onChange={(e) => setNewContactSocial(e.target.value)}
                        className="col-span-2 bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={submitNewContact}
                        className="px-4 py-2 bg-primary hover:bg-primary/80 text-slate-900 rounded-lg font-bold text-xs transition-all cursor-pointer"
                      >
                        Save Contact
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
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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

              {/* Note control row */}
              <div className="flex flex-col items-center justify-center py-4 bg-[#0c0d12]/40 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center gap-4">
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
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Submit Multiple Event Names to Scan</h3>
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
                {multipleScanInputs.map((val, idx) => {
                  const activeClaimedLeadsList = claimedLeads.filter(cl => !isClaimExpired(cl.claimedAt));
                  const matchingClaim = val.trim().length >= 2
                    ? activeClaimedLeadsList.find(cl => isLeadMatch({ eventName: val }, { eventName: cl.eventName, website: cl.website }))
                    : null;

                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-mono text-slate-600 w-5 text-right">{idx + 1}.</div>
                        <input
                          type="text"
                          placeholder={`e.g. CES 2026 or Event #${idx + 1}`}
                          value={val}
                          onChange={(e) => handleInputChange(idx, e.target.value)}
                          className={cn(
                            "flex-1 h-9 bg-zinc-900/50 border rounded-lg px-3 text-xs text-white outline-none placeholder:text-slate-600 transition-colors",
                            matchingClaim
                              ? "border-orange-500/50 focus:border-orange-500"
                              : "border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                          )}
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
                      {matchingClaim && (
                        <div className="ml-7 flex items-start gap-1.5 text-[11px] text-orange-400 font-medium bg-orange-500/10 p-2 rounded-lg border border-orange-500/25 shadow-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                          <span>
                            An event/vendor matching <strong>"{matchingClaim.eventName}"</strong> has already been claimed in the database.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center gap-3 pb-4 select-text">
                <button
                  type="button"
                  onClick={handleAddInputField}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-bold cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Entry
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
                  Scan Multi Events ({multipleScanInputs.filter(Boolean).length})
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0e0f14] border border-white/10 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Review & Import Scraped Contacts
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 pt-4">
              <div className="flex items-center justify-between mb-4 gap-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Select the contacts you want to add or enrich in your roster. Checked items will be committed to the database.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const allSelected = importModalContacts.every(c => c.selected);
                    setImportModalContacts(
                      importModalContacts.map(c => ({ ...c, selected: !allSelected }))
                    );
                  }}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border border-white/5 transition-all active:scale-[0.98] shrink-0"
                >
                  {importModalContacts.every(c => c.selected) ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 max-h-[400px]">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5 text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
                      <th className="p-2.5 w-[10%] text-center">Import</th>
                      <th className="p-2.5 w-[20%]">Name</th>
                      <th className="p-2.5 w-[22%]">Role/Title</th>
                      <th className="p-2.5 w-[30%]">Details</th>
                      <th className="p-2.5 w-[18%]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] divide-y divide-white/5">
                    {importModalContacts.map((contact, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setImportModalContacts(
                                  importModalContacts.map((c, i) => i === idx ? { ...c, selected: !c.selected } : c)
                                );
                              }}
                              className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                contact.selected
                                  ? "bg-primary border-primary text-black"
                                  : "border-white/20 hover:border-white/40 bg-transparent text-transparent"
                              )}
                            >
                              <Check className="h-2.5 w-2.5 stroke-[3]" />
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 font-semibold text-white truncate" title={contact.name}>{contact.name}</td>
                        <td className="p-2.5 text-slate-300 truncate" title={contact.role}>{contact.role}</td>
                        <td className="p-2.5 text-slate-400 font-mono text-[10px] truncate" title={[contact.email, contact.phone, contact.social].filter(Boolean).join(' | ')}>
                          {[contact.email, contact.phone, contact.social].filter(Boolean).join(' | ') || '-'}
                        </td>
                        <td className="p-2.5">
                          {contact.isNew ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/25">
                              New Contact
                            </span>
                          ) : (
                            <span 
                              className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/25 cursor-help"
                              title={`Fields to enrich: ${contact.enrichedFields?.join(', ')}`}
                            >
                              Enrich ({contact.enrichedFields?.length})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-primary hover:bg-secondary text-slate-900 rounded-xl text-xs font-bold shadow-lg shadow-primary/15 hover:shadow-primary/25 cursor-pointer"
                >
                  Import Selected ({importModalContacts.filter(c => c.selected).length})
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ResearchMode;

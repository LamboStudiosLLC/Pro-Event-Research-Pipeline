import React, { useState, useEffect, useRef } from 'react';
import { useFirebase } from './FirebaseProvider';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, query as fsQuery, onSnapshot, deleteDoc, getDocs, where, writeBatch } from 'firebase/firestore';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import {
  Search,
  MapPin,
  Calendar,
  Tag,
  Users,
  Briefcase,
  Sparkles,
  ExternalLink,
  Plus,
  Check,
  RefreshCw,
  Globe,
  Sliders,
  ChevronRight,
  ArrowRight,
  PenLine,
  Compass,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  X,
  Lock,
  ShieldAlert,
} from 'lucide-react';
import { Mode, ClaimedLead } from '@/src/types';
import { isLeadMatch, normalizeDomain, normalizeName, isClaimExpired } from '@/src/lib/leadMatching';

interface BrowseModeProps {
  activeProjectId: string | null;
  setMode: (mode: Mode) => void;
}

interface BrowseResult {
  eventName: string;
  website: string;
  servicesOffered: string;
  isSandbox?: boolean;
}

interface ResearchCueItem {
  cueId: string;
  eventName: string;
  website: string;
  servicesOffered: string;
  searchType: 'event' | 'vendor';
  createdAt: any;
  isSandbox?: boolean;
}

interface ParsedImportRow {
  eventName: string;
  website: string;
  servicesOffered: string;
  location: string;
  date: string;
  contactName: string;
  contactEmail: string;
  contactRole: string;
  searchType: 'event' | 'vendor';
  isDuplicate: boolean;
}

const SECTOR_CATEGORIES = [
  {
    name: "Technology",
    subcategories: [
      "Artificial intelligence and machine learning",
      "Consumer electronics",
      "Cybersecurity and digital trust",
      "Data and analytics",
      "Information technology",
      "Robotics and automation",
      "Software and SaaS",
      "Telecommunications",
      "Video and broadcasting"
    ]
  },
  {
    name: "Healthcare and Life Sciences",
    subcategories: [
      "Biotechnology",
      "Healthcare",
      "Life sciences",
      "Medical devices",
      "Mental health and wellness",
      "Pharma and pharmaceuticals"
    ]
  },
  {
    name: "Manufacturing and Industrial",
    subcategories: [
      "Chemical processing",
      "Industrial manufacturing",
      "Manufacturing",
      "Printing and packaging",
      "Textile and apparel",
      "Wholesale trade"
    ]
  },
  {
    name: "Energy and Environment",
    subcategories: [
      "Clean energy and climate tech",
      "Energy and utilities",
      "Mining and metals"
    ]
  },
  {
    name: "Construction and Infrastructure",
    subcategories: [
      "Building and construction",
      "Real estate and property",
      "Workplace safety"
    ]
  },
  {
    name: "Transportation and Mobility",
    subcategories: [
      "Aerospace and aviation",
      "Automotive",
      "Shipping and maritime",
      "Transportation and mobility"
    ]
  },
  {
    name: "Logistics and Supply Chain",
    subcategories: [
      "Logistics and supply chain"
    ]
  },
  {
    name: "Business, Finance, and Professional Services",
    subcategories: [
      "Banking and financial services",
      "Insurance",
      "Investment and private equity",
      "Legal services",
      "Professional services",
      "Tax and accounting",
      "Venture capital and private equity"
    ]
  },
  {
    name: "Marketing, Media, and Communications",
    subcategories: [
      "Marketing and advertising",
      "Entertainment and media",
      "Business services"
    ]
  },
  {
    name: "Retail, Consumer, and Commerce",
    subcategories: [
      "Beauty and cosmetics",
      "Food and beverage",
      "Luxury goods",
      "Retail and e-commerce",
      "Wine and spirits"
    ]
  },
  {
    name: "Agriculture and Food Systems",
    subcategories: [
      "Agriculture and agribusiness"
    ]
  },
  {
    name: "Education and Workforce",
    subcategories: [
      "Education technology",
      "Human resources and recruiting",
      "Women in business and leadership"
    ]
  },
  {
    name: "Security and Defense",
    subcategories: [
      "Defense and security",
      "Security and surveillance"
    ]
  },
  {
    name: "Tourism, Hospitality, and Events",
    subcategories: [
      "Hospitality and tourism",
      "Tourism and travel",
      "Event planning and venues",
      "Sports and recreation",
      "Wellness and fitness"
    ]
  },
  {
    name: "Startups and Innovation",
    subcategories: [
      "Startups and venture capital"
    ]
  }
];

const VENDOR_SECTOR_CATEGORIES = [
  { value: "venue/facilities", label: "Venue/Facilities" },
  { value: "production", label: "Production" },
  { value: "exhibitor services", label: "Exhibitor Services" },
  { value: "logistics", label: "Logistics" },
  { value: "hospitality", label: "Hospitality" },
  { value: "technology", label: "Technology" },
  { value: "safety/compliance", label: "Safety/Compliance" },
  { value: "marketing/media", label: "Marketing/Media" },
  { value: "staffing", label: "Staffing" }
];

export default function BrowseMode({ activeProjectId, setMode }: BrowseModeProps) {
  const { user } = useFirebase();
  const [searchType, setSearchType] = useState<'event' | 'vendor'>('event');
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAttendance, setMinAttendance] = useState(10);
  const [maxAttendance, setMaxAttendance] = useState(150000);
  const [eventType, setEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [location, setLocation] = useState('');
  const [servicesOffered, setServicesOffered] = useState('');
  const [category, setCategory] = useState('');
  const [attendanceRange, setAttendanceRange] = useState('');
  const [otherCriteria, setOtherCriteria] = useState('');
  
  const [results, setResults] = useState<BrowseResult[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [researchCue, setResearchCue] = useState<ResearchCueItem[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [simulationMode, setSimulationMode] = useState<boolean>(() => localStorage.getItem('research_sim_mode') === 'true');
  const [claimedLeads, setClaimedLeads] = useState<ClaimedLead[]>([]);

  const [browseSubTab, setBrowseSubTab] = useState<'discover' | 'manual' | 'import'>('discover');
  const [manualName, setManualName] = useState('');
  const [manualWebsite, setManualWebsite] = useState('');
  const [manualType, setManualType] = useState<'event' | 'vendor'>('event');
  const [manualServices, setManualServices] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<ParsedImportRow[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'preview' | 'importing' | 'done'>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const minPct = (minAttendance - 10) / (150000 - 10);
  const maxPct = (maxAttendance - 10) / (150000 - 10);

  // Load current research cue from Firestore in real-time
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
      setResearchCue(list);
    }, (error) => {
      console.warn("Error reading research cue:", error);
    });
    return () => unsubscribe();
  }, [user, activeProjectId]);

  // Subscribe to company-wide claimed leads
  useEffect(() => {
    const unsub = onSnapshot(fsQuery(collection(db, 'claimed_leads')), (snap) => {
      setClaimedLeads(snap.docs.map(d => ({ claimId: d.id, ...d.data() } as ClaimedLead)));
    });
    return () => unsub();
  }, []);

  const handleSearch = async (e?: React.FormEvent, isNextPage = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSearchTriggered(true);

    const nextPage = isNextPage ? page + 1 : 1;
    if (isNextPage) {
      setPage(nextPage);
    } else {
      setPage(1);
    }

    if (simulationMode) {
      // Simulate real-time API feel with custom responses based on filters
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        let mockResults = [];
        if (searchType === 'vendor') {
          const catLabel = category ? ` specializing in ${category}` : "";
          const svcLabel = servicesOffered ? ` supporting ${servicesOffered}` : "";
          const locLabel = location ? ` in ${location}` : "";
          mockResults = [
            { eventName: "Elite Expo Designs", website: "https://www.freeman.com", servicesOffered: `Premier event vendor${catLabel}${svcLabel}${locLabel}. Specialized in custom structural booths, high-end projection scaling, and regional compliance.` },
            { eventName: "Apex Production Group", website: "https://www.ges.com", servicesOffered: `Full-service event agency${locLabel} specializing in industrial tradeshows, interactive digital overlays, and premium staging.` },
            { eventName: "Vanguard Event Logistics", website: "https://www.hargroveinc.com", servicesOffered: `Global transport, modular structures, and fast-track custom fabrication layouts${catLabel}${locLabel}.` },
            { eventName: "NextGen Event Tech", website: "https://www.skyline.com", servicesOffered: `Advanced event tech, custom lightboxes, mobile tracking hubs, and immersive high-fidelity sound layouts${svcLabel}.` },
            { eventName: "Beacon Staffing Solutions", website: "https://www.shepardes.com", servicesOffered: `Qualified brand ambassadors, technical production supervisors, and hosts${locLabel} for custom sectors.` },
            { eventName: "Stellar Creative Spaces", website: "https://www.czarnowski.com", servicesOffered: `Award-winning brand architecture, pop-up structures, and immersive spatial experience setups.` },
            { eventName: "Matrix AV & Lighting", website: "https://www.wearesparks.com", servicesOffered: `Professional video scaling, audio engineering, smart lighting rigs, and dynamic projection mapping.` },
            { eventName: "Infinity Exhibitor Hub", website: "https://www.derse.com", servicesOffered: `Convenient modular displays, fabric backdrops, signage printing, and physical logistics setup.` },
            { eventName: "Nexus Brand Activations", website: "https://www.impact-xm.com", servicesOffered: `Experiential product launches, luxury goods display design, and corporate presentations support.` },
            { eventName: "SafeGuard Compliance", website: "https://www.nimlok.com", servicesOffered: `Workplace and venue safety advisors, health compliance officers, and electrical verification experts.` }
          ];
        } else {
          const catLabel = category ? ` (${category})` : "";
          const typeLabel = eventType ? eventType : "Convention";
          const locLabel = location ? ` at ${location}` : " Event Hub";
          const attLabel = `Target attendance: ${minAttendance.toLocaleString()} - ${maxAttendance.toLocaleString()}`;
          const dateDesc = (startDate || endDate) ? `Scheduled for ${startDate || 'soon'} to ${endDate || 'future'}` : "Annual Meeting";
          
          mockResults = [
            { eventName: `Global Tech & ${typeLabel}${catLabel}`, website: "https://www.ces.tech", servicesOffered: `Keynote innovation, expert speaker panels, deep dive research labs, and B2B matchmaking. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `National Sector Summit ${typeLabel}`, website: "https://www.rsaconference.com", servicesOffered: `Regional focus, trade exhibition aisles, technology previews, and collaborative partner networks. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Industry Leadership Forum`, website: "https://aws.amazon.com/reinvent/", servicesOffered: `Executive networking dinners, corporate strategy workshops, venture presentation opportunities. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `International Tradeshow Expo`, website: "https://www.sxsw.com", servicesOffered: `Consumer displays, hands-on product demonstrations, global product launches, and press galas. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Next-Gen Innovation Pavilion`, website: "https://www.mwcbarcelona.com", servicesOffered: `Startup showcase arenas, interactive gaming/tech zone, public demonstration stages. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Pioneer Development Congress`, website: "https://www.gartner.com", servicesOffered: `Technical bootcamps, developer sandboxes, hackathon arenas, and product architect consultations. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Synergy Corporate Tradeshow`, website: "https://www.salesforce.com/dreamforce/", servicesOffered: `Sales pipeline coaching, lead generation hubs, brand activations, and modular supplier layouts. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Alliance Annual Workshop`, website: "https://www.inbound.com", servicesOffered: `Peer-to-peer mentoring groups, interactive hands-on skill workshops, and certifications. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Apex Commerce & Tradeshow`, website: "https://www.shopify.com", servicesOffered: `Retail strategy summits, e-commerce integration hubs, logistics optimization roundtables. ${attLabel}. ${dateDesc}${locLabel}.` },
            { eventName: `Horizon Climate & Resource Expo`, website: "https://www.epa.gov", servicesOffered: `Sustainability focus workshops, green technology showcases, and environmental policy panels. ${attLabel}. ${dateDesc}${locLabel}.` }
          ];
        }

        // Add isSandbox flag to simulated results
        const withSandbox = mockResults.map(item => ({
          ...item,
          isSandbox: true
        }));

        // Include all results without filtering out claimed leads so users can see claimed state
        if (isNextPage) {
          const pageMock = withSandbox.map(item => ({
            ...item,
            eventName: `${item.eventName} (Page ${nextPage})`
          }));
          setResults(prev => [...prev, ...pageMock]);
        } else {
          setResults(withSandbox);
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Simulation mode failure.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchType,
          dateRange,
          location,
          servicesOffered,
          category,
          attendanceRange,
          otherCriteria,
          page: nextPage,
          startDate,
          endDate,
          minAttendance,
          maxAttendance,
          eventType,
          eventName,
          vendorName
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to browse list: server returned ${response.status}`);
      }

      const data = await response.json();
      if (data && data.results) {
        if (isNextPage) {
          setResults(prev => [...prev, ...data.results]);
        } else {
          setResults(data.results);
        }
      } else {
        throw new Error("Invalid results format returned from API.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred while connecting to the services network.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCue = async (item: BrowseResult) => {
    if (!user) return;
    
    // Automatically locate or create a project if activeProjectId isn't selected
    let targetProjectId = activeProjectId;
    if (!targetProjectId) {
      const name = prompt("Select or Create a Project to save your research cue.\nTo + Create a New Project, enter the name here:");
      if (!name || !name.trim()) return;
      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
          userId: user.uid,
          name: name.trim(),
          createdAt: serverTimestamp()
        });
        targetProjectId = docRef.id;
      } catch (err) {
        console.error("Failed to auto-create project:", err);
        return;
      }
    }

    const existing = researchCue.find(c => c.eventName.toLowerCase() === item.eventName.toLowerCase());
    if (existing) {
      // Unclaim: remove from cue and company claimed_leads registry
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'projects', targetProjectId, 'research_cue', existing.cueId));
        const claimSnap = await getDocs(fsQuery(
          collection(db, 'claimed_leads'),
          where('claimedBy', '==', user.uid),
          where('normalizedName', '==', normalizeName(item.eventName))
        ));
        await Promise.all(claimSnap.docs.map(d => deleteDoc(d.ref)));
      } catch (err) {
        console.error("Failed to unclaim lead:", err);
      }
    } else {
      // Claim: add to research cue and company claimed_leads registry
      try {
        await addDoc(collection(db, 'users', user.uid, 'projects', targetProjectId, 'research_cue'), {
          eventName: item.eventName,
          website: item.website || '',
          servicesOffered: item.servicesOffered || '',
          searchType: searchType,
          isSandbox: item.isSandbox || false,
          createdAt: serverTimestamp()
        });
        await addDoc(collection(db, 'claimed_leads'), {
          eventName: item.eventName,
          website: item.website || '',
          normalizedDomain: normalizeDomain(item.website || ''),
          normalizedName: normalizeName(item.eventName),
          searchType: searchType,
          claimedBy: user.uid,
          claimedByName: user.displayName || user.email || '',
          claimedAt: serverTimestamp(),
          status: 'Initial',
        });
      } catch (err) {
        console.error("Failed to claim lead:", err);
      }
    }
  };

  const get = (row: any, ...keys: string[]): string => {
    for (const k of keys) {
      const val = row[k];
      if (val !== undefined && val !== null && val !== '') return String(val).trim();
    }
    return '';
  };

  const parseImportFile = async (file: File) => {
    setImportStatus('parsing');
    setImportRows([]);
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const activeClaimedLeads = claimedLeads.filter(cl => !isClaimExpired(cl.claimedAt));

      const parsed: ParsedImportRow[] = raw
        .map(row => {
          const eventName = get(row, 'Event Name', 'Name', 'Title', 'Event');
          if (!eventName) return null;

          const website = get(row, 'Event Website', 'Organizer Website', 'Website', 'URL', 'Site');
          const categories = get(row, 'Event Categories', 'Categories', 'Sector', 'Industry');
          const eventType = get(row, 'Event Type', 'Type');
          const servicesOffered = [categories, eventType].filter(Boolean).join(' · ')
            || get(row, 'Description', 'Services', 'Focus', 'servicesOffered');

          const startRaw = get(row, 'Start Date', 'Forecasted Start Date', 'Date', 'Start');
          const endRaw = get(row, 'End Date', 'Forecasted End Date', 'End');
          // Strip time component if present (xlsx with cellDates gives ISO strings)
          const fmt = (s: string) => s.includes('T') ? s.split('T')[0] : s;
          const date = startRaw && endRaw && fmt(startRaw) !== fmt(endRaw)
            ? `${fmt(startRaw)} – ${fmt(endRaw)}`
            : fmt(startRaw);

          const city = get(row, 'City', 'Location');
          const country = get(row, 'Country');
          const location = [city, country].filter(Boolean).join(', ')
            || get(row, 'Venue Address', 'Address', 'Region');

          const contactName = get(row, 'Contact Person Name', 'Contact Name', 'Contact');
          const contactEmail = get(row, 'Contact Person Email', 'Contact Email', 'Email');
          const contactRole = get(row, 'Contact Person Designation', 'Designation', 'Role');

          const isDuplicate = activeClaimedLeads.some(cl =>
            isLeadMatch({ eventName, website }, { eventName: cl.eventName, website: cl.website })
          );

          return { eventName, website, servicesOffered, location, date, contactName, contactEmail, contactRole, searchType: 'event' as const, isDuplicate };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null) as ParsedImportRow[];

      setImportRows(parsed);
      setImportStatus('preview');
    } catch (err) {
      console.error('Failed to parse import file:', err);
      setImportStatus('idle');
      alert('Could not read that file. Make sure it is a valid .xlsx or .csv file.');
    }
  };

  const handleConfirmImport = async () => {
    const toImport = importRows.filter(r => !r.isDuplicate);
    if (!user || toImport.length === 0) return;

    let targetProjectId = activeProjectId;
    if (!targetProjectId) {
      const name = prompt("Enter a project name to import these leads into:");
      if (!name?.trim()) return;
      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
          userId: user.uid, name: name.trim(), createdAt: serverTimestamp(),
        });
        targetProjectId = docRef.id;
      } catch { return; }
    }

    setImportStatus('importing');
    setImportProgress(0);

    // 3 writes per lead (cue + claimed_lead + scan), so chunk at 160 to stay under 500 op limit
    const chunkSize = 160;
    let done = 0;

    for (let i = 0; i < toImport.length; i += chunkSize) {
      const chunk = toImport.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const row of chunk) {
        const contacts = row.contactName
          ? [{ name: row.contactName, role: row.contactRole, email: row.contactEmail, contactInfo: row.contactEmail }]
          : [];

        const cueRef = doc(collection(db, 'users', user.uid, 'projects', targetProjectId!, 'research_cue'));
        batch.set(cueRef, {
          eventName: row.eventName,
          website: row.website,
          servicesOffered: row.servicesOffered,
          searchType: row.searchType,
          isSandbox: false,
          createdAt: serverTimestamp(),
        });

        const claimRef = doc(collection(db, 'claimed_leads'));
        batch.set(claimRef, {
          eventName: row.eventName,
          website: row.website,
          normalizedDomain: normalizeDomain(row.website),
          normalizedName: normalizeName(row.eventName),
          searchType: row.searchType,
          claimedBy: user.uid,
          claimedByName: user.displayName || user.email || '',
          claimedAt: serverTimestamp(),
          status: 'Initial',
        });

        // Pre-populate scans so clicking the cue item loads all xlsx data instantly
        const scanId = encodeURIComponent(row.eventName.toLowerCase().replace(/[^a-z0-9]/g, '-')).slice(0, 100);
        const scanRef = doc(db, 'users', user.uid, 'projects', targetProjectId!, 'scans', scanId);
        batch.set(scanRef, {
          eventName: row.eventName,
          date: row.date,
          location: row.location,
          description: row.servicesOffered,
          contacts,
          website: row.website,
          logoUrl: '',
          notes: '',
          actionNotes: [],
          searchType: row.searchType,
          yearFounded: '',
          isSandbox: false,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
      done += chunk.length;
      setImportProgress(Math.round((done / toImport.length) * 100));
    }

    setImportStatus('done');
  };

  const resetImport = () => {
    setImportRows([]);
    setImportStatus('idle');
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !user) return;
    setManualSubmitting(true);

    let targetProjectId = activeProjectId;
    if (!targetProjectId) {
      const name = prompt("Enter a project name to save this lead to:");
      if (!name?.trim()) { setManualSubmitting(false); return; }
      try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'projects'), {
          userId: user.uid,
          name: name.trim(),
          createdAt: serverTimestamp(),
        });
        targetProjectId = docRef.id;
      } catch { setManualSubmitting(false); return; }
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'projects', targetProjectId, 'research_cue'), {
        eventName: manualName.trim(),
        website: manualWebsite.trim(),
        servicesOffered: manualServices.trim(),
        searchType: manualType,
        isSandbox: false,
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, 'claimed_leads'), {
        eventName: manualName.trim(),
        website: manualWebsite.trim(),
        normalizedDomain: normalizeDomain(manualWebsite.trim()),
        normalizedName: normalizeName(manualName.trim()),
        searchType: manualType,
        claimedBy: user.uid,
        claimedByName: user.displayName || user.email || '',
        claimedAt: serverTimestamp(),
        status: 'Initial',
      });
      setManualName('');
      setManualWebsite('');
      setManualServices('');
      setManualType('event');
      setManualSuccess(true);
      setTimeout(() => setManualSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to manually add lead:', err);
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full gap-6 select-text">
      {/* Criteria search box (Left panel) — hidden on Add Manually tab */}
      {browseSubTab === 'discover' && <aside className="w-full md:w-80 flex flex-col p-5 glass border-r shrink-0 rounded-2xl h-full overflow-hidden select-text">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <Sliders className="h-4 w-4 text-primary" />
          <h2 className="text-xs uppercase tracking-widest text-slate-400 font-bold">Search Criteria</h2>
        </div>

        <form onSubmit={(e) => handleSearch(e, false)} className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1 select-text">
          {/* Target type selection */}
          <div className="space-y-1.5 shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Search Target</span>
            <div className="grid grid-cols-2 gap-1 bg-zinc-950/45 p-1 rounded-xl border border-white/5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]">
              <button
                type="button"
                onClick={() => { setSearchType('event'); setCategory(''); }}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all border",
                  searchType === 'event'
                    ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200 hover:from-zinc-850 hover:to-zinc-900 hover:border-white/10"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Events</span>
              </button>
              <button
                type="button"
                onClick={() => { setSearchType('vendor'); setCategory(''); }}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all border",
                  searchType === 'vendor'
                    ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                    : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200 hover:from-zinc-850 hover:to-zinc-900 hover:border-white/10"
                )}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Vendors</span>
              </button>
            </div>
          </div>

          {/* Form fields depending on choice */}
          {searchType === 'event' ? (
            <div className="space-y-3 shrink-0">
              {/* Date Ranges */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-350 font-bold flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-sky-300" />
                  <span>Date Range</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 block mb-0.5">Start</span>
                    <input
                      type="date"
                      value={startDate}
                      title="Start date"
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50 text-white font-medium cursor-pointer"
                    />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 block mb-0.5">End</span>
                    <input
                      type="date"
                      value={endDate}
                      title="End date"
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary/50 text-white font-medium cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Range */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Attendance Range</label>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {minAttendance.toLocaleString()} - {maxAttendance.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-6 bg-zinc-950/60 rounded-lg border border-white/5 flex items-center px-1">
                  {/* Shared horizontal track */}
                  <div className="absolute left-3 right-3 h-1 bg-white/10 rounded-lg pointer-events-none" />
                  
                  {/* Highlighted portion */}
                  <div 
                    className="absolute h-1 bg-primary rounded-lg pointer-events-none"
                    style={{
                      left: `calc(12px + ${minPct} * (100% - 24px))`,
                      width: `calc(${maxPct - minPct} * (100% - 24px))`
                    }}
                  />
                  
                  {/* Min Slider */}
                  <input
                    type="range"
                    min="10"
                    max="150000"
                    step="50"
                    value={minAttendance}
                    title="Minimum attendance"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMinAttendance(Math.min(val, maxAttendance));
                    }}
                    className="absolute left-1.5 right-1.5 w-[calc(100%-12px)] h-1 bg-transparent appearance-none pointer-events-none outline-none z-10 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-zinc-950 [&::-moz-range-thumb]:cursor-pointer"
                  />
                  
                  {/* Max Slider */}
                  <input
                    type="range"
                    min="10"
                    max="150000"
                    step="50"
                    value={maxAttendance}
                    title="Maximum attendance"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setMaxAttendance(Math.max(val, minAttendance));
                    }}
                    className="absolute left-1.5 right-1.5 w-[calc(100%-12px)] h-1 bg-transparent appearance-none pointer-events-none outline-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-zinc-950 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-zinc-950 [&::-moz-range-thumb]:cursor-pointer"
                  />
                </div>
              </div>

              {/* Event Name */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Event Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. CES or Consumer Electronics Show"
                    value={eventName}
                    onChange={e => setEventName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
                  />
                </div>
              </div>

              {/* Event Type */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Event Type</label>
                <div className="relative">
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium cursor-pointer appearance-none pr-8"
                  >
                    <option value="">(All Types)</option>
                    <option value="Conference">Conference</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
                </div>
              </div>
            </div>
          ) : (
            /* Vendor Fields */
            <div className="space-y-3 shrink-0">
              {/* Vendor Name */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Vendor Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Freeman or GES"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
                  />
                </div>
              </div>

              {/* Services Offered */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Services Offered</label>
                <div className="relative">
                  <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. Custom fabrications, AV"
                    value={servicesOffered}
                    onChange={e => setServicesOffered(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-8 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="shrink-0">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Location / Region</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. Chicago, IL or Europe"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-8 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
              />
            </div>
          </div>

          {/* Sector Category */}
          <div className="shrink-0">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Sector Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium cursor-pointer appearance-none pr-8"
              >
                <option value="">Select Category / Sector...</option>
                {searchType === 'vendor' ? (
                  VENDOR_SECTOR_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value} className="bg-zinc-900 text-slate-200 text-xs">
                      {cat.label}
                    </option>
                  ))
                ) : (
                  SECTOR_CATEGORIES.map(sect => (
                    <optgroup key={sect.name} label={sect.name} className="bg-zinc-950 text-slate-400 text-[10px] font-bold mt-2">
                      <option value={sect.name} className="bg-zinc-900 text-slate-200 text-xs font-semibold">{sect.name} (General)</option>
                      {sect.subcategories.map(sub => (
                        <option key={sub} value={sub} className="bg-zinc-900 text-slate-300 text-xs pl-3">
                          ↳ {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</div>
            </div>
          </div>

          {/* Custom Search Keywords or extra specifications */}
          <div className="shrink-0">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-1">Other Search criteria</label>
            <textarea
              placeholder="e.g. B2B, premium budget level, corporate audience..."
              value={otherCriteria}
              onChange={e => setOtherCriteria(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium resize-none custom-scrollbar"
            />
          </div>

          {/* Submit Search Button */}
          <div className="mt-auto pt-4 shrink-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary/80 to-primary text-black py-2.5 px-4 rounded-xl font-bold cursor-pointer hover:from-primary hover:to-primary/95 text-xs transition-colors active:scale-98 disabled:opacity-50 disabled:pointer-events-none glow-primary select-none border border-primary/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Searching databases...</span>
                </>
              ) : (
                <>
                  <Search className="h-3.5 w-3.5" />
                  <span>Search {searchType === 'vendor' ? 'Vendors' : 'Events'}</span>
                </>
              )}
            </button>
          </div>

          {/* Sandbox Toggle Mode Button */}
          <div className="pt-2.5 border-t border-white/5 shrink-0">
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
              className="w-full text-center py-1.5 bg-white/[0.03] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded text-[9.5px] text-slate-400 hover:text-slate-200 transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              {simulationMode ? "⚡ Live Gemini API" : "🎨 Sandbox Mode"}
            </button>
          </div>
        </form>
      </aside>}

      {/* Results Workspace (Right panel) */}
      <main className="flex-1 overflow-hidden flex flex-col glass rounded-2xl h-full border border-white/10 select-text p-6">
        {/* Sub-tab toggle */}
        <div className="flex items-center gap-1 bg-zinc-950/50 border border-white/5 rounded-xl p-1 self-start mb-5 shrink-0">
          <button
            type="button"
            onClick={() => setBrowseSubTab('discover')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              browseSubTab === 'discover'
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            Discover
          </button>
          <button
            type="button"
            onClick={() => setBrowseSubTab('manual')}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              browseSubTab === 'manual'
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-slate-400 hover:text-white"
            )}
          >
            <PenLine className="h-3.5 w-3.5" />
            Add Manually
          </button>
          <button
            type="button"
            onClick={() => { setBrowseSubTab('import'); resetImport(); }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              browseSubTab === 'import'
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            Import File
          </button>
        </div>

        {browseSubTab === 'import' ? (
          <div className="flex-1 flex flex-col overflow-hidden gap-4">
            <div className="shrink-0">
              <h1 className="text-lg font-bold text-white leading-tight">Import from File</h1>
              <p className="text-xs text-slate-400 mt-1">Upload a .xlsx or .csv export (e.g. from 10Times) to bulk-add leads to your Research Cue.</p>
            </div>

            {/* Import workflow */}
            <div className="flex-1 flex flex-col overflow-hidden">
            {importStatus === 'idle' && (
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) parseImportFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl p-16 cursor-pointer transition-all",
                  isDragging
                    ? "border-primary/60 bg-primary/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                )}
              >
                <div className="p-4 bg-white/5 rounded-full border border-white/10">
                  <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">Drop your file here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse — .xlsx or .csv</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) parseImportFile(f); }}
                />
              </div>
            )}

            {/* Parsing */}
            {importStatus === 'parsing' && (
              <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium">Reading file...</span>
              </div>
            )}

            {/* Preview */}
            {importStatus === 'preview' && (() => {
              const dupes = importRows.filter(r => r.isDuplicate).length;
              const toImport = importRows.filter(r => !r.isDuplicate).length;
              return (
                <div className="flex-1 flex flex-col overflow-hidden gap-4">
                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-3 shrink-0">
                    <div className="glass rounded-xl p-3 border border-white/10 text-center">
                      <p className="text-xl font-bold text-white">{importRows.length}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rows Found</p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-white/10 text-center">
                      <p className="text-xl font-bold text-amber-300">{dupes}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Already Claimed</p>
                    </div>
                    <div className="glass rounded-xl p-3 border border-white/10 text-center">
                      <p className="text-xl font-bold text-green-300">{toImport}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Will Be Added</p>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div className="flex-1 overflow-auto custom-scrollbar rounded-xl border border-white/10">
                    <table className="w-full text-[10px]">
                      <thead className="bg-zinc-950/80 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider w-6"></th>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider">Name</th>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider">Website</th>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider">Location</th>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider">Date</th>
                          <th className="text-left px-3 py-2 text-slate-400 font-bold uppercase tracking-wider">Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.slice(0, 50).map((row, i) => (
                          <tr key={i} className={cn(
                            "border-t border-white/5",
                            row.isDuplicate ? "opacity-40" : "hover:bg-white/[0.02]"
                          )}>
                            <td className="px-3 py-2">
                              {row.isDuplicate && <span title="Already claimed"><AlertCircle className="h-3 w-3 text-amber-400" /></span>}
                            </td>
                            <td className="px-3 py-2 font-medium text-white max-w-[180px] truncate">{row.eventName}</td>
                            <td className="px-3 py-2 text-slate-400 font-mono max-w-[140px] truncate">{row.website.replace(/^https?:\/\/(www\.)?/, '')}</td>
                            <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate">{row.location}</td>
                            <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.date}</td>
                            <td className="px-3 py-2 text-slate-400 max-w-[130px] truncate">{row.contactName || '—'}</td>
                          </tr>
                        ))}
                        {importRows.length > 50 && (
                          <tr className="border-t border-white/5">
                            <td colSpan={6} className="px-3 py-2 text-center text-slate-500 italic">
                              ...and {importRows.length - 50} more rows
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={resetImport}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white font-semibold cursor-pointer transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={toImport === 0}
                      onClick={handleConfirmImport}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary/80 to-primary text-black py-2 px-4 rounded-xl font-bold cursor-pointer hover:from-primary hover:to-primary/95 text-xs transition-all disabled:opacity-50 disabled:pointer-events-none border border-primary/20"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Import {toImport} Lead{toImport !== 1 ? 's' : ''} to Research Cue
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Importing progress */}
            {importStatus === 'importing' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Importing leads...</span>
                    <span className="font-mono text-primary">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 border border-white/5">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Done */}
            {importStatus === 'done' && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                  <Check className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Import Complete</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {importRows.filter(r => !r.isDuplicate).length} leads added to your Research Cue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetImport}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-slate-300 hover:text-white font-semibold cursor-pointer transition-all"
                >
                  Import Another File
                </button>
              </div>
            )}
            </div>
          </div>
        ) : browseSubTab === 'manual' ? (
          <div className="flex-1 flex items-start justify-center pt-8 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-lg">
              <div className="mb-6">
                <h1 className="text-lg font-bold text-white leading-tight">Add a Lead Manually</h1>
                <p className="text-xs text-slate-400 mt-1">Know of a lead already? Add it directly to your Research Cue without running an AI search.</p>
              </div>
              <form onSubmit={handleManualAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Type</label>
                  <div className="grid grid-cols-2 gap-1 bg-zinc-950/45 p-1 rounded-xl border border-white/5">
                    {(['event', 'vendor'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setManualType(t)}
                        className={cn(
                          "py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all border",
                          manualType === t
                            ? "bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 border-t-white/75 border-x-white/20 border-b-black/80 text-white shadow-[0_4px_6px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.4)]"
                            : "bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/5 text-slate-400 hover:text-slate-200"
                        )}
                      >
                        {t === 'event' ? <Calendar className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />}
                        <span className="capitalize">{t === 'event' ? 'Events' : 'Vendors'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dreamforce 2026"
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Website</label>
                  <input
                    type="text"
                    placeholder="e.g. https://www.dreamforce.com"
                    value={manualWebsite}
                    onChange={e => setManualWebsite(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Description / Services</label>
                  <textarea
                    placeholder="Brief description, focus area, or services offered..."
                    value={manualServices}
                    onChange={e => setManualServices(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-white font-medium resize-none custom-scrollbar"
                  />
                </div>

                <button
                  type="submit"
                  disabled={manualSubmitting || !manualName.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary/80 to-primary text-black py-2.5 px-4 rounded-xl font-bold cursor-pointer hover:from-primary hover:to-primary/95 text-xs transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none border border-primary/20"
                >
                  {manualSubmitting ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /><span>Adding...</span></>
                  ) : manualSuccess ? (
                    <><Check className="h-3.5 w-3.5" /><span>Added to Research Cue!</span></>
                  ) : (
                    <><Plus className="h-3.5 w-3.5" /><span>Add to Research Cue</span></>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between border-b border-white/5 pb-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Criteria Database Search</h1>
            <p className="text-xs text-slate-400">Discover and push target entities to the official Research Cue.</p>
          </div>
          {results.length > 0 && (
            <div className="text-[10px] font-mono text-primary font-bold bg-primary/10 border border-primary/15 rounded-md px-2.5 py-1 select-none">
              SHOWING LISTINGS {results.length} ITEM(S) | PAGE {page}
            </div>
          )}
        </div>

        {/* Simulation Sandbox Status Indicator */}
        {simulationMode && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-center justify-between gap-4 shrink-0">
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

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 select-text">
          {loading && results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="relative mb-6">
                <motion.div 
                  className="w-16 h-16 rounded-full border border-primary/30 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                />
                <Search className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-white">Crawling index databases & directories...</p>
              <p className="text-xs text-slate-500 mt-2 max-w-sm">Cross-referencing global portal structures, press logs, and domain networks with Gemini search grounding...</p>
            </div>
          ) : errorMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500 mb-4 animate-bounce">
                <Tag className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search Retrieval Issue</h3>
              <p className="text-xs text-slate-400 mt-2 max-w-sm">{errorMessage}</p>
              <button 
                onClick={(e) => handleSearch(e, false)}
                className="mt-4 px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all text-xs rounded-lg text-slate-300 font-semibold cursor-pointer"
              >
                Retry Search
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="p-4 bg-zinc-950/60 rounded-full border border-white/5 mb-4 text-slate-600">
                <Globe className="h-8 w-8" />
              </div>
              {searchTriggered ? (
                <>
                  <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest">No matching results found</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">We could not retrieve any files matching your exact parameter fields. Try expanding date boundaries or locations.</p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-bold text-slate-350 uppercase tracking-widest">Enter Parameters & Search</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
                    Set filters on the left and trigger a criteria lookup. The system will retrieve the most trusted events or supplier agencies matching your requirements.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4 select-text">
              <div className="grid gap-3 select-text">
                {results.map((item, idx) => {
                  const isInCue = researchCue.some(c => c.eventName.toLowerCase() === item.eventName.toLowerCase());
                  const activeClaimedLeads = claimedLeads.filter(cl => !isClaimExpired(cl.claimedAt));
                  const claimedLeadMatch = activeClaimedLeads.find(cl => isLeadMatch(item, cl));
                  const isClaimedByOthers = !!claimedLeadMatch && !isInCue;

                  return (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.05, 0.4) }}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-text transition-all",
                        isClaimedByOthers
                          ? "bg-zinc-950/40 border-orange-500/30 opacity-65 italic"
                          : isInCue 
                            ? "bg-primary/5 border-primary/20 hover:border-primary/25" 
                            : "bg-zinc-950/20 border-white/15 hover:border-white/20"
                      )}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 select-text">
                        <div className="flex items-center gap-2 flex-wrap select-text">
                          <h3 className={cn(
                            "font-bold text-sm select-text truncate max-w-[300px] sm:max-w-md",
                            isClaimedByOthers ? "text-slate-400 font-normal" : "text-white"
                          )}>{item.eventName}</h3>
                          
                          {isClaimedByOthers && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-400 border border-orange-500/30 not-italic">
                              <ShieldAlert className="h-3 w-3 text-orange-400" />
                              <span>Already Claimed {claimedLeadMatch?.claimedByName ? `(${claimedLeadMatch.claimedByName})` : ''}</span>
                            </span>
                          )}

                          {item.website && (
                            <a 
                              href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              referrerPolicy="no-referrer"
                              className="text-primary hover:text-primary-dark transition-all flex items-center gap-0.5 text-[10px] font-mono select-none not-italic"
                              title={`Visit website for ${item.eventName}`}
                            >
                              <span>{item.website.replace(/^https?:\/\/(www\.)?/, '').substring(0, 24)}{item.website.length > 24 ? '...' : ''}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        <p className={cn("text-xs select-text leading-relaxed font-medium", isClaimedByOthers ? "text-slate-400" : "text-slate-350")}>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block mb-0.5 not-italic">Focus & Services</span>
                          {item.servicesOffered}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center select-none">
                        {isClaimedByOthers ? (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border select-none w-full sm:w-auto justify-center bg-orange-500/10 border-orange-500/25 text-orange-400 opacity-80 cursor-not-allowed not-italic shadow-sm"
                            title="This lead has already been claimed in the system and is unavailable."
                          >
                            <Lock className="h-3.5 w-3.5 text-orange-400" />
                            <span>Claimed</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleCue(item)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border select-none w-full sm:w-auto justify-center",
                              isInCue
                                ? "bg-primary/10 hover:bg-red-500/15 border-primary/25 text-primary hover:text-red-400 hover:border-red-500/30"
                                : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/15 text-slate-300 hover:text-white"
                            )}
                          >
                            {isInCue ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-primary" />
                                <span>Claimed</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5 text-slate-400" />
                                <span>Claim Lead</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Paginate Next 10 Results option */}
              <div className="pt-4 pb-8 flex justify-center select-none">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSearch(undefined, true)}
                  className="px-6 py-2.5 bg-zinc-900 border border-white/10 hover:border-primary/30 rounded-xl hover:bg-white/5 text-xs text-slate-300 hover:text-white font-bold tracking-tight transition-all active:scale-97 disabled:opacity-50 flex items-center gap-2 cursor-pointer select-none glow-primary-hover"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Retrieving results 11-20...</span>
                    </>
                  ) : (
                    <>
                      <span>Search Next 10 Results</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

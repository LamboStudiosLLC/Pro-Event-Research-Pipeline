import React, { useEffect, useState, useMemo } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { UserProfile, ClaimedLead } from '@/src/types';
import {
  Users, TrendingUp, CheckCircle, ChevronRight, Shield,
  ArrowLeft, Search, Filter, ExternalLink, Calendar, Globe
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const STATUS_COLORS: Record<string, string> = {
  'Initial':   'bg-slate-500/20 text-slate-300 border-slate-500/20',
  'Contacted': 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  'Responded': 'bg-teal-500/20 text-teal-300 border-teal-500/20',
};

// ─── Salesperson Detail View ────────────────────────────────────────────────

interface DetailViewProps {
  user: UserProfile;
  leads: ClaimedLead[];
  onBack: () => void;
}

const SalespersonDetail: React.FC<DetailViewProps> = ({ user, leads, onBack }) => {
  const [search, setSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'contacted' | 'not_contacted'>('all');

  const filtered = useMemo(() => {
    return leads
      .filter(l => {
        const matchesSearch =
          !search ||
          l.eventName.toLowerCase().includes(search.toLowerCase()) ||
          l.website.toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
          contactFilter === 'all' ||
          (contactFilter === 'contacted' && l.status !== 'Initial') ||
          (contactFilter === 'not_contacted' && l.status === 'Initial');
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const aTime = a.claimedAt?.toMillis?.() ?? 0;
        const bTime = b.claimedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
  }, [leads, search, contactFilter]);

  const contactedCount = leads.filter(l => l.status !== 'Initial').length;

  return (
    <div className="flex flex-col h-full space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
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
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Total Leads</p>
          <p className="text-xl font-bold text-white">{leads.length}</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Contacted</p>
          <p className="text-xl font-bold text-blue-300">{contactedCount}</p>
        </div>
        <div className="glass rounded-xl p-3 border border-white/10">
          <p className="text-xs text-slate-400 mb-1">Interested</p>
          <p className="text-xl font-bold text-green-300">
            {leads.filter(l => l.responseOutcome === 'Interested').length}
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/10 rounded-lg p-1">
          {(['all', 'not_contacted', 'contacted'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setContactFilter(f)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer",
                contactFilter === f
                  ? "bg-primary/20 text-primary"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {f === 'all' ? 'All' : f === 'not_contacted' ? 'Not Contacted' : 'Contacted'}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      <div className="flex-1 overflow-auto custom-scrollbar space-y-2 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No leads match your filters.
          </div>
        ) : (
          filtered.map(lead => (
            <motion.div
              key={lead.claimId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl glass border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white truncate">{lead.eventName}</p>
                  {lead.website && (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-primary hover:underline font-mono shrink-0"
                    >
                      <Globe className="h-2.5 w-2.5" />
                      {lead.website.replace(/^https?:\/\/(www\.)?/, '').substring(0, 28)}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{lead.searchType}</span>
                  {lead.claimedAt?.toDate && (
                    <span className="text-[10px] text-slate-600 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {lead.claimedAt.toDate().toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2.5 py-1 rounded-full border ml-4 shrink-0",
                STATUS_COLORS[lead.status] || STATUS_COLORS['Initial']
              )}>
                {lead.status || 'Initial'}
              </span>
            </motion.div>
          ))
        )}
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
        leads={getLeadsForUser(selectedUser.userId)}
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

import React, { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { useFirebase } from './FirebaseProvider';
import { ClaimedLead } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Trophy, Medal, Mail } from 'lucide-react';

// Start of the current week (Monday 00:00 local).
function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  date.setHours(0, 0, 0, 0);
  return date;
}

function tsToMillis(ts: any): number {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

const LeaderboardMode: React.FC = () => {
  const { user } = useFirebase();
  const [leads, setLeads] = useState<ClaimedLead[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'claimed_leads')), snap => {
      setLeads(snap.docs.map(d => ({ claimId: d.id, ...d.data() } as ClaimedLead)));
    }, err => console.error('leaderboard listen failed:', err));
    return () => unsub();
  }, []);

  const weekStart = useMemo(() => startOfWeek(), []);

  const ranked = useMemo(() => {
    const cutoff = weekStart.getTime();
    // Roster = everyone who has claimed any lead; count only this week's contacts
    // so reps with 0 still appear.
    const roster = new Map<string, { name: string; count: number }>();
    for (const l of leads) {
      if (!l.claimedBy) continue;
      const entry = roster.get(l.claimedBy) || { name: l.claimedByName || 'Unknown', count: 0 };
      if (l.claimedByName) entry.name = l.claimedByName;
      if (tsToMillis(l.contactedAt) >= cutoff) entry.count += 1;
      roster.set(l.claimedBy, entry);
    }
    return Array.from(roster.entries())
      .map(([uid, v]) => ({ uid, ...v }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [leads, weekStart]);

  const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 select-text">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />Leaderboard
        </h2>
        <p className="text-sm text-slate-400 mt-0.5">Leads contacted this week — since {weekLabel}</p>
      </div>

      {ranked.length === 0 ? (
        <div className="glass rounded-2xl border border-white/10 p-10 text-center text-slate-500">
          <Mail className="h-8 w-8 mx-auto mb-3 opacity-40" />
          No one has claimed any leads yet.
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {ranked.map((r, i) => {
            const isMe = r.uid === user?.uid;
            const hasMedal = i < 3 && r.count > 0;
            const medalColor = i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500';
            return (
              <div
                key={r.uid}
                className={cn(
                  'glass rounded-xl border p-4 flex items-center justify-between',
                  isMe ? 'border-primary/40 bg-primary/5' : 'border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn('w-8 flex justify-center font-bold', hasMedal ? medalColor : 'text-slate-500')}>
                    {hasMedal ? <Medal className="h-5 w-5" /> : `#${i + 1}`}
                  </span>
                  <span className="font-semibold text-white">
                    {r.name}
                    {isMe && <span className="text-primary text-xs ml-1.5">(you)</span>}
                  </span>
                </div>
                <span className="text-lg font-bold text-white">
                  {r.count} <span className="text-xs font-normal text-slate-400">lead{r.count !== 1 ? 's' : ''}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaderboardMode;

import React, { useEffect, useState, useRef } from 'react';
import { Mode, Project } from '@/src/types';
import { useFirebase } from './FirebaseProvider';
import { db, logout } from '@/src/lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import {
  Search,
  Layers,
  ChevronDown,
  Plus,
  LogOut,
  User as UserIcon,
  Zap,
  Trash2,
  Shield,
  Pencil,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface NavigationProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
}

const Navigation: React.FC<NavigationProps> = ({ mode, setMode, activeProjectId, setActiveProjectId }) => {
  const { user, profile } = useFirebase();
  const isAdmin = profile?.role === 'admin';
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const projectRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectRef.current && !projectRef.current.contains(event.target as Node)) {
        setIsProjectOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs = snapshot.docs.map(doc => ({
        projectId: doc.id,
        ...doc.data()
      } as Project));
      setProjects(projs);

      if (projs.length > 0) {
        setActiveProjectId(prev => {
          if (!prev || !projs.some(p => p.projectId === prev)) {
            return projs[0].projectId;
          }
          return prev;
        });
      }
    }, (error) => {
      console.error("Firestore projects snapshot error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateProject = async () => {
    if (!user) return;
    const name = prompt("Project Name?");
    if (!name) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'projects'), {
        userId: user.uid,
        name,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;
    if (!confirm("Are you sure you want to delete this project and all its scanned events? This action cannot be undone.")) return;

    try {
      // 1. Get all events in the project to delete them first
      const eventsRef = collection(db, 'users', user.uid, 'projects', projId, 'events');
      const eventsSnapshot = await getDocs(query(eventsRef));
      const deletePromises = eventsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 2. Delete the project document itself
      const projectRef = doc(db, 'users', user.uid, 'projects', projId);
      await deleteDoc(projectRef);

      // 3. Clear activeProjectId if the deleted project was active
      if (activeProjectId === projId) {
        const remaining = projects.filter(p => p.projectId !== projId);
        if (remaining.length > 0) {
          setActiveProjectId(remaining[0].projectId);
        } else {
          setActiveProjectId(null);
        }
      }
    } catch (e) {
      console.error("Error deleting project:", e);
      alert("Error deleting project: " + (e as Error).message);
    }
  };

  const handleRenameProject = async (projId: string, currentName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;
    const newName = prompt("Rename project:", currentName);
    if (!newName || newName.trim() === currentName) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'projects', projId), { name: newName.trim() });
    } catch (e) {
      console.error("Error renaming project:", e);
    }
  };

  const activeProject = projects.find(p => p.projectId === activeProjectId);

  return (
    <nav className="h-16 flex items-center justify-between px-6 border-b border-white/10 glass shrink-0 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-8 h-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-slate-900">P</div>
          <h1 className="text-lg font-semibold tracking-tight text-white">Pro Event Research <span className="text-primary">Pipeline</span></h1>
        </div>

        <div className="flex items-center bg-zinc-900/80 rounded-full p-1 border border-white/5">
          <button
            type="button"
            onClick={() => setMode('browse')}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer",
              mode === 'browse' ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "text-slate-400 hover:text-white"
            )}
          >
            Get Leads
          </button>
          <button
            type="button"
            onClick={() => setMode('research')}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer",
              mode === 'research' ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "text-slate-400 hover:text-white"
            )}
          >
            Refine Leads
          </button>
          <button
            type="button"
            onClick={() => setMode('pipeline')}
            className={cn(
              "px-4 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer",
              mode === 'pipeline' ? "bg-primary/20 text-primary ring-1 ring-primary/50" : "text-slate-400 hover:text-white"
            )}
          >
            Track Leads
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 h-full">
        {isAdmin && (
          <button
            type="button"
            onClick={() => setMode('admin')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
              mode === 'admin'
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            <Shield className="h-3.5 w-3.5" />
            Admin Dashboard
          </button>
        )}

        <div ref={projectRef} className="relative h-full flex items-center">
          <button
            type="button"
            onClick={() => setIsProjectOpen(!isProjectOpen)}
            className="flex items-center gap-2 cursor-pointer group text-sm"
          >
            <span className="text-slate-400 group-hover:text-white">
              {activeProject ? activeProject.name : "My Projects"}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          <AnimatePresence>
            {isProjectOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-3 w-56 bg-[#0e0f14] p-2 rounded-xl shadow-2xl border border-white/10 z-50"
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                  {projects.map(p => (
                    <div
                      key={p.projectId}
                      onClick={() => {
                        setActiveProjectId(p.projectId);
                        setIsProjectOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all group cursor-pointer border border-transparent",
                        activeProjectId === p.projectId
                          ? "bg-primary/20 text-primary border-primary/20"
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="truncate pr-2 font-medium">{p.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleRenameProject(p.projectId, p.name, e)}
                          className="p-1 rounded bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10 cursor-pointer"
                          title="Rename project"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProject(p.projectId, e)}
                          className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/25 cursor-pointer"
                          title="Delete project"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-white/5 my-2" />
                <button
                  onClick={handleCreateProject}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-white/5 transition-all text-left"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={profileRef} className="relative h-full flex items-center">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs overflow-hidden cursor-pointer"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="profile" referrerPolicy="no-referrer" />
            ) : (
              user?.email?.substring(0, 2).toUpperCase() || 'JD'
            )}
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full right-0 mt-3 w-48 bg-[#0e0f14] p-2 rounded-xl shadow-2xl border border-white/10 z-50"
              >
                <div className="px-3 py-2 text-[10px] text-slate-500 truncate mb-1">
                  {user?.email}
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/5 transition-all text-left font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

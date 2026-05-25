import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from '@/src/components/FirebaseProvider';
import { Mode } from '@/src/types';
import Navigation from '@/src/components/Navigation';
import ResearchMode from '@/src/components/ResearchMode';
import BrowseMode from '@/src/components/BrowseMode';
import PipelineMode from '@/src/components/PipelineMode';
import { motion } from 'motion/react';
import { LogIn, Zap } from 'lucide-react';
import { signInWithGoogle } from '@/src/lib/firebase';
import { cn } from '@/src/lib/utils';

const AppContent = () => {
  const { user, loading } = useFirebase();
  const [mode, setMode] = useState<Mode>('browse');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  if (loading) return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Zap className="h-10 w-10 text-primary" />
      </motion.div>
    </div>
  );

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass max-w-md w-full p-8 rounded-3xl text-center glow-primary"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Zap className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">Pro Event Research Pipeline</h1>
          <p className="text-gray-400 mb-8">AI-powered event intelligence and sales pipeline acceleration.</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all active:scale-95"
          >
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col mesh-bg text-slate-200 overflow-hidden font-sans">
      <Navigation 
        mode={mode} 
        setMode={setMode} 
        activeProjectId={activeProjectId}
        setActiveProjectId={setActiveProjectId}
      />
      
      <main className="flex-1 overflow-hidden relative pt-16">
        <div className="h-full w-full max-w-7xl mx-auto p-6 overflow-hidden flex flex-col relative">
          <div className={cn(
            "flex-1 overflow-auto custom-scrollbar flex flex-col transition-all duration-300 absolute inset-6",
            mode === 'browse' ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-95 z-0 pointer-events-none"
          )}>
            <BrowseMode activeProjectId={activeProjectId} setMode={setMode} />
          </div>

          <div className={cn(
            "flex-1 overflow-auto custom-scrollbar flex flex-col transition-all duration-300 absolute inset-6",
            mode === 'research' ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-95 z-0 pointer-events-none"
          )}>
            <ResearchMode activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} />
          </div>

          <div className={cn(
            "flex-1 overflow-auto custom-scrollbar flex flex-col transition-all duration-300 absolute inset-6",
            mode === 'pipeline' ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-95 z-0 pointer-events-none"
          )}>
            <PipelineMode activeProjectId={activeProjectId} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

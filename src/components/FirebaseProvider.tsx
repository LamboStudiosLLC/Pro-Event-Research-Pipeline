import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '@/src/types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
}

const FirebaseContext = createContext<FirebaseContextType>({ user: null, loading: true, profile: null });

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            userId: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email || '',
            photoURL: user.photoURL || undefined,
            role: 'salesperson',
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        } else {
          const data = userDoc.data() as UserProfile;
          // Backfill missing fields for existing users
          const updates: Partial<UserProfile> = {};
          if (!data.role) updates.role = 'salesperson';
          if (!data.displayName) updates.displayName = user.displayName || user.email || '';
          if (Object.keys(updates).length > 0) {
            await setDoc(userRef, updates, { merge: true });
            setProfile({ ...data, ...updates });
          } else {
            setProfile(data);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider value={{ user, loading, profile }}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};

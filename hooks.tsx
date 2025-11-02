// Combined hooks to resolve build issues with module resolution

import React, { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { Player, AllStats, GameRecord, Tournament } from './types';

// --- from useLocalStorageState.ts (now internal, not exported) ---
function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue) {
        const item = JSON.parse(storedValue);
        
        if (Array.isArray(defaultValue) && !Array.isArray(item)) {
          console.warn(`LocalStorage for key "${key}" is not an array, resetting to default.`);
          return defaultValue;
        }

        return item ?? defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state]);

  return [state, setState];
}

// --- from useTheme.ts ---
export type Theme = 'deep-teal' | 'arctic-light' | 'crimson-night' | 'sunset-orange' | 'cyber-violet';

const THEME_COLORS: Record<Theme, string> = {
    'deep-teal': '#10b981',
    'arctic-light': '#3b82f6',
    'crimson-night': '#dc2626',
    'sunset-orange': '#f97316',
    'cyber-violet': '#a855f7',
};

export function useTheme(): [Theme, Dispatch<SetStateAction<Theme>>] {
    const [theme, setTheme] = useLocalStorageState<Theme>('scoreCounter:theme', 'deep-teal');

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
        }
    }, [theme]);

    return [theme, setTheme];
}

// --- from useAppData.ts ---
type SyncStatus = 'local' | 'syncing' | 'synced';

// Helper to get all local data at once for migration
const getLocalData = () => {
    const players = JSON.parse(localStorage.getItem('scoreCounter:players') || '[]');
    const stats = JSON.parse(localStorage.getItem('scoreCounter:stats') || '{}');
    const completedGamesLog = JSON.parse(localStorage.getItem('scoreCounter:gameLog') || '[]');
    const tournaments = JSON.parse(localStorage.getItem('scoreCounter:tournaments') || '[]');
    return { players, stats, completedGamesLog, tournaments };
};

export const useAppData = () => {
    const { user } = useAuth();
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
    const migrationCompletedRef = React.useRef(false);

    // Local state as fallback
    const [localPlayers, setLocalPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
    const [localStats, setLocalStats] = useLocalStorageState<AllStats>('scoreCounter:stats', {});
    const [localGameLog, setLocalGameLog] = useLocalStorageState<GameRecord[]>('scoreCounter:gameLog', []);
    const [localTournaments, setLocalTournaments] = useLocalStorageState<Tournament[]>('scoreCounter:tournaments', []);
    const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);

    // Cloud-synced state
    const [players, setPlayers] = useState<Player[]>(localPlayers);
    const [stats, setStats] = useState<AllStats>(localStats);
    const [completedGamesLog, setCompletedGamesLog] = useState<GameRecord[]>(localGameLog);
    const [tournaments, setTournaments] = useState<Tournament[]>(localTournaments);

    const updateCloudData = useCallback(async (data: any) => {
        if (user) {
            try {
                setSyncStatus('syncing');
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, data, { merge: true });
                setSyncStatus('synced');
            } catch (error) {
                console.error("Error updating cloud data:", error);
                setSyncStatus('local'); // Revert status on error
            }
        }
    }, [user]);

    // Effect for handling data synchronization and migration
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);

            const handleMigration = async () => {
                if (migrationCompletedRef.current) return;
                migrationCompletedRef.current = true;
                
                setSyncStatus('syncing');
                const docSnap = await getDoc(userDocRef);

                if (!docSnap.exists()) {
                    // User is new, migrate local data to cloud
                    const localData = getLocalData();
                    if (localData.players.length > 0 || Object.keys(localData.stats).length > 0) {
                        await setDoc(userDocRef, localData);
                    }
                }
                setSyncStatus('synced');
            };

            handleMigration();
            
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    setPlayers(data.players || []);
                    setStats(data.stats || {});
                    setCompletedGamesLog(data.completedGamesLog || []);
                    setTournaments(data.tournaments || []);
                }
            }, (error) => {
                console.error("Error with Firestore snapshot:", error);
            });

            return () => unsubscribe();
        } else {
            // User signed out, reset to local data
            migrationCompletedRef.current = false;
            setSyncStatus('local');
            setPlayers(localPlayers);
            setStats(localStats);
            setCompletedGamesLog(localGameLog);
            setTournaments(localTournaments);
        }
    }, [user, localPlayers, localStats, localGameLog, localTournaments]);

    const AppDataSetters = {
        setPlayers: (updater: React.SetStateAction<Player[]>) => {
            const newValue = typeof updater === 'function' ? updater(players) : updater;
            if (user) {
                updateCloudData({ players: newValue });
            } else {
                setLocalPlayers(newValue);
            }
            setPlayers(newValue);
        },
        setStats: (updater: React.SetStateAction<AllStats>) => {
            const newValue = typeof updater === 'function' ? updater(stats) : updater;
            if (user) {
                updateCloudData({ stats: newValue });
            } else {
                setLocalStats(newValue);
            }
            setStats(newValue);
        },
        setCompletedGamesLog: (updater: React.SetStateAction<GameRecord[]>) => {
            const newValue = typeof updater === 'function' ? updater(completedGamesLog) : updater;
            if (user) {
                updateCloudData({ completedGamesLog: newValue });
            } else {
                setLocalGameLog(newValue);
            }
            setCompletedGamesLog(newValue);
        },
        setTournaments: (updater: React.SetStateAction<Tournament[]>) => {
            const newValue = typeof updater === 'function' ? updater(tournaments) : updater;
            if (user) {
                updateCloudData({ tournaments: newValue });
            } else {
                setLocalTournaments(newValue);
            }
            setTournaments(newValue);
        },
        // lastPlayedPlayerIds is local-only for now as it's device-specific
        setLastPlayedPlayerIds
    };

    return {
        players,
        stats,
        completedGamesLog,
        tournaments,
        lastPlayedPlayerIds,
        ...AppDataSetters,
        syncStatus
    };
};

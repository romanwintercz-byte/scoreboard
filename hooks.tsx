import { useState, useEffect, Dispatch, SetStateAction } from 'react';
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
        let item = JSON.parse(storedValue);
        
        if (Array.isArray(defaultValue) && !Array.isArray(item)) {
          console.warn(`LocalStorage for key "${key}" is not an array, resetting to default.`);
          return defaultValue;
        }

        // --- Data Migration ---
        if (key === 'scoreCounter:tournaments' && Array.isArray(item)) {
            item = item.map((t: any) => {
                if (typeof t === 'object' && t !== null && !t.format) {
                    return { ...t, format: 'round-robin' };
                }
                return t;
            });
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

// Fix: Export AppDataHook type to be used in other components.
export type AppDataHook = {
    players: Player[];
    setPlayers: Dispatch<SetStateAction<Player[]>>;
    stats: AllStats;
    setStats: Dispatch<SetStateAction<AllStats>>;
    completedGamesLog: GameRecord[];
    setCompletedGamesLog: Dispatch<SetStateAction<GameRecord[]>>;
    tournaments: Tournament[];
    setTournaments: Dispatch<SetStateAction<Tournament[]>>;
    lastPlayedPlayerIds: string[];
    setLastPlayedPlayerIds: Dispatch<SetStateAction<string[]>>;
};

// --- Custom hook to manage all app data stored in localStorage ---
export const useAppData = (): AppDataHook => {
    const [players, setPlayers] = useLocalStorageState<Player[]>('scoreCounter:players', []);
    const [stats, setStats] = useLocalStorageState<AllStats>('scoreCounter:stats', {});
    const [completedGamesLog, setCompletedGamesLog] = useLocalStorageState<GameRecord[]>('scoreCounter:gameLog', []);
    const [tournaments, setTournaments] = useLocalStorageState<Tournament[]>('scoreCounter:tournaments', []);
    const [lastPlayedPlayerIds, setLastPlayedPlayerIds] = useLocalStorageState<string[]>('scoreCounter:lastPlayedPlayerIds', []);

    return {
        players,
        setPlayers,
        stats,
        setStats,
        completedGamesLog,
        setCompletedGamesLog,
        tournaments,
        setTournaments,
        lastPlayedPlayerIds,
        setLastPlayedPlayerIds,
    };
};


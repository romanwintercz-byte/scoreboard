import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Merged from useLocalStorageState.ts to resolve build issues
export function useLocalStorageState<T>(
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

import { useEffect, Dispatch, SetStateAction } from 'react';
import { useLocalStorageState } from './useLocalStorageState.ts';

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


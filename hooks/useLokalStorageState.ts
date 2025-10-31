import { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';

/**
 * A custom React hook to manage state that persists in localStorage.
 * This version is designed to be safe for Server-Side Rendering (SSR) and to prevent
 * hydration mismatches. It correctly persists all state changes, including when
 * the state is set back to its default value.
 *
 * @param key The key to use in localStorage.
 * @param defaultValue The default value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(defaultValue);

  // A ref to track if we have successfully hydrated the state from localStorage.
  // This prevents us from writing the initial defaultValue back to localStorage
  // before we've had a chance to read the existing value.
  const isHydrated = useRef(false);

  // Effect 1: Hydrate state from localStorage on initial client-side render.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        setState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    
    // Mark hydration as complete AFTER the first attempt to read.
    isHydrated.current = true;
    
  }, [key]);

  // Effect 2: Persist state changes to localStorage.
  useEffect(() => {
    // Only run this effect on the client AND after initial hydration.
    if (typeof window === 'undefined' || !isHydrated.current) {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;

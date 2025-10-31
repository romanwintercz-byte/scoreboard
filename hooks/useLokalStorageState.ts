import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom React hook to manage state that persists in localStorage.
 * This version is designed to be safe for Server-Side Rendering (SSR) and to prevent
 * hydration mismatches in frameworks like Next.js or during build processes on platforms like Vercel.
 *
 * @param key The key to use in localStorage.
 * @param defaultValue The default value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  // 1. Initialize state with the defaultValue.
  // This is crucial to ensure that the server-rendered output and the initial
  // client-side render are identical, preventing a React hydration mismatch warning.
  const [state, setState] = useState<T>(defaultValue);

  // 2. First effect: Hydrate the state from localStorage on component mount.
  // This effect runs ONLY on the client, after the initial render.
  useEffect(() => {
    // We only access localStorage on the client.
    if (typeof window === 'undefined') {
        return;
    }
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        // If a value was found, parse it and update the state.
        setState(JSON.parse(storedValue));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    // The dependency array with an empty array ensures this runs only once on mount.
  }, [key]);

  // 3. Second effect: Save the state back to localStorage whenever it changes.
  useEffect(() => {
    // We only access localStorage on the client.
    if (typeof window === 'undefined') {
        return;
    }
    // We only start saving to localStorage AFTER the initial state has been set
    // to something other than the default. This check prevents overwriting an existing
    // localStorage value with the defaultValue on initial load.
    if (state !== defaultValue) {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error)            {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }
  }, [key, state, defaultValue]);

  return [state, setState];
}

export default useLocalStorageState;
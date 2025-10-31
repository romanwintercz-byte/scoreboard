import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(() => {
    // Check if we are in a browser environment before accessing localStorage.
    // This makes the hook safe for server-side rendering (SSR) and build processes.
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const storedValue = localStorage.getItem(key);
      // If a value exists in localStorage, parse it. Otherwise, use the provided default.
      return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  });

  // This effect synchronizes the state with localStorage whenever the state changes.
  useEffect(() => {
    // Also check for window here to be extra safe, though useEffect only runs on the client.
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;


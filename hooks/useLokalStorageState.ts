import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  
  const [state, setState] = useState<T>(() => {
    // This initializer function runs only on the client during the initial render,
    // making it safe for environments where localStorage might not be available during build time.
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
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;

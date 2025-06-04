
import { useState, useEffect } from 'react';

// Helper function remains the same for reading, but its usage in useState initializer changes.
function getValueFromLocalStorage<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') {
    return initialValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state with initialValue on both server and client for first render.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    // This effect runs only on the client, after initial hydration.
    // Read from localStorage and update the state.
    const item = window.localStorage.getItem(key);
    if (item !== null) { // Check if item actually exists
      try {
        const localValue = JSON.parse(item);
        setStoredValue(localValue);
      } catch (error) {
        console.error(`Error parsing localStorage key "${key}":`, error);
        // If parsing fails, storedValue remains initialValue or its last valid state.
        // Optionally, could set back to initialValue: setStoredValue(initialValue);
      }
    }
    // If item is null, it means nothing is in localStorage for this key,
    // so storedValue (initialized to initialValue) is correct.
  }, [key]); // Rerun if key changes. initialValue is not needed as a dep here.

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      // window check is still good practice, though setValue is typically called client-side.
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

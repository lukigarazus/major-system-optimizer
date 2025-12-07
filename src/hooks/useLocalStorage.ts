import { useState, useEffect } from 'react'

/**
 * Custom hook that syncs state with localStorage
 * Similar to useState but persists data across page refreshes
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  namespace?: string
): [T, (value: T | ((prev: T) => T)) => void] {
  // Construct the full key with namespace if provided
  const fullKey = namespace ? `${key}-${namespace}` : key

  // Get initial value from localStorage or use provided default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(fullKey)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${fullKey}":`, error)
      return initialValue
    }
  })

  // Update localStorage whenever the state changes
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function (like useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(fullKey, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${fullKey}":`, error)
    }
  }

  // Re-initialize when namespace changes (e.g., when switching tabs)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(fullKey)
      setStoredValue(item ? JSON.parse(item) : initialValue)
    } catch (error) {
      console.error(`Error reading localStorage key "${fullKey}":`, error)
      setStoredValue(initialValue)
    }
  }, [fullKey])

  return [storedValue, setValue]
}

/**
 * Hook for Map objects that need special serialization
 */
export function useLocalStorageMap<K, V>(
  key: string,
  initialValue: Map<K, V>,
  namespace?: string
): [Map<K, V>, (value: Map<K, V> | ((prev: Map<K, V>) => Map<K, V>)) => void] {
  // Construct the full key with namespace if provided
  const fullKey = namespace ? `${key}-${namespace}` : key

  const [storedValue, setStoredValue] = useState<Map<K, V>>(() => {
    try {
      const item = window.localStorage.getItem(fullKey)
      if (item) {
        const parsed = JSON.parse(item)
        return new Map(parsed)
      }
      return initialValue
    } catch (error) {
      console.error(`Error reading localStorage Map key "${fullKey}":`, error)
      return initialValue
    }
  })

  const setValue = (value: Map<K, V> | ((prev: Map<K, V>) => Map<K, V>)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      // Convert Map to array of entries for JSON serialization
      window.localStorage.setItem(fullKey, JSON.stringify(Array.from(valueToStore.entries())))
    } catch (error) {
      console.error(`Error setting localStorage Map key "${fullKey}":`, error)
    }
  }

  // Re-initialize when namespace changes (e.g., when switching tabs)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(fullKey)
      if (item) {
        const parsed = JSON.parse(item)
        setStoredValue(new Map(parsed))
      } else {
        setStoredValue(initialValue)
      }
    } catch (error) {
      console.error(`Error reading localStorage Map key "${fullKey}":`, error)
      setStoredValue(initialValue)
    }
  }, [fullKey])

  return [storedValue, setValue]
}

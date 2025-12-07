import { useState, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export interface Tab {
  id: string
  name: string
  createdAt: number
}

const generateId = () => {
  return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function useTabManager() {
  const [tabs, setTabs] = useLocalStorage<Tab[]>('phonetic-tabs', [])
  const [activeTabId, setActiveTabId] = useLocalStorage<string | null>('phonetic-activeTab', null)

  // Initialize with a default tab if none exist
  useEffect(() => {
    if (tabs.length === 0) {
      const defaultTab: Tab = {
        id: generateId(),
        name: 'System 1',
        createdAt: Date.now()
      }
      setTabs([defaultTab])
      setActiveTabId(defaultTab.id)
    } else if (!activeTabId || !tabs.find(t => t.id === activeTabId)) {
      // If no active tab or active tab doesn't exist, set to first tab
      setActiveTabId(tabs[0].id)
    }
  }, [])

  const addTab = (name?: string) => {
    const newTab: Tab = {
      id: generateId(),
      name: name || `System ${tabs.length + 1}`,
      createdAt: Date.now()
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newTab.id)
    return newTab
  }

  const removeTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    // If we removed the active tab, switch to another
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id)
    }

    // Clean up localStorage for this tab
    cleanupTabStorage(tabId)
  }

  const renameTab = (tabId: string, newName: string) => {
    setTabs(tabs.map(t => t.id === tabId ? { ...t, name: newName } : t))
  }

  const cleanupTabStorage = (tabId: string) => {
    // Remove all localStorage keys associated with this tab
    const keysToRemove = [
      `phonetic-words-${tabId}`,
      `phonetic-hasGenerated-${tabId}`,
      `phonetic-showPhonetics-${tabId}`,
      `phonetic-similarityThreshold-${tabId}`,
      `phonetic-showEmbeddingViz-${tabId}`,
      `phonetic-abstractnessScores-${tabId}`,
      `phonetic-wordEmbeddings-${tabId}`,
      `phonetic-semanticNeighbors-${tabId}`
    ]

    keysToRemove.forEach(key => {
      window.localStorage.removeItem(key)
    })
  }

  return {
    tabs,
    activeTabId,
    activeTab: tabs.find(t => t.id === activeTabId) || null,
    setActiveTabId,
    addTab,
    removeTab,
    renameTab
  }
}

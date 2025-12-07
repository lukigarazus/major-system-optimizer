import { useState } from 'react'
import type { Tab } from '../hooks/useTabManager'
import './TabBar.css'

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onTabChange: (tabId: string) => void
  onAddTab: () => void
  onRemoveTab: (tabId: string) => void
  onRenameTab: (tabId: string, newName: string) => void
}

export function TabBar({ tabs, activeTabId, onTabChange, onAddTab, onRemoveTab, onRenameTab }: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleStartEdit = (tab: Tab, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTabId(tab.id)
    setEditingName(tab.name)
  }

  const handleFinishEdit = (tabId: string) => {
    if (editingName.trim()) {
      onRenameTab(tabId, editingName.trim())
    }
    setEditingTabId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleFinishEdit(tabId)
    } else if (e.key === 'Escape') {
      setEditingTabId(null)
    }
  }

  const handleRemove = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      alert('Cannot remove the last tab')
      return
    }
    if (confirm('Are you sure you want to remove this tab? All data will be lost.')) {
      onRemoveTab(tabId)
    }
  }

  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {editingTabId === tab.id ? (
              <input
                type="text"
                className="tab-name-input"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleFinishEdit(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="tab-name" onDoubleClick={(e) => handleStartEdit(tab, e)}>
                  {tab.name}
                </span>
                <button
                  className="tab-close"
                  onClick={(e) => handleRemove(tab.id, e)}
                  title="Remove tab"
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}
        <button className="tab-add" onClick={onAddTab} title="Add new tab">
          +
        </button>
      </div>
    </div>
  )
}

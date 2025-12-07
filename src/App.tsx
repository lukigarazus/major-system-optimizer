import { PhoneticWordList } from './components/PhoneticWordList'
import { TabBar } from './components/TabBar'
import { useTabManager } from './hooks/useTabManager'
import './App.css'

function App() {
  const defaultMapping = {
    '0': 's',
    '1': 't',
    '2': 'n',
    '3': 'm',
    '4': 'r',
    '5': 'l',
    '6': 'sh',
    '7': 'k',
    '8': 'f',
    '9': 'p'
  }

  const { tabs, activeTabId, setActiveTabId, addTab, removeTab, renameTab } = useTabManager()

  return (
    <div className="App">
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        onAddTab={addTab}
        onRemoveTab={removeTab}
        onRenameTab={renameTab}
      />
      {activeTabId && <PhoneticWordList mapping={defaultMapping} tabId={activeTabId} />}
    </div>
  )
}

export default App

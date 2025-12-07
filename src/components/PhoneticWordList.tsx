import { useState, useMemo, useEffect, useRef } from 'react'
import { defaultMajorSystemWords } from '../data/majorSystemWords'
import { groupHomonyms } from '../services/homonyms'
import { useLocalStorage } from '../hooks/useLocalStorage'
import './PhoneticWordList.css'

export interface PhoneticMapping {
  [digit: string]: string
}

interface PhoneticWordListProps {
  mapping: PhoneticMapping
  tabId: string
}

interface WordEntry {
  word: string
  isValid: boolean
  homonymNumbers?: string[]
  validPositions?: string[] // Other positions this word could satisfy
}

export function PhoneticWordList({ mapping, tabId }: PhoneticWordListProps) {
  // Persisted state - critical data (namespaced by tabId)
  const [words, setWords] = useLocalStorage<{ [key: string]: string }>('phonetic-words', {}, tabId)
  const [hasGenerated, setHasGenerated] = useLocalStorage<boolean>('phonetic-hasGenerated', false, tabId)

  // Persisted state - user preferences (namespaced by tabId)
  const [showPhonetics, setShowPhonetics] = useLocalStorage<boolean>('phonetic-showPhonetics', true, tabId)

  // Local state for immediate input updates (not persisted)
  const [localWords, setLocalWords] = useState<{ [key: string]: string }>({})
  const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Load default words on first render
  useEffect(() => {
    if (!hasGenerated && Object.keys(words).length === 0) {
      setWords(defaultMajorSystemWords)
      setHasGenerated(true)
    }
  }, [])

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

  // Convert a word to its major system phonetic representation
  const wordToPhonetics = (word: string): string[] => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '')
    const phonetics: string[] = []

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized[i]
      const nextChar = normalized[i + 1]

      // Handle digraphs first
      if (char === 'c' && nextChar === 'h') {
        phonetics.push('ch')
        i++
        continue
      }
      if (char === 's' && nextChar === 'h') {
        phonetics.push('sh')
        i++
        continue
      }
      if (char === 't' && nextChar === 'h') {
        phonetics.push('th')
        i++
        continue
      }
      if (char === 'p' && nextChar === 'h') {
        phonetics.push('ph')
        i++
        continue
      }
      if (char === 'q' && nextChar === 'u') {
        phonetics.push('qu')
        i++
        continue
      }

      // Handle single letters - context matters for c and g
      if (char === 'c') {
        // Soft c (before e, i, y) = s sound, hard c = k sound
        if (nextChar === 'e' || nextChar === 'i' || nextChar === 'y') {
          phonetics.push('s')
        } else {
          phonetics.push('k')
        }
        continue
      }

      if (char === 'g') {
        // Soft g (before e, i, y) = j sound, hard g = g sound
        if (nextChar === 'e' || nextChar === 'i' || nextChar === 'y') {
          phonetics.push('j')
        } else {
          phonetics.push('g')
        }
        continue
      }

      // Regular consonants and vowels
      phonetics.push(char)
    }

    return phonetics
  }

  // Map phonetic sounds to major system digits
  const phoneticToDigit = (phonetic: string): string | null => {
    // Major system consonant sounds
    const digitMap: { [key: string]: string } = {
      's': '0', 'z': '0',
      't': '1', 'd': '1', 'th': '1',
      'n': '2',
      'm': '3',
      'r': '4',
      'l': '5',
      'j': '6', 'sh': '6', 'ch': '6',
      'k': '7', 'g': '7', 'q': '7', 'qu': '7',
      'f': '8', 'v': '8', 'ph': '8',
      'p': '9', 'b': '9'
    }

    return digitMap[phonetic] || null
  }

  const validateWord = (num: string, word: string): boolean => {
    if (!word.trim()) return true

    const expectedDigits = num.split('')

    if (expectedDigits.length === 0) return true

    // Convert word to phonetic sounds, then to digits
    const phonetics = wordToPhonetics(word)
    const wordDigits = phonetics
      .map(p => phoneticToDigit(p))
      .filter((d): d is string => d !== null)

    // Check if expected digits appear in order
    let wordIndex = 0
    for (const expectedDigit of expectedDigits) {
      const digitIndex = wordDigits.indexOf(expectedDigit, wordIndex)
      if (digitIndex === -1) return false
      wordIndex = digitIndex + 1
    }

    return true
  }

  // Check which positions (00-99) a given word would satisfy
  const getValidPositionsForWord = (word: string): string[] => {
    if (!word.trim()) return []

    const validPositions: string[] = []

    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0')
      if (validateWord(num, word)) {
        validPositions.push(num)
      }
    }

    return validPositions
  }

  // Detect homonyms among all words
  const homonymConflicts = useMemo(() => {
    const filledWords = Object.entries(words)
      .filter(([_, word]) => word && word.trim())
      .map(([num, word]) => ({ num, word: word.trim().toLowerCase() }))

    if (filledWords.length === 0) return new Map<string, string[]>()

    const wordToNumbers = new Map<string, string[]>()
    filledWords.forEach(({ num, word }) => {
      if (!wordToNumbers.has(word)) {
        wordToNumbers.set(word, [])
      }
      wordToNumbers.get(word)!.push(num)
    })

    const allWords = filledWords.map(({ word }) => word)
    const homonymGroups = groupHomonyms(allWords)

    const conflicts = new Map<string, string[]>()

    homonymGroups.forEach(group => {
      const numbersInGroup = new Set<string>()

      group.words.forEach(word => {
        const nums = wordToNumbers.get(word) || []
        nums.forEach(num => numbersInGroup.add(num))
      })

      const numbersList = Array.from(numbersInGroup)

      if (numbersList.length > 1) {
        numbersList.forEach(num => {
          conflicts.set(num, numbersList.filter(n => n !== num))
        })
      }
    })

    return conflicts
  }, [words])

  const wordEntries = useMemo(() => {
    const entries: { [key: string]: WordEntry } = {}
    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0')
      const word = words[num] || ''

      // Get all valid positions for this word
      const allValidPositions = word.trim() ? getValidPositionsForWord(word) : []
      // Filter out the current position to show only "other" positions
      const otherPositions = allValidPositions.filter(pos => pos !== num)

      entries[num] = {
        word,
        isValid: validateWord(num, word),
        homonymNumbers: homonymConflicts.get(num),
        validPositions: otherPositions.length > 0 ? otherPositions : undefined
      }
    }
    return entries
  }, [words, mapping, homonymConflicts])

  const handleWordChange = (num: string, value: string) => {
    // Update local state immediately for responsive UI
    setLocalWords(prev => ({
      ...prev,
      [num]: value
    }))

    // Clear existing timer for this input
    if (debounceTimers.current[num]) {
      clearTimeout(debounceTimers.current[num])
    }

    // Set new timer to update persisted state after 300ms
    debounceTimers.current[num] = setTimeout(() => {
      setWords(prev => ({
        ...prev,
        [num]: value
      }))
      // Remove from local state once persisted
      setLocalWords(prev => {
        const next = { ...prev }
        delete next[num]
        return next
      })
    }, 300)
  }

  const getExpectedPattern = (num: string): string => {
    const digits = num.split('')
    return digits.map(d => mapping[d] || '?').join(' + ')
  }

  const getPhoneticBreakdown = (word: string): { sound: string; digit: string | null }[] => {
    if (!word.trim()) return []

    const phonetics = wordToPhonetics(word)
    return phonetics.map(sound => ({
      sound,
      digit: phoneticToDigit(sound)
    }))
  }

  const copyAllInfo = async () => {
    // Build the complete information text
    let info = '=== PHONETIC NUMBER SYSTEM ===\n\n'

    // Add system mapping
    info += 'System Mapping:\n'
    Object.entries(mapping).forEach(([digit, phoneme]) => {
      info += `  ${digit} → ${phoneme}\n`
    })
    info += '\n'

    // Add statistics
    info += `Statistics:\n`
    info += `  Filled: ${filledCount}/100\n`
    info += `  Valid: ${validCount}/${filledCount || 0}\n`
    info += `  Homonym conflicts: ${homonymCount}\n\n`

    // Add all words with warnings
    info += '=== WORDS (00-99) ===\n\n'

    for (let i = 0; i < 100; i++) {
      const num = i.toString().padStart(2, '0')
      const entry = wordEntries[num]

      if (entry.word.trim()) {
        info += `${num}: ${entry.word}\n`

        // Add pattern info if invalid
        if (!entry.isValid) {
          const pattern = getExpectedPattern(num)
          info += `  ⚠️ INVALID - Must contain: ${pattern}\n`
        }

        // Add homonym warnings
        if (entry.homonymNumbers && entry.homonymNumbers.length > 0) {
          const homonyms = entry.homonymNumbers
            .map(n => `${n} (${words[n]})`)
            .join(', ')
          info += `  ⚠️ HOMONYM - Sounds like: ${homonyms}\n`
        }

        // Add position warnings
        if (entry.validPositions && entry.validPositions.length > 0) {
          const positions = entry.validPositions.join(', ')
          info += `  ⚠️ POSITION - Also works for: ${positions}\n`
        }

        info += '\n'
      }
    }

    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(info)
      alert('All information copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Failed to copy to clipboard. See console for details.')
    }
  }

  const exportWords = () => {
    const data = Object.entries(words)
      .filter(([_, word]) => word.trim())
      .map(([num, word]) => `${num}: ${word}`)
      .join('\n')

    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'phonetic-words.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importWords = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const imported: { [key: string]: string } = {}

      text.split('\n').forEach(line => {
        const match = line.match(/^(\d{2}):\s*(.+)$/)
        if (match) {
          imported[match[1]] = match[2].trim()
        }
      })

      setWords(imported)
    }
    reader.readAsText(file)
  }

  const filledCount = Object.values(words).filter(w => w.trim()).length
  const validCount = Object.entries(wordEntries)
    .filter(([_, entry]) => entry.word.trim() && entry.isValid).length
  const homonymCount = homonymConflicts.size

  return (
    <div className="phonetic-word-list">
      <div className="header">
        <h2>Phonetic Number System (00-99)</h2>
        <div className="stats">
          <span>Filled: {filledCount}/100</span>
          <span>Valid: {validCount}/{filledCount || 0}</span>
          {homonymCount > 0 && <span className="warning">Homonyms: {homonymCount}</span>}
        </div>
        <div className="controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showPhonetics}
              onChange={(e) => setShowPhonetics(e.target.checked)}
            />
            Show phonetic breakdown
          </label>
        </div>
        <div className="actions">
          <button onClick={copyAllInfo}>Copy All Info</button>
          <button onClick={exportWords}>Export</button>
          <label className="import-button">
            Import
            <input type="file" accept=".txt" onChange={importWords} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="mapping-reference">
        <h3>Mapping Reference:</h3>
        <div className="mapping-grid">
          {Object.entries(mapping).map(([digit, phoneme]) => (
            <span key={digit} className="mapping-item">
              {digit} → {phoneme}
            </span>
          ))}
        </div>
      </div>

      <div className="words-grid">
        {Array.from({ length: 100 }, (_, i) => {
          const num = i.toString().padStart(2, '0')
          const entry = wordEntries[num]
          const pattern = getExpectedPattern(num)

          return (
            <div
              key={num}
              className={`word-cell ${!entry.isValid ? 'invalid' : ''} ${entry.word ? 'filled' : ''} ${entry.homonymNumbers ? 'homonym' : ''}`}
            >
              <label className="number-label">{num}</label>
              <div className="pattern-hint" title={`Required: ${pattern}`}>
                {pattern}
              </div>
              <input
                type="text"
                value={localWords[num] !== undefined ? localWords[num] : entry.word}
                onChange={(e) => handleWordChange(num, e.target.value)}
                placeholder="word..."
                className={!entry.isValid ? 'invalid-input' : ''}
              />
              {showPhonetics && entry.word && (
                <div className="phonetic-breakdown">
                  {getPhoneticBreakdown(entry.word).map((item, idx) => (
                    <span
                      key={idx}
                      className={item.digit !== null ? 'consonant' : 'vowel'}
                      title={item.digit !== null ? `digit: ${item.digit}` : 'vowel (ignored)'}
                    >
                      {item.sound}
                      {item.digit !== null && <sub>{item.digit}</sub>}
                    </span>
                  ))}
                </div>
              )}
              {!entry.isValid && entry.word && (
                <div className="error-hint">
                  Must contain: {pattern}
                </div>
              )}
              {entry.homonymNumbers && entry.word && (
                <div className="homonym-warning">
                  Sounds like: {entry.homonymNumbers.map(n => `${n} (${words[n]})`).join(', ')}
                </div>
              )}
              {entry.validPositions && entry.validPositions.length > 0 && entry.word && (
                <div className="position-warning">
                  Also works for: {entry.validPositions.slice(0, 3).join(', ')}
                  {entry.validPositions.length > 3 && ` +${entry.validPositions.length - 3} more`}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

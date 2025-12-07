import { doubleMetaphone } from 'double-metaphone';

export interface HomonymGroup {
  phoneticCode: string;
  words: string[];
}

/**
 * Groups words that are homonyms (sound alike) using the Double Metaphone phonetic algorithm
 * @param words - Array of words to compare
 * @param caseSensitive - Whether to treat words with different cases as distinct (default: false)
 * @returns Array of homonym groups, where each group contains words that sound the same
 */
export function groupHomonyms(
  words: string[],
  caseSensitive: boolean = false
): HomonymGroup[] {
  const phoneticMap = new Map<string, string[]>();

  for (const word of words) {
    const normalizedWord = caseSensitive ? word : word.toLowerCase();
    const trimmedWord = normalizedWord.trim();

    if (!trimmedWord) continue;

    // Double Metaphone returns primary and secondary phonetic codes
    const phoneticCode = doubleMetaphone(trimmedWord)[0];

    if (!phoneticMap.has(phoneticCode)) {
      phoneticMap.set(phoneticCode, []);
    }
    phoneticMap.get(phoneticCode)!.push(trimmedWord);
  }

  // Filter to only include groups with 2 or more words (actual homonyms)
  const homonymGroups: HomonymGroup[] = [];

  for (const [phoneticCode, groupWords] of phoneticMap.entries()) {
    if (groupWords.length > 1) {
      homonymGroups.push({
        phoneticCode,
        words: [...new Set(groupWords)], // Remove duplicates
      });
    }
  }

  return homonymGroups;
}

/**
 * Check if two specific words are homonyms
 * @param word1 - First word to compare
 * @param word2 - Second word to compare
 * @returns true if the words are homonyms (sound alike)
 */
export function areHomonyms(word1: string, word2: string): boolean {
  const phonetic1 = doubleMetaphone(word1.toLowerCase().trim())[0];
  const phonetic2 = doubleMetaphone(word2.toLowerCase().trim())[0];
  return phonetic1 === phonetic2;
}

/**
 * Find all homonyms for a specific word from a list
 * @param targetWord - The word to find homonyms for
 * @param wordList - List of words to search through
 * @returns Array of words that are homonyms of the target word
 */
export function findHomonyms(targetWord: string, wordList: string[]): string[] {
  const targetPhonetic = doubleMetaphone(targetWord.toLowerCase().trim())[0];

  return wordList.filter(word => {
    const wordPhonetic = doubleMetaphone(word.toLowerCase().trim())[0];
    return wordPhonetic === targetPhonetic && word.toLowerCase() !== targetWord.toLowerCase();
  });
}

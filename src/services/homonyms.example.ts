import { groupHomonyms, areHomonyms, findHomonyms } from './homonyms';

// Example 1: Group homonyms from a list of words
const words = [
  'there',
  'their',
  'they\'re',
  'bear',
  'bare',
  'flour',
  'flower',
  'night',
  'knight',
  'write',
  'right',
  'rite',
  'wright',
  'see',
  'sea',
  'cell',
  'sell',
  'blue',
  'blew'
];

console.log('Example 1: Group all homonyms');
const groups = groupHomonyms(words);
groups.forEach(group => {
  console.log(`Phonetic: ${group.phoneticCode} -> Words: ${group.words.join(', ')}`);
});

// Example 2: Check if two words are homonyms
console.log('\nExample 2: Check specific pairs');
console.log(`Are "there" and "their" homonyms? ${areHomonyms('there', 'their')}`);
console.log(`Are "bear" and "beer" homonyms? ${areHomonyms('bear', 'beer')}`);
console.log(`Are "write" and "right" homonyms? ${areHomonyms('write', 'right')}`);

// Example 3: Find all homonyms for a specific word
console.log('\nExample 3: Find homonyms for "right"');
const rightHomonyms = findHomonyms('right', words);
console.log(`Homonyms of "right": ${rightHomonyms.join(', ')}`);

// Example 4: Find homonyms for "there"
console.log('\nExample 4: Find homonyms for "there"');
const thereHomonyms = findHomonyms('there', words);
console.log(`Homonyms of "there": ${thereHomonyms.join(', ')}`);

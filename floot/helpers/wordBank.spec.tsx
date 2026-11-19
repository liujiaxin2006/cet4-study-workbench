import {legacyRetiredWords} from './wordBankLegacy';
import {wordBank,readingWordBank} from './wordBank';
import {paperFrequencyCoverage} from './wordBankFrequencies';
describe('published reading vocabulary',()=>{
 it('prefers checked IPA and normalizes unambiguous legacy notation',()=>{expect(wordBank.find(w=>w.word==='provide')?.phonetic).toBe('/prəˈvaɪd/');expect(wordBank.some(w=>/[ә:]/.test(w.phonetic||''))).toBe(false);});
 it('keeps 1000 reading words separate from compatible legacy words',()=>{expect(readingWordBank.length).toBe(1000);expect(wordBank.filter(w=>w.cetFrequency!==undefined).length).toBe(1000);expect(new Set(wordBank.map(w=>w.word.toLowerCase())).size).toBe(wordBank.length);});
 it('uses only published reading groups and observed forms',()=>{expect(paperFrequencyCoverage.readyReadingGroups).toBe(232);expect(readingWordBank.every(w=>!!w.forms?.length&&!!w.cetFrequency&&!!w.examCount&&w.sourceRank===undefined)).toBe(true);});
 it('preserves common grammatical and lexical senses',()=>{expect(wordBank.find(w=>w.word==='might')?.meaning.includes('可能')).toBe(true);expect(wordBank.find(w=>w.word==='found')?.meaning.includes('find')).toBe(true);expect(wordBank.find(w=>w.word==='object')?.meaning.includes('反对')).toBe(true);});
 it('does not label supplement ranks as exam frequency',()=>{expect(wordBank.filter(w=>w.sourceType==='supplement'&&w.sourceRank!==undefined).every(w=>w.note?.includes('不是四级历年真题考频'))).toBe(true);});
 it('retains retired words for existing queues and progress',()=>{expect(legacyRetiredWords.every(w=>wordBank.some(c=>c.word===w.word&&c.sourceType==='supplement'))).toBe(true);});
});

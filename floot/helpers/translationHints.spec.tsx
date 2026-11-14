import {translationWords} from './translationHints';
describe('translation phrase hints',()=>{
 it('preserves punctuation and all characters while segmenting phrases',()=>{const text='教育与环境保护，让生活更美好。𠮷';expect(translationWords(text).map(w=>w.text).join('')).toBe(text);});
 it('offers word candidates without generating a full paragraph answer',()=>{const words=translationWords('教育');expect(words.length).toBe(1);expect(words[0].hints.includes('education')).toBeTrue();});
 it('keeps a rare character in one visible token',()=>{expect(translationWords('𠮷')[0].text).toBe('𠮷');});
});

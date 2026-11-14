import {translationGlossary} from './translationGlossary';
export function translationWords(text:string){
 const words:{text:string;hints:string[]}[]=[];
 for(let i=0;i<text.length;){let word='';for(let n=Math.min(12,text.length-i);n>0;n--){const part=text.slice(i,i+n);if(Object.hasOwn(translationGlossary,part)){word=part;break;}}if(!word)word=String.fromCodePoint(text.codePointAt(i)!);words.push({text:word,hints:translationGlossary[word]||[]});i+=word.length;}
 return words;
}

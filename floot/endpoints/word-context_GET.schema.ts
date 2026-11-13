import {practiceRequest} from './practice-catalog_GET.schema';
export type WordContext={contexts:{paper:string;group:string;text:string}[]};
export const getWordContext=(word:string)=>practiceRequest<WordContext>('word-context?word='+encodeURIComponent(word));

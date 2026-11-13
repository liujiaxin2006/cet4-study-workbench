export function safeReturnPath(value:string|null|undefined,fallback='/'){
 if(!value||/[\\\u0000-\u001f]/.test(value))return fallback;
 try{const url=new URL(value,'https://app.invalid');return url.origin==='https://app.invalid'&&['/','/admin','/library-review'].includes(url.pathname)?url.pathname+url.search+url.hash:fallback;}catch{return fallback;}
}

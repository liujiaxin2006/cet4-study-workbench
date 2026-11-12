import superjson from 'superjson';
export function cetReply(body:unknown,init?:ResponseInit){const headers=new Headers(init?.headers);headers.set('Content-Type','application/json');headers.set('Cache-Control','no-store');return new Response(superjson.stringify(body),{...init,headers});}

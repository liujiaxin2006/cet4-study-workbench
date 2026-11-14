import React from 'react';
import {render,act,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import superjson from 'superjson';
import {AuthProvider,AUTH_QUERY_KEY} from './useAuth';
import {useStudyTimer} from './useStudyTimer';
import type {StudyModule} from './studyActivity';
let client:QueryClient,result:ReturnType<typeof useStudyTimer>;
let originalBeacon:PropertyDescriptor|undefined;
function Clock({module}:{module:StudyModule|null}){result=useStudyTimer(module);return <span>{result.todaySeconds}</span>;}
function Root({module}:{module:StudyModule|null}){return <QueryClientProvider client={client}><AuthProvider><Clock module={module}/></AuthProvider></QueryClientProvider>;}
describe('learning time lifecycle',()=>{
 let visible:boolean,beacon:jasmine.Spy,requests:string[];
 beforeEach(()=>{
  jasmine.clock().install();jasmine.clock().mockDate(new Date('2026-11-14T02:00:00Z'));
  spyOn(performance,'now').and.callFake(()=>Date.now());visible=true;
  spyOn(document,'hasFocus').and.returnValue(true);spyOnProperty(document,'visibilityState','get').and.callFake(()=>visible?'visible':'hidden');
  requests=[];spyOn(globalThis,'fetch').and.callFake(async(input)=>{const url=String(input);requests.push(url);return new Response(superjson.stringify(url.includes('study-usage')?{accepted:true}:{todaySeconds:300,totalSeconds:900,days:[]}));});
  originalBeacon=Object.getOwnPropertyDescriptor(navigator,'sendBeacon');beacon=jasmine.createSpy('sendBeacon').and.returnValue(true);Object.defineProperty(navigator,'sendBeacon',{value:beacon,configurable:true});
  client=new QueryClient({defaultOptions:{queries:{retry:false}}});client.setQueryData(AUTH_QUERY_KEY,{id:2,email:'test@example.invalid',displayName:'Test',avatarUrl:null,role:'admin'});
  client.setQueryData(['study-time',2],{todaySeconds:300,totalSeconds:900,days:[]});
 });
 afterEach(()=>{cleanup();client.clear();if(originalBeacon)Object.defineProperty(navigator,'sendBeacon',originalBeacon);else delete (navigator as any).sendBeacon;jasmine.clock().uninstall();});
 it('keeps local seconds across navigation and server refresh for admin learners too',async()=>{
  const view=render(<Root module="reading"/>);await act(async()=>{await Promise.resolve();jasmine.clock().tick(5000);});
  expect(result.todaySeconds).toBe(305);expect(result.totalSeconds).toBe(905);
  await act(async()=>{view.rerender(<Root module={null}/>);await Promise.resolve();jasmine.clock().tick(0);});
  expect(result.todaySeconds).toBe(305);expect(requests.filter(p=>p.includes('study-usage')).length).toBe(2);expect(result.days[0].seconds).toBe(305);
 });
 it('pauses in the background and performs no per-second network writes',async()=>{
  render(<Root module="reading"/>);await act(async()=>{await Promise.resolve();jasmine.clock().tick(10000);});
  expect(result.todaySeconds).toBe(310);expect(requests.filter(p=>p.includes('study-usage')).length).toBe(1);
  await act(async()=>{visible=false;document.dispatchEvent(new window.Event('visibilitychange'));jasmine.clock().tick(20000);});
  expect(document.visibilityState).withContext('background visibility').toBe('hidden');expect(result.todaySeconds).withContext('background accumulation').toBe(310);
  await act(async()=>{visible=true;result.setPaused(true);jasmine.clock().tick(0);});
  await act(async()=>{jasmine.clock().tick(10000);});expect(result.paused).withContext('pause state').toBeTrue();expect(result.todaySeconds).withContext('paused accumulation').toBe(310);
 });
});

import {safeReturnPath} from './safeReturnPath';
describe('post-login destinations',()=>{
 it('returns to protected admin and question-library locations',()=>{expect(safeReturnPath('/admin?tab=library')).toBe('/admin?tab=library');expect(safeReturnPath('/library-review')).toBe('/library-review');});
 it('rejects external, script and backslash destinations',()=>{for(const path of ['https://evil.example/admin','//evil.example','javascript:alert(1)','/\\evil.example','/admin\n','/%5cevil.example'])expect(safeReturnPath(path)).toBe('/');});
 it('falls back safely for missing or unsupported paths',()=>{expect(safeReturnPath(null)).toBe('/');expect(safeReturnPath('/unknown')).toBe('/');});
});

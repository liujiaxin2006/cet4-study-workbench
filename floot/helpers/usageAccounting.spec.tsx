import {usageAccounting} from './usageAccounting';
describe('usage accounting',()=>{
 it('credits reported activity only within server elapsed time',()=>{expect(usageAccounting.credit({sequence:1,reportedSeconds:15,lastSeenAt:15000},{sequence:2,activeSeconds:30},30000,15000)).toEqual({duplicate:false,seconds:15});});
 it('credits a five-minute activity batch without frequent requests',()=>{expect(usageAccounting.credit({sequence:1,reportedSeconds:0,lastSeenAt:0},{sequence:2,activeSeconds:300},300000,0).seconds).toBe(300);});
 it('does not double-count simultaneous tabs',()=>{const prior={sequence:1,reportedSeconds:0,lastSeenAt:0};expect(usageAccounting.credit(prior,{sequence:2,activeSeconds:30},30000,30000).seconds).toBe(0);expect(usageAccounting.credit(prior,{sequence:2,activeSeconds:30},45000,30000).seconds).toBe(15);});
 it('ignores duplicate and out-of-order events',()=>{expect(usageAccounting.credit({sequence:5,reportedSeconds:50,lastSeenAt:50000},{sequence:4,activeSeconds:60},60000,50000)).toEqual({duplicate:true,seconds:0});});
 it('limits catch-up credit and ignores idle pulses',()=>{expect(usageAccounting.credit({sequence:1,reportedSeconds:0,lastSeenAt:0},{sequence:2,activeSeconds:100000},1000000,0).seconds).toBe(330);expect(usageAccounting.credit({sequence:1,reportedSeconds:10,lastSeenAt:0},{sequence:2,activeSeconds:10},30000,0).seconds).toBe(0);});
 it('does not grant time when client reports activity faster than server time',()=>{expect(usageAccounting.credit({sequence:1,reportedSeconds:0,lastSeenAt:15000},{sequence:2,activeSeconds:30},19000,0).seconds).toBe(4);});
 it('uses Shanghai calendar days across UTC midnight boundaries',()=>{const range=usageAccounting.window(7,new Date('2026-11-13T16:30:00Z'));expect(range.startDate).toBe('2026-11-08');expect(range.endDate).toBe('2026-11-14');expect(range.start.toISOString()).toBe('2026-11-07T16:00:00.000Z');});
 it('does not return complete account email addresses in operating tables',()=>{expect(usageAccounting.maskEmail('learner@example.com')).toBe('le***@example.com');});
});

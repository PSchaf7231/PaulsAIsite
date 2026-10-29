import { timingSafeEqual } from 'node:crypto';
import type { PaxState } from '../../lib/pax';
export function pauseSearchAlerts(state:PaxState,token:string){
 const search=state.searches.find(s=>s.unsubscribeToken&&/^[a-f0-9]{64}$/.test(token)&&timingSafeEqual(Buffer.from(s.unsubscribeToken),Buffer.from(token)));
 if(!search)return false;search.status='PAUSED_SAMPLE';
 for(const n of state.notifications)if(n.reason==='new sample matches'&&n.audience==='lead'&&['pending','retry','unconfigured'].includes(n.status))n.status='cancelled';
 state.events.push({kind:'search_alerts_stopped',at:new Date().toISOString()});return true;
}

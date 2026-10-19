/* Account-owned usage only. No new tables, analytics or third-party transfers. */
export function installUsage(sb){
 window.CIUsage={async read(){
  const {data:{user},error:authError}=await sb.auth.getUser();
  if(authError||!user)return {signedIn:false,events:[]};
  const events=[];let start=0;
  const since=new Date();since.setFullYear(since.getFullYear()-2);since.setHours(0,0,0,0);
  for(;;){const {data,error}=await sb.from('activity_log').select('id,event_type,metadata,created_at').eq('user_id',user.id).gte('created_at',since.toISOString()).order('created_at',{ascending:true}).order('id',{ascending:true}).range(start,start+999);if(error)throw Error('Your activity could not load. Please retry.');events.push(...data.map(e=>({id:e.id,type:e.event_type,at:e.created_at,seconds:Number(e.metadata?.duration_s)||null})));if(data.length<1000)break;start+=1000;}
  return {signedIn:true,events,since:since.toISOString()};
 },async complete(seconds,session){
  if(!Number.isFinite(seconds)||seconds<1||seconds>14400||typeof session!=='string')return false;
  const {data:{user}}=await sb.auth.getUser();if(!user)return false;
  const {error}=await sb.from('activity_log').insert({user_id:user.id,event_type:'meditation',metadata:{duration_s:Math.round(seconds),session_id:session},points:0,created_at:new Date().toISOString()});
  if(error)throw Error('Session tracking could not save.');return true;
 }};
}

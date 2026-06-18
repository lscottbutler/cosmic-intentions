#!/usr/bin/env bash
# Health check — RUN THIS before claiming any change is live.
#   1) Is the local preview (source of truth) serving?
#   2) Did the newest Netlify deploy actually publish (state = ready)?
set -u
SITE="bf7cacf8-3b22-42be-b187-baf4ab0ebe9c"

echo "── LOCAL PREVIEW (this is the source of truth, NOT the live site) ──"
curl -s -o /dev/null -m 5 -w "  http://127.0.0.1:8080  ->  HTTP %{http_code}\n" \
  http://127.0.0.1:8080/index.html || echo "  LOCAL SERVER DOWN — double-click vibe-preview.bat"

echo "── NEWEST NETLIFY DEPLOY ──"
netlify api listSiteDeploys --data "{\"site_id\":\"$SITE\"}" 2>/dev/null | node -e '
let r="";process.stdin.on("data",d=>r+=d);process.stdin.on("end",()=>{
  try{
    const d=JSON.parse(r)[0];
    const live = d.state==="ready";
    console.log("  state:  "+d.state+(live?"   ✅ LIVE":"   ❌ NOT LIVE"));
    console.log("  when:   "+(d.created_at||"").slice(0,16)+"   commit "+((d.commit_ref||"").slice(0,7)||"-"));
    if(d.error_message) console.log("  reason: "+d.error_message);
    if(!live) console.log("  >> Your changes are NOT on cosmicintentions.com. Do not claim they are.");
  }catch(e){ console.log("  could not read deploy status (logged in?):",r.slice(0,160)); }
});'

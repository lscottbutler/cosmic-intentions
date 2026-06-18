#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  COSMIC INTENTIONS — HEALTH CHECK
#  Run anytime (especially after a deploy):  bash scripts/health.sh
#  Tells you, in one screen, whether everything is actually OK.
# ─────────────────────────────────────────────────────────────
set -u
cd "$(dirname "$0")/.." 2>/dev/null
SITE="bf7cacf8-3b22-42be-b187-baf4ab0ebe9c"
LIVE="https://cosmicintentions.com"
SUPA="https://wbqzwbubbeorcknevips.supabase.co"

echo "════════ COSMIC INTENTIONS · HEALTH ════════"

echo "[1] Local preview (your source of truth)"
curl -s -o /dev/null -m5 -w "    127.0.0.1:8080   HTTP %{http_code}\n" http://127.0.0.1:8080/index.html \
  || echo "    DOWN — double-click vibe-preview.bat"

echo "[2] Git state"
echo "    unpushed commits:    $(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')"
echo "    uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"

echo "[3] Live site responding"
for p in "/" "/player/affirmation.html" "/shared/player-launcher.js"; do
  curl -s -o /dev/null -m12 -w "    $p   HTTP %{http_code}\n" "$LIVE$p"
done

echo "[4] Latest Netlify deploy (did your last push actually publish?)"
netlify api listSiteDeploys --data "{\"site_id\":\"$SITE\"}" 2>/dev/null | node -e '
let r="";process.stdin.on("data",d=>r+=d);process.stdin.on("end",()=>{
  try{const d=JSON.parse(r)[0];const ok=d.state==="ready";
    console.log("    state: "+d.state+(ok?"   ✅ LIVE":"   ❌ NOT LIVE — changes are NOT on the site"));
    console.log("    when:  "+(d.created_at||"").slice(0,16)+"   commit "+((d.commit_ref||"").slice(0,7)||"-"));
    if(d.error_message) console.log("    why:   "+d.error_message);
  }catch(e){console.log("    could not read (logged in? run: netlify login)");}
});' 2>/dev/null || echo "    netlify CLI not available"

echo "[5] Supabase (auth + database)"
sc=$(curl -s -o /dev/null -m8 -w "%{http_code}" "$SUPA/auth/v1/health")
if [ "$sc" = "000" ]; then echo "    ❌ UNREACHABLE (down or network) — check supabase-status.com";
else echo "    ✅ reachable (HTTP $sc — 200/401 both mean it's up)"; fi

echo "════════════════════════════════════════════"
echo "Anything not 200 / not 'ready' → open docs/RUNBOOK.md → 'WHEN IT BREAKS'."

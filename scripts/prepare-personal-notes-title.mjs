import fs from 'node:fs';
import assert from 'node:assert/strict';

// One-time, exact-anchor integration on the dedicated review branch only.
const file = 'app.js';
let source = fs.readFileSync(file, 'utf8');
function replace(oldText, newText) {
  assert.equal(source.split(oldText).length - 1, 1, 'Expected exactly one integration anchor');
  source = source.replace(oldText, newText);
}
replace('let citadelNoteRenderVersion = 0, citadelNoteResizeObserver;',
  'let citadelNoteRenderVersion = 0, citadelNoteResizeObserver, citadelPersonalAuthSubscription;');
replace('async function initCitadelNoteFrame(nextPage) {\n  const renderVersion',
  'async function initCitadelNoteFrame(nextPage) {\n  citadelPersonalAuthSubscription?.unsubscribe();\n  citadelPersonalAuthSubscription = null;\n  const renderVersion');
replace("      // Only the visibility preference is stored locally; private note text stays in RLS-protected Supabase.",
  "      // Title and body belong to the same RLS-protected account/page record.\n      // Only the visibility preference remains device-local. A pre-upgrade\n      // browser title is retained as a fallback until the member next saves.");
replace("      const note = await sb.from('player_personal_notes').select('body')\n        .eq('user_id',memberId).eq('page_id',pageId).maybeSingle();\n      if(renderVersion!==citadelNoteRenderVersion)return;",
  "      const authWatch = sb.auth.onAuthStateChange((_event, session) => {\n        if (session?.user?.id !== memberId) {\n          // Never leave another account's private content visible after logout.\n          personal.replaceChildren();\n          personal.hidden = true;\n          report();\n        }\n      });\n      citadelPersonalAuthSubscription = authWatch.data?.subscription;\n      const note = await sb.from('player_personal_notes').select('body,title')\n        .eq('user_id',memberId).eq('page_id',pageId).maybeSingle();\n      if(renderVersion!==citadelNoteRenderVersion || personal.hidden)return;");
replace("        savedBody=note.data?.body||'';\n        copy.textContent=savedBody;",
  "        savedBody=note.data?.body||'';\n        copy.textContent=savedBody;\n        if (typeof note.data?.title === 'string') {\n          customHeading=note.data.title.trim().slice(0,80)||'MY PERSONAL NOTES';\n        }\n        heading.textContent=customHeading;");
const oldSave = `        save.addEventListener('click',async()=>{
          save.disabled=true;cancel.disabled=true;hide.disabled=true;status.textContent='Saving…';
          const value=input.value;
          const result=await sb.from('player_personal_notes').upsert(
            {user_id:memberId,page_id:pageId,body:value,updated_at:new Date().toISOString()},
            {onConflict:'user_id,page_id'}
          );
          if(result.error){status.textContent='Could not save';save.disabled=false;cancel.disabled=false;hide.disabled=false;return;}
          savedBody=value;copy.textContent=value;
          customHeading=titleInput.value.trim().slice(0,80)||'MY PERSONAL NOTES';
          heading.textContent=customHeading;
          try { localStorage.setItem(headingKey,customHeading); } catch (_) {}
          // SAVE reveals the newly saved text; only HIDE collapses to the faint E.
          collapsed=false;
          try { localStorage.removeItem(visibilityKey); } catch (_) {}
          closeEditor();
        });`;
const newSave = `        save.addEventListener('click',async()=>{
          if (save.disabled) return;
          const value=input.value;
          const title=titleInput.value.trim().slice(0,80)||'MY PERSONAL NOTES';
          save.disabled=true;cancel.disabled=true;hide.disabled=true;
          input.disabled=true;titleInput.disabled=true;
          status.textContent='Saving…';
          try {
            const auth = await sb.auth.getUser();
            if (auth.error || auth.data?.user?.id !== memberId || personal.hidden) {
              throw new Error('Account changed');
            }
            // One atomic account/page write; require the server's saved row back.
            const result=await sb.from('player_personal_notes').upsert(
              {user_id:memberId,page_id:pageId,title,body:value,updated_at:new Date().toISOString()},
              {onConflict:'user_id,page_id'}
            ).select('title,body').single();
            if(result.error || !result.data || result.data.title !== title || result.data.body !== value) {
              throw new Error('Save not confirmed');
            }
            if (renderVersion!==citadelNoteRenderVersion || personal.hidden || !personal.isConnected) return;
            savedBody=result.data.body;copy.textContent=savedBody;
            customHeading=result.data.title;heading.textContent=customHeading;
            // The cloud title is authoritative. Remove only this old local title.
            try { localStorage.removeItem(headingKey); } catch (_) {}
            // SAVE shows the saved title/text. Only HIDE collapses to the faint E.
            collapsed=false;
            try { localStorage.removeItem(visibilityKey); } catch (_) {}
            closeEditor();
          } catch (_) {
            status.textContent='Could not save. Your edits are still here. Please try again.';
          } finally {
            save.disabled=false;cancel.disabled=false;hide.disabled=false;
            input.disabled=false;titleInput.disabled=false;
          }
        });`;
replace(oldSave,newSave);
fs.writeFileSync(file,source);
const checkpoint = `\n\n## 2026-10-27 — Personal note title/account synchronization\nScott requested FINISH AND LINK, covering implementation, verification and private publication. Recovery baseline 5deeeb6aaeffdbde8c0037774eefc860400594bf is preserved in backup/personal-notes-before-cloud-title-20261027. The existing player_personal_notes record gains a nullable title (80 characters maximum); body and account/page ownership remain unchanged. SAVE writes title and body together and verifies the returned row before displaying success. Cloud title overrides old browser-only heading; the old local title is preserved as a fallback until explicit SAVE, then only that scoped key is removed. CANCEL/HIDE do not save drafts. Failed/throwing saves retain both fields. Account changes immediately clear private note content. Production DDL/release verification must be recorded in the final release report; do not infer publication from this checkpoint. Today's encrypted recovery snapshot and private Bible copy remain preserved. Locked players, artwork and ATB instructions are outside this change.\n`;
fs.appendFileSync('CI-SESSION-CHECKPOINT.md',checkpoint);
console.log('Guarded Personal Notes integration prepared; existing content preserved.');

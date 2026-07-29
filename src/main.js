import './sentry.js';   // error monitoring — must init first
import './styles/main.css';
import * as _shared_api_js from '../shared/api.js';
import * as _shared_content_bank_js from '../shared/content-bank.js';
import * as _shared_activity_js from '../shared/activity.js';
import * as _shared_card_builder_js from '../shared/card-builder.js';
import * as _shared_mission_control_js from '../shared/mission-control.js';
import * as _shared_weekly_focus_js from '../shared/weekly-focus.js';
import * as _shared_today_js from '../shared/today.js';
import * as _shared_player_launcher_js from '../shared/player-launcher.js';
import * as _shared_the_map_js from '../shared/the-map.js';
import * as _shared_rings_js from '../shared/rings.js';
import * as _shared_wrapup_js from '../shared/wrapup.js';
import * as _shared_wins_js from '../shared/wins.js';
import * as _shared_habits_js from '../shared/habits.js';
import * as _shared_winspage_js from '../shared/winspage.js';
import * as _shared_sleeploop_js from '../shared/sleeploop.js';
import * as _shared_notes_js from '../shared/notes.js';
import * as _shared_quickwin_js from '../shared/quickwin.js';
import * as _app_js from '../app.js';

// Expose inline-handler functions on window (inline onclick=... still used this phase).
const _mods = [_shared_api_js, _shared_content_bank_js, _shared_activity_js, _shared_card_builder_js, _shared_mission_control_js, _shared_weekly_focus_js, _shared_today_js, _shared_player_launcher_js, _shared_the_map_js, _shared_rings_js, _shared_wrapup_js, _shared_wins_js, _shared_winspage_js, _shared_habits_js, _shared_sleeploop_js, _shared_notes_js, _shared_quickwin_js, _app_js];
const HANDLERS = ["showPage","subnavBack","navTo","subnavForward","goMemberDashboard","signOut","closeDrawer","openUpgrade","closeUpgrade","selectPlan","goToStripe","openAuth","vaultShowAddForm","updateIamPreview","confirmAddIntention","hideAddForm","runAlchemy","closeAlchemyModal","pbConfirmAddIntention","pbToggleAI","pbToggleSection","pbSaveThought","renderPBThoughts","setSpirituality","pbSetChoice","addUlyssesContract","loadPegboard","saveSetup","adminFmt","adminLink","saveContentBlock","savePrompt","resetPrompt","testRoadmapPrompt","generateBlueprint","closeModal","generateDaylife","switchTab","doSignIn","doResetPassword","doSignUp","toggleCardV2","launch3Min","launchVisualization","launchViz","launchCreativeViz","openVizLibrary","openMyRoadmap","openVizGoal","rerollGoalVisualization","vizAct","renderVizLibrary","launchAffirmations","playGoalInline","closeGoalPlayer","launchMindset","playGoalInWorkspace","toggleRoadmap","toggleGoalFavorite","favThisPage","renderFavorites","launchRecite","openLibraryManager","closeLibraryManager","saveLibrary","launchCountdown","saveCardDate","switchPDTab","deleteIntention","showAddForm","lockPsychReframe","generateRoadmapAI","generateMindset","setActiveDangerZone","toggleRoadmapLock","toggleRoadmapTaskDone","addRoadmapUserTask","toggleRoadmapUserTaskDone","deleteRoadmapUserTask","deleteRoadmapTask","roadmapSectionToggle","roadmapShowMore","toggleRing","launchGratitude","winAdd","qwWinAdd","winDelete","winPageAdd","winPageSetFilter","renderQuickWin","qwTab","qwToggle","qwOpenGoal","qwGoalToggle","wrapupPersonalize","wrapupGoalToggle","wrapAddAction","wrapToggleAction","wrapDeleteAction","habitToggle","habitsToggleSection","renderRunThroughs","renderHabits","pbAddHabit","pbSaveHabitName","pbSetHabitCat","pbSetHabitDomain","pbDeleteHabit","pbMoveHabit","renderPBHabitList","sleepLoopToggle","sleepLoopSetMode","sleepLoopSetDuration","generateAchievers","pbSaveIntentionTitle","pbDeleteIntention","pbSaveCategory","generateFullPlan","generateMissionControl","flagMCItem","buildMCPlan","toggleCommitmentCheck","loadDailyCommitsPanel","wfToggle","todayMarkSession","todayToggleCommit","_tsToggle","toggleMapItem","toggleTaskLock","launchAffirmationPlayer","openPlayerInColumn","closePlayerColumn","toggleFavorites","playAllFavorites","playerFinished","_toggleDangerZone","toggleColBSection","bsGenerateTheMap","removeUlyssesContract","closeManifest","filterVaultCategory","toggleAcc","selectVaultIntention","closeVaultBuildSheet","generateBBFW","bsGenerateRoadmap","bsGenerateLibrary","toast","renderNotesPage","notesSaveField","notesDelete","notesToggleFav","notesToggleSection","sprinkleNotes","adminUploadPhoto","adminPhotoSelected","notesAutoGrow","notesShowAdd","notesSaveGoal"];
for (const name of HANDLERS) {
  for (const m of _mods) { if (name in m) { window[name] = m[name]; break; } }
}
// TRIPWIRE: loudly report any handler that didn't get wired.
const _missing = HANDLERS.filter(n => typeof window[n] !== 'function');
if (_missing.length) {
  console.error('[handler-tripwire] NOT wired:', _missing.join(', '));
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    const b = document.createElement('div');
    b.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:#b00;color:#fff;font:12px monospace;padding:8px;white-space:pre-wrap';
    b.textContent = 'DEAD HANDLERS: ' + _missing.join(', ');
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(b));
  }
} else { console.log('[handler-tripwire] all ' + HANDLERS.length + ' handlers wired ✓'); }

// Boot — run AFTER every module has fully evaluated (fixes the circular-import
// init-order bug where init() used to fire before sibling module data existed).
_app_js.init();

# Meditation duration sessions - local review

User requested all three player modes at 1, 2, 3, 5, 10, 15, 30, 45 and 60 minutes, with guidance length adapted to mode and duration.

Unguided: five-second opening and closing bells, no intervening narration. Lightly Guided: 1/2/2/3/3/4/5/7/8 short cues. Guided: 2/3/4/6/10/12/16/20/24 passages. Longer sessions include longer quiet practice periods. Draft text and cue schedules are editable in players/meditation-sessions.js. Existing recorded 10-minute Guided narration is preserved; its original text remains in meditation.html. Other guided sessions use explicitly labelled browser speech, with readable text and an unavailable/error message. Browser voice is not the recorded Rowan voice.

Verification: 27 controlled browser audio/speech lifecycle checks on the built preview pass: start, pause, resume, seek, end bell, completion, replay. Nine duration choices and 27 combinations verified at 1040 and 390 pixels. Switching modes retains duration. No page errors in these checks. Real Chrome found three voices, started speech, decoded and played the existing bell with no media error. No claim of full listening review of all 27 sessions. Frame CSS unchanged against recovery 75e883f. Player guard baseline updated only for the requested duration/script scope after visual checks. Build passes.

Review: http://127.0.0.1:8084/standalone/member-design-test.html?feature=meditation&v=duration-sessions
Regression check: node scripts/check-meditation-sessions.cjs (requires local preview on 8084).

Local review only. Production and account data unchanged. Root work preserved.

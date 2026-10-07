# Goal-heading to-do plus — 2026-10-07 ICT

Scott requested a red plus inside a circle at the right of the goal heading in the Citadel To Do dialog, as marked in image(20261007-125155). Add a matching button to each existing goal group. It opens an inline Your next action field directly under that heading; Add to-do invokes the existing dashboard API with that goal ID. Cancel closes it; unsaved drafts remain while other rows update. Existing bottom form and Notes/Journal behavior remain intact.

Focused mock checks passed: clicking plus opens/focuses input; submitted text passes the selected goal ID; successful save refreshes the group and reports success. Wrapper syntax passed. Rendered/authenticated verification remains blocked by the password wall. No Supabase or player changes; no privacy settings changed.

Review branch review/goal-todo-plus. Production recovery 5f1662a05c411bffbc83957d8fa94340f5e83769. Publishing this focused correction follows Scott's standing instruction for the member build. Bible/Drive synchronization remains pending; this dated checkpoint supplements it.

# Readable silence intervals

Scott reported confusing timestamps and cropped pause labels. Short grey timeline gaps now use striped markers and accessible labels rather than unreadable text. A table below the timeline lists every silence intersecting the three-slide view with explicit Silence starts, Silence ends and Length columns. Clicking a pause label seeks to its start. Gold narration uses separately labeled Start and End times. Closing bell is excluded from silence and identified separately in the final view. Timestamp rounding now handles minute rollover correctly.

Syntax and DOM checks passed for pause table, empty narrow pause markers, labeled narration start, pointer snapping, timing validation, original audio mapping and restart. Actual rendered browser/audio verification pending behind private preview password protection. Review only; production, Supabase and Netlify settings unchanged. Bible update pending.

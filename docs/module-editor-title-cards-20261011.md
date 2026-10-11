# Title cards — 2026-10-11 ICT

Scott clarified title cards must fit between existing cards with the session staying exactly ten minutes. In Review; implementation f6d0dc2d9aad3e750df3be9a8468447b621f860a, PR57.

Each card offers Insert title card after. It initially splits that slide's duration equally, preserving total duration and all existing text. The title field is blank for Scott to supply. Narration remains unchanged; title cards add no spoken text. Existing background retained. Start/end timing fields and cuts allow repositioning. Deleting an inserted title returns its duration to the preceding card. For the existing ten-minute draft these actions preserve 600 seconds; they do not reset an already edited longer draft to ten minutes.

Checks passed for insertion between cards, preservation of original content and session audio, save/reload validation, and deletion with restored duration. Rendered desktop/mobile/audio verification blocked by site password; local browser executable unavailable. Existing production and saved drafts unchanged. Private review checkpoint recorded; external Bible and Drive snapshot pending.

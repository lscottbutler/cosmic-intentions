# The Carousel

The former artwork admin box is now a read-only, borderless 16:9 content carousel. The independent admin text box above it retains its pen and saved content. Legacy Box 1 text is preserved in content_blocks but is no longer displayed or offered as a live editor.

`shared/carousel-feed.json` is the curated content feed. Current entries are Scott's 38 optimized trough designs. New items may use `type: affirmation`, `belief`, `trough`, or another category, with a unique `id` and either plain `text` or an `image` URL. Image entries may provide `smallImage` and `alt`. Text is rendered through textContent, never executable HTML. Adding approved items to this feed and publishing the source refreshes the loop without changing player templates.

The loop changes every 12 seconds with a one-second crossfade after the next image loads. Page visits choose a fresh item; local assignments avoid other pages' current choices and the same page's previous item. Timers pause while the document is hidden or its app page is inactive, and stop when the element is removed. This is client-side presentation, not a scheduled AI content generator. No paid API calls are made.

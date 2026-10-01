// Scott's marked reference: remove only the extra padding facing the artwork.
// Preserve the standard stage border and the spacing facing the outer troughs.
export function removeCitadelJoinPadding(source) {
  const anchor = '    .citadel-note{padding:12px var(--frame-border);background:var(--header)}';
  if (source.split(anchor).length !== 2 || source.includes('#citadelNote{padding-bottom:0}')) {
    throw new Error('Citadel spacing preflight target changed');
  }
  return source.replace(anchor, anchor + '\n    #citadelNote{padding-bottom:0}\n    #citadelBottomNote{padding-top:0}');
}

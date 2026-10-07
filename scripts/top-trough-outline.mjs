// Scott requested a 3px pale grey-white outline on the shared top trough.
export function outlineTopTrough(source) {
  const rule = source.match(/^    \.cap::before\{[^\n]+\}/m)?.[0];
  if (!rule || !rule.includes('border:0;')) throw new Error('Top trough outline target changed');
  return source.replace(rule, rule.replace('border:0;', 'box-sizing:border-box;border:3px solid #ededed;'));
}

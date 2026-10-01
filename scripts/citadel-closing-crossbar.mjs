// Scott's marked reference: remove the gap between Citadel Box 2 and the icon trough.
export function removeCitadelClosingCrossbar(source) {
  const before = '    #citadelBottomNote{padding-top:0}';
  if (source.split(before).length !== 2) throw new Error('Citadel closing crossbar target changed');
  return source.replace(before, '    #citadelBottomNote{padding-block:0}');
}

// Scott's marked reference changes only the Entrepreneur Library player heading.
export function renameLibraryHeading(html) {
  const before = "(action==='daily-habits'?'Habits':item[1]);";
  const after = "(action==='entrepreneur-library'?'Cosmic Library':(action==='daily-habits'?'Habits':item[1]));";
  if (html.includes(after)) return html;
  if (html.split(before).length !== 2) throw new Error('Expected one player-heading expression');
  return html.replace(before, after);
}

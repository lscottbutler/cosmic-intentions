// Review catalogue. Publisher's chapter marks, manually selected; no automatic
// transcript extraction. Keep the video/version and source with every moment.
// Sources checked 2026-09-29. Exercises are CI prompts, not speaker quotations.
export const CONFIDENCE_RESOURCE = {
  id: 'mel-confidence-46', videoId: 'kMtNkJcJn3M',
  title: 'A Toolkit for Confidence', creator: 'Mel Robbins',
  source: 'https://www.melrobbins.com/episode/episode-46/',
  why: 'A practical companion when self-doubt is delaying your next step.',
  time: 'Start with 4½ minutes · 09:21–13:51',
  moments: [
    { start: 561, end: 831, title: 'Confidence begins with trying', takeaway: 'Practise before you feel ready.', practice: 'Choose one small attempt you can make today.' },
    { start: 1229, end: 1350, title: 'Being new can feel uncomfortable', takeaway: 'Treat unfamiliarity as a learning opportunity.', practice: 'Name one skill you are still learning. What would a useful first attempt look like?' },
    { start: 1350, end: 1515, title: 'You can be quiet and confident', takeaway: 'You can contribute without becoming the loudest person.', practice: 'Write one useful question to ask in your next conversation.' },
    { start: 1762, end: 1991, title: 'Take the first physical step', takeaway: 'Give your intention a concrete starting action.', practice: 'Write the first visible action: open the document, draft the question, or make the call.' },
  ],
  podcast: {
    title: 'Toolkit for Building Unstoppable Confidence · Episode 46',
    url: 'https://www.melrobbins.com/episode/episode-46/',
    time: 'Suggested listen: 09:21–13:51 · 4½ min',
    why: 'The same lesson in audio, for a walk or a quiet practice session.',
    takeaway: 'Trying gives you experience to build on.',
    action: 'Record the attempt you will make before your next work session.',
  },
  article: {
    title: 'Bob Mathias on How to Master the Art of Self-Confidence',
    creator: 'James Clear', url: 'https://jamesclear.com/self-confidence',
    time: 'About 3 min read',
    why: 'A short reflection on stepping into uncertainty.',
    takeaway: 'Confidence can grow as you leave familiar ground.',
    action: 'Name one manageable step beyond your current comfort zone.',
  },
};

export function resourceForCard(key) {
  return key === 'SELF CONFIDENT' ? CONFIDENCE_RESOURCE : null;
}

import { User } from '../models/User.js';

/** XP awarded per action. */
export const XP = { lesson: 10, quiz: 15, assignment: 20, courseComplete: 100, review: 5 };

/** Level = every 100 XP. Level 1 starts at 0 XP. */
export const levelFromXp = (xp = 0) => Math.floor((xp || 0) / 100) + 1;

/** Catalog of earnable badges (key → metadata). `icon` maps to a lucide name. */
export const BADGE_CATALOG = {
  'first-lesson': { label: 'First Steps', desc: 'Completed your first lesson', icon: 'footprints' },
  'first-course': { label: 'Course Crusher', desc: 'Completed an entire course', icon: 'trophy' },
  'quiz-rookie': { label: 'Quiz Rookie', desc: 'Took your first quiz', icon: 'help' },
  'sharp-shooter': { label: 'Sharp Shooter', desc: 'Scored 90%+ on a quiz', icon: 'target' },
  'streak-7': { label: 'On Fire', desc: 'Kept a 7-day learning streak', icon: 'flame' },
  'level-5': { label: 'Rising Star', desc: 'Reached level 5', icon: 'star' },
  'level-10': { label: 'Scholar', desc: 'Reached level 10', icon: 'medal' },
};

const dayString = (ms) => {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Award XP, update the daily streak, and grant any newly-earned badges.
 * Fire-and-forget — wrapped so gamification can never break the parent action.
 *
 * Uses atomic `$inc`/conditional `$push` so concurrent awards (e.g. a lesson
 * that also completes a course) never lose updates or duplicate badges.
 */
export async function awardXp(userId, amount, { action, meta = {} } = {}) {
  try {
    // Atomic XP increment → authoritative new total.
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { xp: amount } },
      { new: true, projection: 'xp streak badges' }
    );
    if (!user) return;

    const level = levelFromXp(user.xp);
    const have = new Set((user.badges || []).map((b) => b.key));
    const toAdd = [];
    const add = (key) => { if (!have.has(key)) { toAdd.push(key); have.add(key); } };

    // Daily streak (UTC days).
    const today = dayString(Date.now());
    const streakSet = {};
    let currentStreak = user.streak?.current || 0;
    if (user.streak?.lastActive !== today) {
      const yesterday = dayString(Date.now() - 86_400_000);
      currentStreak = user.streak?.lastActive === yesterday ? currentStreak + 1 : 1;
      streakSet['streak.current'] = currentStreak;
      streakSet['streak.longest'] = Math.max(user.streak?.longest || 0, currentStreak);
      streakSet['streak.lastActive'] = today;
    }

    // Decide badges.
    if (action === 'lesson') add('first-lesson');
    if (action === 'courseComplete' || meta.courseComplete) add('first-course');
    if (action === 'quiz') { add('quiz-rookie'); if ((meta.percentage || 0) >= 90) add('sharp-shooter'); }
    if (currentStreak >= 7) add('streak-7');
    if (level >= 5) add('level-5');
    if (level >= 10) add('level-10');

    if (Object.keys(streakSet).length) {
      await User.updateOne({ _id: userId }, { $set: streakSet });
    }
    // Add each badge atomically and only if missing (dupe-safe under concurrency).
    for (const key of toAdd) {
      await User.updateOne(
        { _id: userId, 'badges.key': { $ne: key } },
        { $push: { badges: { key, earnedAt: new Date() } } }
      );
    }
  } catch {
    /* never throw from gamification */
  }
}

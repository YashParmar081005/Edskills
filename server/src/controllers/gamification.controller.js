import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { levelFromXp, BADGE_CATALOG } from '../services/gamification.service.js';

function levelInfo(xp = 0) {
  const level = levelFromXp(xp);
  return {
    level,
    xpIntoLevel: xp - (level - 1) * 100,
    xpForLevel: 100,
    nextLevelXp: level * 100,
  };
}

/** GET /api/gamification/me */
export const getMyGamification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('xp streak badges').lean();
  const xp = user?.xp || 0;
  const rank = (await User.countDocuments({ xp: { $gt: xp } })) + 1;
  const badges = (user?.badges || []).map((b) => ({
    key: b.key,
    earnedAt: b.earnedAt,
    ...(BADGE_CATALOG[b.key] || { label: b.key, desc: '', icon: 'medal' }),
  }));

  res.json({
    success: true,
    xp,
    ...levelInfo(xp),
    streak: user?.streak || { current: 0, longest: 0 },
    badges,
    rank,
    catalog: BADGE_CATALOG,
  });
});

/** GET /api/gamification/leaderboard */
export const getLeaderboard = asyncHandler(async (req, res) => {
  const top = await User.find({ xp: { $gt: 0 } })
    .sort({ xp: -1 })
    .limit(20)
    .select('name avatar xp role')
    .lean();

  const me = await User.findById(req.user._id).select('xp').lean();
  const myXp = me?.xp || 0;
  const myRank = (await User.countDocuments({ xp: { $gt: myXp } })) + 1;

  res.json({
    success: true,
    leaders: top.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      xp: u.xp,
      level: levelFromXp(u.xp),
    })),
    me: { rank: myRank, xp: myXp, level: levelFromXp(myXp) },
  });
});

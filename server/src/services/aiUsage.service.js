import { AiUsage } from '../models/AiUsage.js';
import { estimateCost } from '../config/aiPricing.js';

/**
 * Record one AI completion's token usage + estimated cost (fire-and-forget).
 * @param {object} o
 * @param {string|ObjectId} [o.user]
 * @param {string} [o.type]
 * @param {string} [o.model]
 * @param {{prompt_tokens?:number, completion_tokens?:number, total_tokens?:number}} [o.usage]
 */
export function recordAiUsage({ user, type = 'chat', model = '', usage } = {}) {
  if (!usage) return;
  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || promptTokens + completionTokens;
  const costUsd = estimateCost(model, promptTokens, completionTokens);

  // Don't let logging failures affect the request.
  AiUsage.create({ user, type, model, promptTokens, completionTokens, totalTokens, costUsd }).catch(
    () => {}
  );
}

const round = (n) => Math.round((n + Number.EPSILON) * 1e6) / 1e6;

/** Aggregate AI usage for the admin dashboard. */
export async function getAiUsageSummary() {
  const [totals, byType, recent, topUsers] = await Promise.all([
    AiUsage.aggregate([
      {
        $group: {
          _id: null,
          calls: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
          cost: { $sum: '$costUsd' },
        },
      },
    ]),
    AiUsage.aggregate([
      {
        $group: {
          _id: '$type',
          calls: { $sum: 1 },
          tokens: { $sum: '$totalTokens' },
          cost: { $sum: '$costUsd' },
        },
      },
      { $sort: { tokens: -1 } },
    ]),
    AiUsage.find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('user', 'name email role')
      .lean(),
    AiUsage.aggregate([
      { $match: { user: { $ne: null } } },
      { $group: { _id: '$user', tokens: { $sum: '$totalTokens' }, cost: { $sum: '$costUsd' }, calls: { $sum: 1 } } },
      { $sort: { tokens: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$user.name', role: '$user.role', tokens: 1, cost: 1, calls: 1 } },
    ]),
  ]);

  const t = totals[0] || { calls: 0, tokens: 0, cost: 0 };
  return {
    totals: { calls: t.calls, tokens: t.tokens, cost: round(t.cost) },
    byType: byType.map((x) => ({ type: x._id || 'other', calls: x.calls, tokens: x.tokens, cost: round(x.cost) })),
    topUsers: topUsers.map((x) => ({ name: x.name || '—', role: x.role || '', tokens: x.tokens, cost: round(x.cost), calls: x.calls })),
    recent: recent.map((r) => ({
      id: r._id,
      type: r.type,
      user: r.user?.name || '—',
      role: r.user?.role || '',
      tokens: r.totalTokens,
      cost: round(r.costUsd),
      at: r.createdAt,
    })),
  };
}

/**
 * Approximate Groq pricing (USD per 1,000,000 tokens) so we can estimate the
 * cost of AI usage. Update these if Groq changes pricing or you swap models.
 */
export const AI_PRICING = {
  'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  'llama-3.1-8b-instant': { input: 0.05, output: 0.08 },
  'llama3-70b-8192': { input: 0.59, output: 0.79 },
  default: { input: 0.6, output: 0.8 },
};

/** Estimate the USD cost of a single completion. */
export function estimateCost(model, promptTokens = 0, completionTokens = 0) {
  const p = AI_PRICING[model] || AI_PRICING.default;
  const cost = (promptTokens / 1e6) * p.input + (completionTokens / 1e6) * p.output;
  return Math.round(cost * 1e6) / 1e6; // 6 dp
}

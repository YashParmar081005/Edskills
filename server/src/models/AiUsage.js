import mongoose from 'mongoose';

/** One row per AI completion — powers admin token/cost reporting. */
const aiUsageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, default: 'chat', index: true }, // chat | quiz | grade | ask | flashcards | mock-test | doc-qa | avatar | assignment-grade
    model: { type: String, default: '' },
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    costUsd: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AiUsage = mongoose.model('AiUsage', aiUsageSchema);
export default AiUsage;

import mongoose from 'mongoose';

/**
 * Stores searchable lesson-content chunks for course Q&A (RAG).
 * Retrieval uses a MongoDB text index here; a real vector field can be added
 * later for Atlas Vector Search without changing the rest of the pipeline.
 */
const embeddingSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true,
    },
    lessonTitle: { type: String, default: '' }, // denormalized for citations
    chunkText: { type: String, required: true },
    chunkIndex: { type: Number, default: 0 },
    // vector: [Number]  // reserved for future Atlas Vector Search
  },
  { timestamps: true }
);

embeddingSchema.index({ chunkText: 'text' });

export const Embedding = mongoose.model('Embedding', embeddingSchema);
export default Embedding;

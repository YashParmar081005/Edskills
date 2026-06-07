import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    // Public, shareable identifier used for verification.
    certificateId: { type: String, required: true, unique: true, index: true },
    pdfUrl: { type: String, default: '' }, // Cloudinary copy (best-effort)
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One certificate per student per course.
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

export const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;

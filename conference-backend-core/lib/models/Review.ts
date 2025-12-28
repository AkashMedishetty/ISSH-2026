import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IReview extends Document {
  abstractId: Types.ObjectId
  abstractCode: string // ABS-NTI-XXX
  reviewerId: Types.ObjectId

  // Assignment context
  track: string
  category?: string
  subcategory?: string

  // Scoring
  scores: {
    originality?: number
    methodology?: number
    relevance?: number
    clarity?: number
    overall?: number // Simple overall score 1-10
  }
  comments?: string
  recommendation: 'accept' | 'reject' | 'minor-revision' | 'major-revision'
  submittedAt: Date
}

const ReviewSchema = new Schema<IReview>({
  abstractId: { type: Schema.Types.ObjectId, ref: 'Abstract', required: true, index: true },
  abstractCode: { type: String, required: true, index: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  track: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },

  scores: {
    originality: { type: Number, min: 0, max: 10 },
    methodology: { type: Number, min: 0, max: 10 },
    relevance: { type: Number, min: 0, max: 10 },
    clarity: { type: Number, min: 0, max: 10 },
    overall: { type: Number, min: 1, max: 10 }
  },
  comments: { type: String },
  recommendation: { type: String, enum: ['accept', 'reject', 'minor-revision', 'major-revision'], required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true })

ReviewSchema.index({ reviewerId: 1, abstractId: 1 }, { unique: true })

export default (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>('Review', ReviewSchema)



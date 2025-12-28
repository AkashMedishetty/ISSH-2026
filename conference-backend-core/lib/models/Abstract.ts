import mongoose, { Document, Schema, Types } from 'mongoose'

export type AbstractStatus =
  | 'submitted' // initial submitted
  | 'under-review'
  | 'accepted'
  | 'rejected'
  | 'final-submitted'

export interface IAbstractFile {
  originalName: string
  mimeType: string
  fileSizeBytes: number
  storagePath: string
  uploadedAt: Date
}

export interface IAbstract extends Document {
  // Core identifiers
  abstractId: string // ABS-NTI-XXX
  userId: Types.ObjectId
  registrationId: string

  // Classification
  track: string // e.g., Free Paper, Poster Presentation, E-Poster
  category?: string
  subcategory?: string

  // Content
  title: string
  authors: string[]
  keywords?: string[]
  wordCount?: number

  // Lifecycle
  status: AbstractStatus
  submittedAt: Date

  // Initial submission
  initial: {
    file?: IAbstractFile
    notes?: string
  }

  // Final submission (same ID with "-F" suffix for display)
  final?: {
    file?: IAbstractFile
    submittedAt?: Date
    displayId?: string // e.g., ABS-NTI-042-F
    notes?: string
  }

  // Review and decisions
  averageScore?: number
  decisionAt?: Date

  // Reviewer assignment
  assignedReviewerIds?: Types.ObjectId[]
}

const AbstractFileSchema = new Schema<IAbstractFile>({
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
  storagePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
})

const AbstractSchema = new Schema<IAbstract>({
  abstractId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  registrationId: { type: String, required: true, index: true },

  track: { type: String, required: true },
  category: { type: String },
  subcategory: { type: String },

  title: { type: String, required: true },
  authors: { type: [String], default: [] },
  keywords: { type: [String], default: [] },
  wordCount: { type: Number },

  status: { type: String, enum: ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted'], default: 'submitted', index: true },
  submittedAt: { type: Date, default: Date.now },

  initial: {
    file: { type: AbstractFileSchema, required: false },
    notes: { type: String }
  },

  final: {
    file: { type: AbstractFileSchema, required: false },
    submittedAt: { type: Date },
    displayId: { type: String },
    notes: { type: String }
  },

  averageScore: { type: Number },
  decisionAt: { type: Date },
  assignedReviewerIds: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }]
}, { timestamps: true })

AbstractSchema.index({ track: 1, category: 1, subcategory: 1 })

export default (mongoose.models.Abstract as mongoose.Model<IAbstract>) ||
  mongoose.model<IAbstract>('Abstract', AbstractSchema)



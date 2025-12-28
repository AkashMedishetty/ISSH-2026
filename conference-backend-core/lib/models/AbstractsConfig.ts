import mongoose, { Document, Schema } from 'mongoose'

export interface IAbstractsConfig extends Document {
  isEnabled: boolean
  submissionOpenDate: Date
  submissionCloseDate: Date
  topics: Array<{
    id: string
    name: string
    description?: string
    subtopics: Array<{
      id: string
      name: string
    }>
  }>
  presentationCategories: Array<{
    id: string
    name: string
    description?: string
  }>
  guidelines: {
    general: string
    freePaper: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    poster: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
  }
  fileRequirements: {
    maxSizeKB: number
    allowedFormats: string[]
    templateUrl?: string
  }
  notifications: {
    confirmationEmail: boolean
    reviewStatusEmail: boolean
    reminderEmails: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const AbstractsConfigSchema = new Schema<IAbstractsConfig>({
  isEnabled: {
    type: Boolean,
    default: true
  },
  submissionOpenDate: {
    type: Date,
    required: true
  },
  submissionCloseDate: {
    type: Date,
    required: true
  },
  topics: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
    subtopics: [{
      id: { type: String, required: true },
      name: { type: String, required: true }
    }]
  }],
  presentationCategories: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: String
  }],
  guidelines: {
    general: { type: String, default: '' },
    freePaper: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Free Paper Presentation' },
      wordLimit: { type: Number, default: 250 },
      requirements: [{ type: String }],
      format: { type: String, default: '' }
    },
    poster: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: 'Poster Presentation' },
      wordLimit: { type: Number, default: 250 },
      requirements: [{ type: String }],
      format: { type: String, default: '' }
    }
  },
  fileRequirements: {
    maxSizeKB: { type: Number, default: 5120 }, // 5MB
    allowedFormats: [{ type: String, default: ['.doc', '.docx'] }],
    templateUrl: String
  },
  notifications: {
    confirmationEmail: { type: Boolean, default: true },
    reviewStatusEmail: { type: Boolean, default: true },
    reminderEmails: { type: Boolean, default: false }
  }
}, {
  timestamps: true
})

// Ensure only one config document exists
AbstractsConfigSchema.index({ _id: 1 }, { unique: true })

export default mongoose.models.AbstractsConfig || mongoose.model<IAbstractsConfig>('AbstractsConfig', AbstractsConfigSchema)

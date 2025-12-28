import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IEmailHistory extends Document {
  subject: string
  template: string
  content?: string
  sentAt: Date
  recipientCount: number
  successCount: number
  failureCount: number
  sentBy: string
  recipients?: Array<{
    email: string
    name: string
    status: 'sent' | 'failed'
  }>
  errorMessages?: string[]
}

const EmailHistorySchema = new Schema<IEmailHistory>({
  subject: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  content: {
    type: String
  },
  sentAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  recipientCount: {
    type: Number,
    required: true
  },
  successCount: {
    type: Number,
    required: true
  },
  failureCount: {
    type: Number,
    required: true
  },
  sentBy: {
    type: String,
    required: true
  },
  recipients: [{
    email: String,
    name: String,
    status: {
      type: String,
      enum: ['sent', 'failed']
    }
  }],
  errorMessages: [String]
}, {
  timestamps: true
})

// Indexes
EmailHistorySchema.index({ sentAt: -1 })
EmailHistorySchema.index({ sentBy: 1 })
EmailHistorySchema.index({ template: 1 })

const EmailHistory: Model<IEmailHistory> = mongoose.models.EmailHistory || mongoose.model<IEmailHistory>('EmailHistory', EmailHistorySchema)

export default EmailHistory

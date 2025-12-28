import mongoose, { Document, Schema } from 'mongoose'

export interface IWorkshop extends Document {
  id: string
  name: string
  description: string
  instructor: string
  duration: string
  price: number
  currency: string
  maxSeats: number
  bookedSeats: number
  availableSeats: number
  registrationStart: Date
  registrationEnd: Date
  workshopDate: Date
  workshopTime: string
  venue: string
  prerequisites?: string
  materials?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const WorkshopSchema = new Schema<IWorkshop>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['INR', 'USD'],
    default: 'INR'
  },
  maxSeats: {
    type: Number,
    required: true,
    min: 1
  },
  bookedSeats: {
    type: Number,
    default: 0,
    min: 0
  },
  registrationStart: {
    type: Date,
    required: true
  },
  registrationEnd: {
    type: Date,
    required: true
  },
  workshopDate: {
    type: Date,
    required: true
  },
  workshopTime: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  prerequisites: {
    type: String,
    trim: true
  },
  materials: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual for available seats
WorkshopSchema.virtual('availableSeats').get(function() {
  return this.maxSeats - this.bookedSeats
})

// Virtual for registration status
WorkshopSchema.virtual('registrationStatus').get(function() {
  const now = new Date()
  if (now < this.registrationStart) return 'not-started'
  if (now > this.registrationEnd) return 'closed'
  if (this.bookedSeats >= this.maxSeats) return 'full'
  return 'open'
})

// Virtual for is full
WorkshopSchema.virtual('isFull').get(function() {
  return this.bookedSeats >= this.maxSeats
})

// Virtual for can register
WorkshopSchema.virtual('canRegister').get(function() {
  const now = new Date()
  return this.isActive && 
         now >= this.registrationStart && 
         now <= this.registrationEnd && 
         this.bookedSeats < this.maxSeats
})

// Index for efficient queries
WorkshopSchema.index({ isActive: 1, registrationStart: 1, registrationEnd: 1 })
WorkshopSchema.index({ id: 1 }, { unique: true })

export default mongoose.models.Workshop || mongoose.model<IWorkshop>('Workshop', WorkshopSchema)
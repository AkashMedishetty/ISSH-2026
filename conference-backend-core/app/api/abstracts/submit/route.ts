import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Generate unique abstract ID in format: RegID-ABS-XX
async function generateAbstractId(registrationId: string): Promise<string> {
  // Generate random 2-digit number
  const randomNum = Math.floor(Math.random() * 90) + 10 // 10-99
  
  const baseId = `${registrationId}-ABS-${randomNum.toString().padStart(2, '0')}`
  
  // Check if this ID already exists
  const existing = await Abstract.findOne({ abstractId: baseId })
  if (existing) {
    // If exists, try with a different random number
    const newRandomNum = Math.floor(Math.random() * 90) + 10
    return `${registrationId}-ABS-${newRandomNum.toString().padStart(2, '0')}`
  }
  
  return baseId
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const title = formData.get('title') as string
    const track = formData.get('track') as string
    const authorsStr = formData.get('authors') as string
    const abstractContent = formData.get('abstract') as string
    const keywordsStr = formData.get('keywords') as string
    const registrationId = formData.get('registrationId') as string
    const file = formData.get('file') as File

    if (!title || !track || !authorsStr || !abstractContent || !registrationId) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate word count (approximately 150 words)
    const wordCount = abstractContent.split(' ').filter(word => word.length > 0).length
    if (wordCount > 150) {
      return NextResponse.json(
        { success: false, message: 'Abstract must not exceed 150 words' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find user by registration ID
    const user = await User.findOne({
      'registration.registrationId': registrationId
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid registration ID' },
        { status: 401 }
      )
    }

    // Check submission limits - one abstract per track/category
    const existingAbstracts = await Abstract.find({ userId: user._id })
    
    // Check if user already has an abstract in this track
    const existingInTrack = existingAbstracts.find(abs => abs.track === track)
    if (existingInTrack) {
      return NextResponse.json(
        { success: false, message: `You can only submit one abstract per category. You already have a submission in "${track}" category with ID: ${existingInTrack.abstractId}` },
        { status: 400 }
      )
    }

    // Generate unique abstract ID
    const abstractId = await generateAbstractId(registrationId)

    // Handle file upload if provided
    let fileData = null
    if (file && file.size > 0) {
      // Validate file type
      const allowedTypes = ['.doc', '.docx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        return NextResponse.json(
          { success: false, message: 'Only Word documents (.doc, .docx) are allowed' },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'abstracts')
      await mkdir(uploadsDir, { recursive: true })

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `${abstractId}-${timestamp}${fileExtension}`
      const filepath = path.join(uploadsDir, filename)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      fileData = {
        originalName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePath: filepath,
        uploadedAt: new Date()
      }
    }

    // Parse authors and keywords
    const authors = authorsStr.split(',').map(author => author.trim()).filter(author => author.length > 0)
    const keywords = keywordsStr ? keywordsStr.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0) : []

    // Find available reviewers for auto-assignment
    const availableReviewers = await User.find({
      role: 'reviewer',
      isActive: true
    }).select('_id')

    console.log(`📋 Auto-assigning abstract to ${availableReviewers.length} reviewers`)

    // Save the abstract with auto-assignment
    const abstract = await Abstract.create({
      abstractId,
      userId: user._id,
      registrationId,
      track,
      title,
      authors,
      keywords,
      wordCount,
      status: 'submitted',
      initial: {
        file: fileData,
        notes: abstractContent
      },
      // Auto-assign to all available reviewers
      assignedReviewerIds: availableReviewers.map(reviewer => reviewer._id)
    })

    // Send confirmation email
    try {
      await EmailService.sendAbstractSubmissionConfirmation({
        email: user.email,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email,
        registrationId: user.registration.registrationId,
        abstractId: abstract.abstractId,
        title: abstract.title,
        track: abstract.track,
        authors: abstract.authors,
        submittedAt: abstract.submittedAt.toISOString()
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the submission if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        abstractId: abstract.abstractId,
        title: abstract.title,
        track: abstract.track,
        status: abstract.status,
        submittedAt: abstract.submittedAt
      }
    })

  } catch (error) {
    console.error('Abstract submission error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    await connectDB()

    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const abstractId = formData.get('abstractId') as string
    const file = formData.get('file') as File
    const notes = formData.get('notes') as string

    if (!abstractId) {
      return NextResponse.json({ success: false, message: 'Abstract ID is required' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ success: false, message: 'Final presentation file is required' }, { status: 400 })
    }

    // Find the abstract
    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Check if user owns this abstract
    if (abstract.userId.toString() !== userId) {
      return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 })
    }

    // Check if abstract is accepted
    if (abstract.status !== 'accepted') {
      return NextResponse.json({ 
        success: false, 
        message: 'Final submission is only allowed for accepted abstracts' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, message: 'Only PDF, PowerPoint, and Word documents are allowed' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'abstracts', 'final')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${abstract.abstractId}-final-${timestamp}${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate final display ID
    const finalDisplayId = `${abstract.abstractId}-F`

    // Update abstract with final submission
    abstract.final = {
      file: {
        originalName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        storagePath: filepath,
        uploadedAt: new Date()
      },
      submittedAt: new Date(),
      displayId: finalDisplayId,
      notes: notes || ''
    }
    
    abstract.status = 'final-submitted'
    await abstract.save()

    // Send confirmation email
    try {
      await EmailService.sendFinalSubmissionConfirmation({
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile?.firstName || user.firstName || ''} ${user.profile?.lastName || user.lastName || ''}`.trim() || user.email,
        registrationId: user.registration?.registrationId || 'N/A',
        abstractId: abstract.abstractId,
        finalDisplayId,
        title: abstract.title,
        track: abstract.track || 'N/A',
        authors: abstract.authors,
        submittedAt: abstract.final.submittedAt?.toISOString() || new Date().toISOString(),
        fileName: file.name
      })
      
      console.log(`✅ Final submission email sent to ${user.email} for abstract ${abstract.abstractId}`)
    } catch (emailError) {
      console.error('Failed to send final submission email:', emailError)
      // Don't fail the submission if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Final submission uploaded successfully',
      data: {
        abstractId: abstract.abstractId,
        finalDisplayId,
        submittedAt: abstract.final.submittedAt,
        filename: file.name
      }
    })

  } catch (error) {
    console.error('Error in final submission:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

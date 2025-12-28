import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'
import { EmailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { abstractId, decision, comments } = await request.json()

    if (!abstractId || !decision) {
      return NextResponse.json({ success: false, message: 'Abstract ID and decision are required' }, { status: 400 })
    }

    if (!['accept', 'reject'].includes(decision)) {
      return NextResponse.json({ success: false, message: 'Decision must be either "accept" or "reject"' }, { status: 400 })
    }

    await connectDB()

    // Check if user is a reviewer
    const user = await User.findById(userId)
    if (!user || user.role !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Reviewer access required' }, { status: 403 })
    }

    // Find the abstract
    const abstract = await Abstract.findById(abstractId)
    if (!abstract) {
      return NextResponse.json({ success: false, message: 'Abstract not found' }, { status: 404 })
    }

    // Check if this reviewer is assigned to this abstract
    if (!abstract.assignedReviewerIds?.includes(userId)) {
      return NextResponse.json({ success: false, message: 'You are not assigned to review this abstract' }, { status: 403 })
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      abstractId: abstract._id,
      reviewerId: userId
    })

    if (existingReview) {
      return NextResponse.json({ success: false, message: 'You have already reviewed this abstract' }, { status: 400 })
    }

    // Create the review
    const review = await Review.create({
      abstractId: abstract._id,
      abstractCode: abstract.abstractId,
      reviewerId: userId,
      track: abstract.track,
      category: abstract.category,
      subcategory: abstract.subcategory,
      scores: {},
      comments: comments || '', // Allow empty comments
      recommendation: decision
    })

    // Update abstract status to under-review if not already
    if (abstract.status === 'submitted') {
      abstract.status = 'under-review'
      await abstract.save()
    }

    // Check if all assigned reviewers have submitted
    const allReviews = await Review.find({ abstractId: abstract._id })
    const assignedReviewerCount = abstract.assignedReviewerIds?.length || 0
    
    if (allReviews.length === assignedReviewerCount && assignedReviewerCount > 0) {
      // Calculate consensus - if majority accept, mark as accepted
      const acceptCount = allReviews.filter(r => r.recommendation === 'accept').length
      const rejectCount = allReviews.filter(r => r.recommendation === 'reject').length
      
      if (acceptCount > rejectCount) {
        abstract.status = 'accepted'
      } else {
        abstract.status = 'rejected'
      }
      await abstract.save()
    }

    // Send email notification if abstract is accepted
    if (decision === 'accept') {
      try {
        // Get the abstract with user data for email
        const abstractWithUser = await Abstract.findById(abstract._id).populate('userId')
        
        if (abstractWithUser && abstractWithUser.userId) {
          const user = abstractWithUser.userId as any
          
          await EmailService.sendAbstractAcceptance({
            email: user.email,
            name: `${user.profile?.firstName || user.firstName || ''} ${user.profile?.lastName || user.lastName || ''}`.trim() || user.email,
            registrationId: user.registration?.registrationId || 'N/A',
            abstractId: abstractWithUser.abstractId,
            title: abstractWithUser.title,
            track: abstractWithUser.track,
            authors: abstractWithUser.authors,
            reviewedAt: new Date().toISOString()
          })
          
          console.log(`✅ Acceptance email sent to ${user.email} for abstract ${abstractWithUser.abstractId}`)
        }
      } catch (emailError) {
        console.error('Failed to send acceptance email:', emailError)
        // Don't fail the review submission if email fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: review,
      message: 'Review submitted successfully' 
    })

  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

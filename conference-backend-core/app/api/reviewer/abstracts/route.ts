import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import Review from '@/lib/models/Review'
import User from '@/lib/models/User'

// GET: List abstracts assigned to the reviewer with existing reviews
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    // Check if user is a reviewer
    const user = await User.findById((session.user as any).id)
    if (!user || user.role !== 'reviewer') {
      return NextResponse.json({ success: false, message: 'Reviewer access required' }, { status: 403 })
    }

    // Get abstracts assigned to this reviewer with user data (include all statuses)
    const abstracts = await Abstract.find({
      assignedReviewerIds: { $in: [(session.user as any).id] },
      status: { $in: ['submitted', 'under-review', 'accepted', 'rejected', 'final-submitted'] }
    })
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration profile'
      })
      .lean()

    // Get existing reviews for these abstracts by this reviewer
    const abstractIds = abstracts.map(a => a._id)
    const existingReviews = await Review.find({
      abstractId: { $in: abstractIds },
      reviewerId: (session.user as any).id
    }).lean()

    // Combine abstracts with their reviews
    const abstractsWithReviews = abstracts.map(abstract => {
      const review = existingReviews.find(r => r.abstractId.toString() === abstract._id.toString())
      
      return {
        ...abstract,
        existingReview: review ? {
          decision: review.recommendation,
          comments: review.comments,
          reviewedAt: (review as any).createdAt
        } : null
      }
    })

    // Sort: Unreviewed abstracts first (by submission date desc), then reviewed abstracts (by review date desc)
    const sortedAbstracts = abstractsWithReviews.sort((a, b) => {
      // If one has review and other doesn't, unreviewed comes first
      if (a.existingReview && !b.existingReview) return 1
      if (!a.existingReview && b.existingReview) return -1
      
      // If both have reviews or both don't have reviews, sort by date (newest first)
      if (a.existingReview && b.existingReview) {
        return new Date(b.existingReview.reviewedAt).getTime() - new Date(a.existingReview.reviewedAt).getTime()
      } else {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      }
    })

    return NextResponse.json({ success: true, data: sortedAbstracts })

  } catch (error) {
    console.error('Error fetching reviewer abstracts:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}



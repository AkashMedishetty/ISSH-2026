import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Abstract from '@/lib/models/Abstract'
import User from '@/lib/models/User'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    await connectDB()
    const userId = (session.user as any).id
    const user = await User.findById(userId)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 })
    }

    // Fetch all abstracts with user details
    const abstracts = await Abstract.find({})
      .populate({
        path: 'userId',
        select: 'firstName lastName email registration.registrationId'
      })
      .sort({ submittedAt: -1 })
      .lean()

    return NextResponse.json({ success: true, data: abstracts })

  } catch (error) {
    console.error('Error fetching abstracts:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

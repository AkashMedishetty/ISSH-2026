import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { registrationId, password } = await request.json()

    if (!registrationId || !password) {
      return NextResponse.json(
        { success: false, message: 'Registration ID and password are required' },
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

    // Check if user has completed registration and payment
    const validStatuses = ['completed', 'paid']
    if (!validStatuses.includes(user.registration.status)) {
      return NextResponse.json(
        { success: false, message: 'Registration must be completed and payment verified before submitting abstracts' },
        { status: 403 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        registrationId: user.registration.registrationId,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email
      }
    })

  } catch (error) {
    console.error('Registration verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

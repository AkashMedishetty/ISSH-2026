import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      currency = 'INR', 
      discountCode,
      userId, // For registration flow (no session)
      registrationId, // For registration flow (no session)
      email, // For registration flow (no session)
      name // For registration flow (no session)
    } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid amount'
      }, { status: 400 })
    }

    await connectDB()

    // Check if this is an authenticated request (logged-in user)
    const session = await getServerSession(authOptions)
    
    let orderNotes: any = {}
    let receiptId = ''

    const sessionUser = session?.user as any
    if (sessionUser?.id) {
      // AUTHENTICATED FLOW - User is logged in
      const user = await User.findById(sessionUser.id)
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 })
      }

      receiptId = user.registration.registrationId
      orderNotes = {
        registrationId: user.registration.registrationId,
        userId: user._id.toString(),
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        discountCode: discountCode || '',
        registrationType: user.registration.type
      }
    } else if (userId && registrationId) {
      // PUBLIC FLOW - Registration/Guest payment (no session required)
      // Verify the user exists in database
      const user = await User.findById(userId)
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'Invalid user ID'
        }, { status: 400 })
      }

      receiptId = registrationId
      orderNotes = {
        registrationId,
        userId,
        email: email || user.email,
        name: name || `${user.profile.firstName} ${user.profile.lastName}`,
        discountCode: discountCode || '',
        registrationType: user.registration.type
      }
    } else if (registrationId && email && name) {
      // PRE-PAYMENT FLOW - Order created before user registration (payment gateway)
      // No user exists yet, will be created after successful payment
      receiptId = registrationId
      orderNotes = {
        registrationId,
        email,
        name,
        discountCode: discountCode || '',
        pendingRegistration: true // Flag to indicate user not yet created
      }
    } else {
      // Neither session nor userId provided
      return NextResponse.json({
        success: false,
        message: 'Authentication required or user details must be provided'
      }, { status: 401 })
    }

    // Convert amount to smallest currency unit (paise for INR, cents for USD)
    const amountInSmallestUnit = Math.round(amount * 100)

    // Create Razorpay order
    const orderOptions = {
      amount: amountInSmallestUnit,
      currency: currency,
      receipt: `receipt_${receiptId}_${Date.now()}`,
      notes: orderNotes
    }

    const order = await razorpay.orders.create(orderOptions)

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    })

  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create payment order'
    }, { status: 500 })
  }
}
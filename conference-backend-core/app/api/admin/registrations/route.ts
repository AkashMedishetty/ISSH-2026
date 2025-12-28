import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/lib/models/User"
import Payment from "@/lib/models/Payment"
import { generateRegistrationId } from "@/lib/utils/generateId"
import { EmailService } from "@/lib/email/service"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const users = await User.find({
      'registration.registrationId': { $exists: true }
    }).select('-password -activeSessions').sort({ 'registration.registrationDate': -1 })

    // Get payment information for each user
    const usersWithPayments = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject()

        // Prefer embedded user.payment (bank-transfer flow); fallback to Payment collection
        let paymentInfo = null as null | {
          amount: number
          currency: string
          transactionId?: string
          paymentDate?: Date
          status?: string
          breakdown?: any
        }

        if (userObj.payment && typeof userObj.payment.amount === 'number') {
          paymentInfo = {
            amount: userObj.payment.amount,
            currency: 'INR',
            transactionId: userObj.payment.bankTransferUTR || userObj.payment.transactionId,
            paymentDate: userObj.payment.paymentDate,
            status: userObj.payment.status,
          }
        } else {
          const payment = await Payment.findOne({ userId: user._id }).sort({ createdAt: -1 })
          if (payment) {
            paymentInfo = {
              amount: payment.amount.total,
              currency: payment.amount.currency,
              transactionId: payment.razorpayPaymentId,
              paymentDate: payment.transactionDate,
              status: payment.status,
              breakdown: payment.breakdown
            }
          }
        }

        return {
          ...userObj,
          paymentInfo
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: usersWithPayments
    })

  } catch (error) {
    console.error("Get registrations error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()

    // Generate registration ID using proper format
    let registrationId = await generateRegistrationId()
    
    // Ensure registration ID is unique
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      const existingReg = await User.findOne({ 
        'registration.registrationId': registrationId 
      })
      if (!existingReg) {
        isUnique = true
      } else {
        registrationId = await generateRegistrationId()
        attempts++
      }
    }

    if (!isUnique) {
      return NextResponse.json({
        success: false,
        message: 'Failed to generate unique registration ID'
      }, { status: 500 })
    }

    const userData = {
      ...body,
      registration: {
        ...body.registration,
        registrationId,
        registrationDate: new Date().toISOString(),
        accompanyingPersons: [],
        workshopSelections: body.registration.workshopSelections || []
      },
      role: 'user'
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Create new user
    const user = await User.create(userData)
    
    // Send registration confirmation email
    try {
      // Get registration type label from conference config
      const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
      const registrationCategory = conferenceConfig.registration.categories.find(
        (cat: any) => cat.key === user.registration.type
      )
      const registrationTypeLabel = registrationCategory?.label || user.registration.type
      
      await EmailService.sendRegistrationConfirmation({
        email: user.email,
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        registrationId: user.registration.registrationId,
        registrationType: user.registration.type,
        registrationTypeLabel: registrationTypeLabel,
        workshopSelections: user.registration.workshopSelections || [],
        accompanyingPersons: user.registration.accompanyingPersons?.length || 0
      })
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError)
      // Don't fail the registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration created successfully",
      data: user
    })

  } catch (error) {
    console.error("Create registration error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
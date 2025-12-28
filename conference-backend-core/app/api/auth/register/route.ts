import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { EmailService } from '@/lib/email/service'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      password,
      profile,
      registration,
      payment
    } = body

    // Validate required fields
    if (!email || !password || !profile?.firstName || !profile?.lastName || !profile?.mciNumber) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 })
    }

    await connectDB()
    console.log('Database connected successfully')

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase() 
    })

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate unique registration ID
    let registrationId = await generateRegistrationId()
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

    // Create new user
    console.log('Creating user with data:', {
      email: email.toLowerCase(),
      profile: profile,
      registration: registration
    })
    
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      profile: {
        title: profile.title,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        designation: profile.designation,
        institution: profile.institution,
        address: {
          street: profile.address?.street || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
          country: profile.address?.country || '',
          pincode: profile.address?.pincode || ''
        },
        dietaryRequirements: profile.dietaryRequirements || '',
        mciNumber: profile.mciNumber,
        specialNeeds: profile.specialNeeds || ''
      },
      registration: {
        registrationId,
        type: registration?.type || 'non-member',
        status: 'pending',
        tier: body?.payment?.tier || body?.currentTier || undefined,
        membershipNumber: registration?.membershipNumber || '',
        workshopSelections: registration?.workshopSelections || [],
        // Backward compatibility: if model still requires age, provide a sensible default
        accompanyingPersons: (registration?.accompanyingPersons || []).map((p: any) => ({
          name: p.name,
          relationship: p.relationship,
          dietaryRequirements: p.dietaryRequirements || '',
          age: p.age ?? 18
        })),
        registrationDate: new Date()
      },
      payment: payment ? {
        method: payment.method || 'bank-transfer',
        status: payment.status || 'pending',
        amount: payment.amount || 0,
        bankTransferUTR: payment.bankTransferUTR,
        paymentDate: new Date()
      } : undefined,
      role: 'user',
      isActive: true
    })
    
    console.log('User created successfully:', {
      id: newUser._id,
      email: newUser.email,
      registrationId: newUser.registration.registrationId
    })

    // Check payment method - if pay-now (gateway), DON'T create user yet
    // Instead, return pending registration data for payment completion
    if (payment?.method === 'pay-now') {
      try {
        // Delete the just-created user - we'll create it after payment success
        await User.findByIdAndDelete(newUser._id)
        console.log('Temporary user deleted - will create after payment success')

        // Generate registration ID for order notes
        const tempRegistrationId = registrationId

        // Create Razorpay order WITHOUT creating user in database
        // Convert amount to smallest currency unit (paise for INR)
        const amountInSmallestUnit = Math.round(payment.amount * 100)

        const orderOptions: any = {
          amount: amountInSmallestUnit,
          currency: 'INR',
          receipt: `receipt_${tempRegistrationId}_${Date.now()}`,
          notes: {
            registrationId: tempRegistrationId,
            email: email.toLowerCase(),
            name: `${profile.firstName} ${profile.lastName}`,
            pendingRegistration: true // Flag to indicate user not yet created
          }
        }

        const order: any = await razorpay.orders.create(orderOptions)
        
        if (order && order.id) {
          console.log('Razorpay order created (pre-payment):', order.id)

          // Return order details + registration data for later user creation
          return NextResponse.json({
            success: true,
            message: 'Payment order created, complete payment to register',
            requiresPayment: true,
            data: {
              razorpayOrder: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
              },
              razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              // Store registration data to create user after payment
              pendingRegistration: {
                email: email.toLowerCase(),
                password: hashedPassword,
                profile,
                registration,
                payment,
                registrationId: tempRegistrationId
              }
            }
          }, { status: 201 })
        } else {
          console.error('Failed to create Razorpay order: No order ID received')
          return NextResponse.json({
            success: false,
            message: 'Failed to create payment order'
          }, { status: 500 })
        }
      } catch (paymentError) {
        console.error('Failed to create Razorpay order:', paymentError)
        // User already deleted, just return error
        return NextResponse.json({
          success: false,
          message: 'Failed to create payment order: ' + (paymentError instanceof Error ? paymentError.message : 'Unknown error')
        }, { status: 500 })
      }
    }

    // Send registration confirmation email (skip for complementary, sponsored, and gateway users)
    if (newUser.registration.paymentType !== 'complementary' && 
        newUser.registration.paymentType !== 'sponsored' &&
        payment?.method !== 'pay-now') {
      try {
        // Fetch workshop details for email
        let workshopDetails: Array<{id: string, name: string}> = []
        if (registration?.workshopSelections && registration.workshopSelections.length > 0) {
          const Workshop = (await import('@/lib/models/Workshop')).default
          const workshops = await Workshop.find({ 
            id: { $in: registration.workshopSelections },
            isActive: true 
          })
          workshopDetails = workshops.map(w => ({ id: w.id, name: w.name }))
        }

        // Fetch registration type label from conference config
        const { conferenceConfig } = await import('@/conference-backend-core/config/conference.config')
        const registrationCategory = conferenceConfig.registration.categories.find(
          (cat: any) => cat.key === newUser.registration.type
        )
        const registrationTypeLabel = registrationCategory?.label || newUser.registration.type

        await EmailService.sendRegistrationConfirmation({
          email: newUser.email,
          name: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
          registrationId: newUser.registration.registrationId,
          registrationType: newUser.registration.type,
          registrationTypeLabel: registrationTypeLabel,
          workshopSelections: workshopDetails,
          accompanyingPersons: registration?.accompanyingPersons || []
        })
      } catch (emailError) {
        console.error('Failed to send registration email:', emailError)
        // Don't fail the registration if email fails
      }
    } else {
      console.log('Skipping confirmation email - will send after payment confirmation')
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        id: newUser._id,
        email: newUser.email,
        registrationId: newUser.registration.registrationId,
        name: `${newUser.profile.firstName} ${newUser.profile.lastName}`
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes('duplicate key') || error.message.includes('E11000')) {
        return NextResponse.json({
          success: false,
          message: 'Email address is already registered'
        }, { status: 409 })
      }
      
      if (error.message.includes('validation')) {
        return NextResponse.json({
          success: false,
          message: 'Validation error: ' + error.message
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
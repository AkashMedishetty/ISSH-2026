import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logSponsorAction } from '@/conference-backend-core/lib/audit/service'

// GET - List sponsor's delegates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const delegates = await User.find({ 'registration.sponsorId': sessionUser.id })
      .select('email profile registration createdAt')
      .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      delegates: delegates.map(d => ({
        _id: d._id,
        email: d.email,
        name: `${d.profile?.firstName || ''} ${d.profile?.lastName || ''}`.trim(),
        firstName: d.profile?.firstName || '',
        lastName: d.profile?.lastName || '',
        phone: d.profile?.phone || '',
        designation: d.profile?.designation || '',
        institution: d.profile?.institution || '',
        city: d.profile?.address?.city || '',
        state: d.profile?.address?.state || '',
        country: d.profile?.address?.country || 'India',
        registrationId: d.registration?.registrationId,
        status: d.registration?.status,
        createdAt: d.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching delegates:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch delegates' }, { status: 500 })
  }
}

// POST - Register single delegate
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as any
    
    if (!sessionUser || sessionUser.role !== 'sponsor') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Get sponsor and check allocation
    const sponsor = await User.findById(sessionUser.id)
    if (!sponsor || !sponsor.sponsorProfile) {
      return NextResponse.json({ success: false, message: 'Sponsor not found' }, { status: 404 })
    }

    const { total, used } = sponsor.sponsorProfile.allocation
    if (used >= total) {
      return NextResponse.json({ success: false, message: 'Allocation limit reached' }, { status: 400 })
    }

    const body = await request.json()
    const { 
      email, title, firstName, lastName, phone, age, designation, 
      institution, mciNumber, address, city, state, country, pincode,
      dietaryRequirements, specialNeeds, workshopSelections
    } = body

    // Validate required fields
    if (!email || !firstName || !lastName || !phone || !institution || !address || !city || !state || !pincode) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    
    if (existingUser) {
      // Check if pending-payment user that can be claimed
      if (existingUser.registration?.status === 'pending-payment') {
        // Claim this user
        existingUser.registration.status = 'confirmed'
        existingUser.registration.paymentType = 'sponsored'
        existingUser.registration.sponsorId = sponsor._id
        existingUser.registration.sponsorName = sponsor.sponsorProfile.companyName
        existingUser.registration.sponsorCategory = sponsor.sponsorProfile.category
        existingUser.registration.confirmedDate = new Date()
        await existingUser.save()

        // Update sponsor allocation
        sponsor.sponsorProfile.allocation.used += 1
        await sponsor.save()

        // Send confirmation email
        await sendEmailWithHistory({
          to: email,
          subject: 'ISSH Midterm CME 2026 - Registration Confirmed',
          html: `<p>Dear ${existingUser.profile?.firstName},</p><p>Your registration for ISSH Midterm CME 2026 has been confirmed.</p><p>Registration ID: ${existingUser.registration.registrationId}</p>`,
          text: `Your registration for ISSH Midterm CME 2026 has been confirmed. Registration ID: ${existingUser.registration.registrationId}`,
          userId: existingUser._id,
          userName: `${existingUser.profile?.firstName} ${existingUser.profile?.lastName}`,
          templateName: 'registration-confirmed',
          category: 'registration'
        })

        await logSponsorAction(
          { userId: sessionUser.id, email: sessionUser.email, role: 'sponsor' },
          'sponsor.delegate_claimed',
          existingUser._id.toString(),
          sponsor.sponsorProfile.companyName,
          { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' }
        )

        return NextResponse.json({
          success: true,
          message: 'Pending user claimed successfully',
          delegate: { _id: existingUser._id, registrationId: existingUser.registration.registrationId }
        })
      }
      
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 })
    }

    // Create new delegate - use phone number as password
    const registrationId = await generateRegistrationId()
    const passwordToUse = phone // Use phone number as password
    const hashedPassword = await bcrypt.hash(passwordToUse, 12)

    const delegate = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'user',
      profile: {
        title: title || 'Dr.',
        firstName,
        lastName,
        phone,
        age: age ? parseInt(age) : undefined,
        designation: designation || 'Consultant',
        institution,
        mciNumber: mciNumber || '',
        address: {
          street: address,
          city,
          state,
          country: country || 'India',
          pincode
        },
        dietaryRequirements: dietaryRequirements || 'none',
        specialNeeds: specialNeeds || ''
      },
      registration: {
        registrationId,
        type: 'sponsored',
        status: 'confirmed',
        paymentType: 'sponsored',
        sponsorId: sponsor._id,
        sponsorName: sponsor.sponsorProfile.companyName,
        sponsorCategory: sponsor.sponsorProfile.category,
        workshopSelections: workshopSelections || [],
        registrationDate: new Date(),
        confirmedDate: new Date(),
        source: 'sponsor-managed'
      },
      isActive: true
    })

    // Update sponsor allocation
    sponsor.sponsorProfile.allocation.used += 1
    await sponsor.save()

    // Send welcome email with phone as password info
    await sendEmailWithHistory({
      to: email,
      subject: 'Welcome to ISSH Midterm CME 2026 - Registration Confirmed',
      html: `
        <p>Dear ${title || 'Dr.'} ${firstName} ${lastName},</p>
        <p>Your registration for ISSH Midterm CME 2026 has been confirmed.</p>
        <hr/>
        <p><strong>Your Login Details:</strong></p>
        <ul>
          <li><strong>Registration ID:</strong> ${registrationId}</li>
          <li><strong>Login Email:</strong> ${email}</li>
          <li><strong>Password:</strong> Your mobile number (${phone})</li>
        </ul>
        <p>Please login at <a href="${process.env.NEXTAUTH_URL}/login">${process.env.NEXTAUTH_URL}/login</a> and change your password after first login.</p>
        <hr/>
        <p><strong>Event Details:</strong></p>
        <ul>
          <li><strong>Event:</strong> ISSH Midterm CME 2026</li>
          <li><strong>Date:</strong> April 25-26, 2026</li>
          <li><strong>Venue:</strong> HICC Novotel, Hyderabad</li>
        </ul>
        <p>We look forward to seeing you at the conference!</p>
        <p>Best regards,<br/>ISSH 2026 Team</p>
      `,
      text: `Your registration for ISSH Midterm CME 2026 has been confirmed. Registration ID: ${registrationId}. Login with your email and mobile number as password.`,
      userId: delegate._id,
      userName: `${firstName} ${lastName}`,
      templateName: 'registration-welcome',
      category: 'registration'
    })

    await logSponsorAction(
      { userId: sessionUser.id, email: sessionUser.email, role: 'sponsor' },
      'sponsor.delegate_registered',
      delegate._id.toString(),
      sponsor.sponsorProfile.companyName,
      { ip: request.headers.get('x-forwarded-for') || 'unknown', userAgent: request.headers.get('user-agent') || '' }
    )

    return NextResponse.json({
      success: true,
      message: 'Delegate registered successfully',
      delegate: { _id: delegate._id, registrationId }
    }, { status: 201 })
  } catch (error) {
    console.error('Error registering delegate:', error)
    return NextResponse.json({ success: false, message: 'Failed to register delegate' }, { status: 500 })
  }
}

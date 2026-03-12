import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'
import bcrypt from 'bcryptjs'
import { generateRegistrationId } from '@/lib/utils/generateId'
import { sendEmailWithHistory } from '@/conference-backend-core/lib/email/email-with-history'
import { logAction } from '@/conference-backend-core/lib/audit/service'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

export async function POST(request: NextRequest) {
  console.log('=== FACULTY REGISTER ROUTE HIT ===')
  
  try {
    await connectDB()

    const body = await request.json()
    const {
      title, firstName, lastName, email, phone, age,
      password, institution, mciNumber, specialization,
      address, city, state, country, pincode,
      dietaryRequirements, specialNeeds,
      accompanyingPersons
    } = body

    // Validate required fields
    const missing: string[] = []
    if (!firstName?.trim()) missing.push('firstName')
    if (!lastName?.trim()) missing.push('lastName')
    if (!email?.trim()) missing.push('email')
    if (!phone?.trim()) missing.push('phone')
    if (!institution?.trim()) missing.push('institution')
    if (!mciNumber?.trim()) missing.push('mciNumber')
    if (!password || password.length < 8) missing.push('password (min 8 chars)')
    if (!city?.trim()) missing.push('city')
    if (!state?.trim()) missing.push('state')

    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Check email uniqueness
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() })
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'This email is already registered. Please login instead.'
      }, { status: 409 })
    }

    const registrationId = await generateRegistrationId()
    const hashedPassword = await bcrypt.hash(password, 12)

    // Determine payment status based on accompanying persons
    const hasAccompanying = accompanyingPersons && accompanyingPersons.length > 0
    const status = hasAccompanying ? 'pending-payment' : 'confirmed'
    const paymentType = hasAccompanying ? 'pending' : 'complimentary'

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user',
      profile: {
        title: title || 'Dr.',
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        age: age ? parseInt(age) : undefined,
        designation: 'Faculty',
        specialization: specialization || '',
        institution: institution.trim(),
        mciNumber: mciNumber.trim(),
        address: {
          street: address || '',
          city: city.trim(),
          state: state.trim(),
          country: country || 'India',
          pincode: pincode || ''
        },
        dietaryRequirements: dietaryRequirements || '',
        specialNeeds: specialNeeds || ''
      },
      registration: {
        registrationId,
        type: 'faculty',
        status,
        paymentType,
        registrationDate: new Date(),
        source: 'normal',
        accompanyingPersons: (accompanyingPersons || []).map((p: any) => ({
          name: p.name?.trim(),
          age: p.age || 0,
          relationship: p.relationship || 'Other',
          dietaryRequirements: p.dietaryRequirements || ''
        }))
      },
      isActive: true
    })

    // Log the registration
    await logAction({
      actor: { userId: user._id.toString(), email: email.toLowerCase(), role: 'user' },
      action: 'registration.created',
      resourceType: 'registration',
      resourceId: user._id.toString(),
      resourceName: registrationId,
      metadata: {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || ''
      },
      description: `Faculty registration created${hasAccompanying ? ' (with accompanying persons - payment pending)' : ' (complimentary)'}`
    })

    // Send confirmation email
    const fullName = `${title || 'Dr.'} ${firstName} ${lastName}`.trim()
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Faculty Registration Confirmed!</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for registering as <strong>Faculty</strong> for <strong>${conferenceConfig.shortName}</strong>.</p>
        <div style="background: #f0fdf4; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <h3 style="margin-top: 0; color: #166534;">Registration Details</h3>
          <p><strong>Registration ID:</strong> ${registrationId}</p>
          <p><strong>Type:</strong> Faculty (Invited) — Complimentary</p>
          <p><strong>Status:</strong> <span style="color: ${hasAccompanying ? '#d69e2e' : '#16a34a'};">${hasAccompanying ? 'Pending Payment (Accompanying Persons)' : 'Confirmed'}</span></p>
        </div>
        ${hasAccompanying ? `
        <div style="background: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #fde68a;">
          <h3 style="margin-top: 0; color: #92400e;">⚠️ Payment Required</h3>
          <p>You have ${accompanyingPersons.length} accompanying person(s). Payment is required for them.</p>
          <p><a href="${conferenceConfig.contact.website}/auth/login" style="background: #4c51bf; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login & Complete Payment</a></p>
        </div>` : ''}
        <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Login Credentials</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> The password you created</p>
          <p><a href="${conferenceConfig.contact.website}/auth/login" style="background: #1a365d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Login to Dashboard</a></p>
        </div>
        <p>Best regards,<br>${conferenceConfig.shortName} Team</p>
      </div>
    `

    await sendEmailWithHistory({
      to: email.toLowerCase(),
      subject: `${conferenceConfig.shortName} - Faculty Registration ${hasAccompanying ? '(Payment Pending)' : 'Confirmed'}`,
      html: emailHtml,
      text: `Faculty Registration ID: ${registrationId}. ${hasAccompanying ? 'Payment pending for accompanying persons.' : 'Registration confirmed.'}`,
      userId: user._id,
      userName: fullName,
      templateName: 'faculty-registration',
      category: 'registration'
    })

    return NextResponse.json({
      success: true,
      message: 'Faculty registration successful',
      data: {
        registrationId,
        name: fullName,
        status,
        accompanyingPersonsCharge: hasAccompanying ? accompanyingPersons.length * 1000 : 0 // Approximate, actual calculated at payment
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('Faculty registration error:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, message: 'Email already registered.' }, { status: 409 })
    }
    return NextResponse.json({
      success: false,
      message: `Registration failed: ${error.message}`
    }, { status: 500 })
  }
}

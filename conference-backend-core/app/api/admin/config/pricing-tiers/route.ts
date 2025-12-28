import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    // Fetch pricing tiers configuration
    const pricingTiersConfig = await Configuration.findOne({
      type: 'pricing',
      key: 'pricing_tiers',
      isActive: true
    })

    if (!pricingTiersConfig) {
      // Return default structure if not found - ISSH Midterm CME 2026
      const defaultPricingTiers = {
        specialOffers: [],
        earlyBird: {
          name: 'Early Bird Registration',
          description: 'Early registration discount',
          startDate: '2025-12-01',
          endDate: '2026-03-31',
          isActive: true,
          categories: {
            'issh-member': { amount: 2000, currency: 'INR', label: 'ISSH Member' },
            'consultant': { amount: 5000, currency: 'INR', label: 'Consultant' },
            'postgraduate': { amount: 2500, currency: 'INR', label: 'Postgraduate' },
            'international': { amount: 100, currency: 'USD', label: 'International' }
          }
        },
        regular: {
          name: 'Regular Registration',
          description: 'Standard registration pricing',
          startDate: '2026-04-01',
          endDate: '2026-04-24',
          isActive: true,
          categories: {
            'issh-member': { amount: 2500, currency: 'INR', label: 'ISSH Member' },
            'consultant': { amount: 6000, currency: 'INR', label: 'Consultant' },
            'postgraduate': { amount: 3000, currency: 'INR', label: 'Postgraduate' },
            'international': { amount: 125, currency: 'USD', label: 'International' }
          }
        },
        onsite: {
          name: 'Spot Registration',
          description: 'Registration at the venue - HICC Novotel, Hyderabad',
          startDate: '2026-04-25',
          endDate: '2026-04-26',
          isActive: true,
          categories: {
            'issh-member': { amount: 3000, currency: 'INR', label: 'ISSH Member' },
            'consultant': { amount: 7000, currency: 'INR', label: 'Consultant' },
            'postgraduate': { amount: 3500, currency: 'INR', label: 'Postgraduate' },
            'international': { amount: 150, currency: 'USD', label: 'International' }
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: defaultPricingTiers
      })
    }

    return NextResponse.json({
      success: true,
      data: pricingTiersConfig.value
    })

  } catch (error) {
    console.error('Pricing tiers config fetch error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return PUT(request)
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized'
      }, { status: 401 })
    }

    await connectDB()

    const adminUser = await User.findById((session.user as any).id)
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Admin access required'
      }, { status: 403 })
    }

    const body = await request.json()
    const { specialOffers, earlyBird, regular, onsite } = body

    // Validate the data structure
    if (!earlyBird || !regular || !onsite) {
      return NextResponse.json({
        success: false,
        message: 'Missing required pricing tier data'
      }, { status: 400 })
    }

    // Validate each tier has required fields
    const tiers = [earlyBird, regular, onsite, ...(specialOffers || [])]
    for (const tier of tiers) {
      if (!tier.name || !tier.startDate || !tier.endDate || !tier.categories) {
        return NextResponse.json({
          success: false,
          message: 'Invalid tier data: missing required fields'
        }, { status: 400 })
      }

      // Validate categories - flexible validation for any category names
      if (!tier.categories || typeof tier.categories !== 'object') {
        return NextResponse.json({
          success: false,
          message: `Invalid categories data in tier ${tier.name}`
        }, { status: 400 })
      }
      
      // Check that each category has required fields
      for (const [categoryKey, categoryData] of Object.entries(tier.categories)) {
        if (!categoryData || 
            typeof (categoryData as any).amount !== 'number' ||
            !(categoryData as any).currency ||
            !(categoryData as any).label) {
          return NextResponse.json({
            success: false,
            message: `Invalid category data for ${categoryKey} in tier ${tier.name}`
          }, { status: 400 })
        }
      }
    }

    // Update pricing tiers configuration
    await Configuration.findOneAndUpdate(
      { type: 'pricing', key: 'pricing_tiers' },
      {
        type: 'pricing',
        key: 'pricing_tiers',
        value: {
          specialOffers: specialOffers || [],
          earlyBird,
          regular,
          onsite
        },
        isActive: true,
        createdBy: adminUser._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Pricing tiers configuration updated successfully'
    })

  } catch (error) {
    console.error('Pricing tiers config update error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
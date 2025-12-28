import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import { getCurrentTier, getTierPricing } from '@/lib/registration'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow public access for registration page
    // if (!session || (session.user as any).role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, message: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    await connectDB()

    // Get current tier and pricing from database or fallback
    const currentTierName = getCurrentTier()
    let categories = getTierPricing(currentTierName)
    
    // Try to get admin-configured pricing from database
    try {
      const adminPricingConfig = await Configuration.findOne({ 
        type: 'pricing', 
        key: 'pricing_tiers', 
        isActive: true 
      })
      
      if (adminPricingConfig?.value) {
        const today = new Date()
        const iso = today.toISOString().split('T')[0]
        const tiers = adminPricingConfig.value
        const pick = (t: any) => t && t.isActive && iso >= t.startDate && iso <= t.endDate
        
        if (pick(tiers.earlyBird)) { 
          categories = tiers.earlyBird.categories 
        } else if (pick(tiers.regular)) { 
          categories = tiers.regular.categories 
        } else if (pick(tiers.onsite)) { 
          categories = tiers.onsite.categories 
        } else { 
          categories = tiers.regular?.categories || categories 
        }
      }
    } catch (error) {
      console.log('Using fallback pricing - database config unavailable')
    }

    // Convert categories object to array format for frontend
    const registrationTypes = Object.entries(categories).map(([key, value]: [string, any]) => ({
      key,
      label: value.label || key,
      price: value.amount,
      currency: value.currency || 'INR',
      description: value.description || `${currentTierName} pricing`
    }))

    return NextResponse.json({
      success: true,
      data: registrationTypes
    })

  } catch (error) {
    console.error('Registration types fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { getCurrentTier, getTierPricing } from '@/lib/registration'
import { conferenceConfig } from '@/config/conference.config'
import mongoose from 'mongoose'

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  'resident': 'Resident (Postgraduate)',
  'delegate': 'Delegate',
  'accompanying': 'Accompanying Person'
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow public access for registration page

    await connectDB()

    // Get current tier and pricing from database or fallback
    const currentTierName = getCurrentTier()
    let categories: Record<string, any> = getTierPricing(currentTierName)
    let tierLabel = currentTierName
    
    // Try to get pricing from pricing_tiers collection (seeded data)
    try {
      const db = mongoose.connection.db
      if (db) {
        const today = new Date()
        
        // Find the active tier based on current date
        const activeTier = await db.collection('pricing_tiers').findOne({
          active: true,
          startDate: { $lte: today },
          endDate: { $gte: today }
        })
        
        if (activeTier && activeTier.categories) {
          console.log('📊 Found active pricing tier from database:', activeTier.name)
          categories = activeTier.categories
          tierLabel = activeTier.name
        } else {
          console.log('📊 No active tier found for today, using fallback')
        }
      }
    } catch (error) {
      console.log('Using fallback pricing - database query failed:', error)
    }

    // Convert categories object to array format for frontend
    // Filter out 'accompanying' as it's handled separately
    const registrationTypes = Object.entries(categories)
      .filter(([key]) => key !== 'accompanying')
      .map(([key, value]: [string, any]) => ({
        key,
        label: CATEGORY_LABELS[key] || conferenceConfig.registration.categories.find(c => c.key === key)?.label || key,
        price: value.amount,
        currency: value.currency || 'INR',
        description: `${tierLabel} pricing`
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

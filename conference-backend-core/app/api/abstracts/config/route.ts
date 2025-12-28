import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

const CONFIG_TYPE = 'abstracts'
const CONFIG_KEY = 'settings'

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const config = await Configuration.findOne({ type: CONFIG_TYPE, key: CONFIG_KEY })
    
    // Check if abstract submission feature is enabled in admin panel
    const featureConfig = await Configuration.findOne({ type: 'features', key: 'abstractSubmission' })
    const isFeatureEnabled = featureConfig?.value ?? conferenceConfig.features.abstractSubmission
    
    // Return config or defaults
    const settings = config?.value || defaultAbstractsSettings
    
    // Check if submissions are open based on dates
    const now = new Date()
    const startDate = new Date(settings.submissionWindow?.start)
    const endDate = new Date(settings.submissionWindow?.end)
    const isOpen = settings.submissionWindow?.enabled && now >= startDate && now <= endDate
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...settings,
        featureEnabled: isFeatureEnabled, // Add feature toggle status
        isCurrentlyOpen: isOpen && isFeatureEnabled, // Only open if feature is enabled
        daysRemaining: isOpen ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
      }
    })
  } catch (error) {
    console.error('Abstracts config fetch error:', error)
    // Return defaults on error
    return NextResponse.json({ success: true, data: { ...defaultAbstractsSettings, featureEnabled: true } })
  }
}



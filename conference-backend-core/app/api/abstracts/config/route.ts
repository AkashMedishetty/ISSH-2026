import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import AbstractsConfig from '@/conference-backend-core/lib/models/AbstractsConfig'
import { defaultAbstractsSettings } from '@/lib/config/abstracts'
import { conferenceConfig } from '@/conference-backend-core/config/conference.config'

const CONFIG_TYPE = 'abstracts'
const CONFIG_KEY = 'settings'

// Public endpoint - no auth required
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const config = await Configuration.findOne({ type: CONFIG_TYPE, key: CONFIG_KEY })
    
    // Also fetch the new AbstractsConfig for guidelines and templates
    const abstractsConfig = await AbstractsConfig.findOne({})
    
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
    
    // Check final submission window
    let isFinalSubmissionOpen = false
    if (abstractsConfig?.finalSubmissionOpenDate && abstractsConfig?.finalSubmissionCloseDate) {
      const finalStart = new Date(abstractsConfig.finalSubmissionOpenDate)
      const finalEnd = new Date(abstractsConfig.finalSubmissionCloseDate)
      isFinalSubmissionOpen = now >= finalStart && now <= finalEnd
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        ...settings,
        featureEnabled: isFeatureEnabled,
        isCurrentlyOpen: isOpen && isFeatureEnabled,
        daysRemaining: isOpen ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        // Add guidelines and templates from AbstractsConfig
        guidelines: abstractsConfig?.guidelines || null,
        fileRequirements: abstractsConfig?.fileRequirements || null,
        isFinalSubmissionOpen,
        finalSubmissionDeadline: abstractsConfig?.finalSubmissionCloseDate || null
      }
    })
  } catch (error) {
    console.error('Abstracts config fetch error:', error)
    // Return defaults on error
    return NextResponse.json({ success: true, data: { ...defaultAbstractsSettings, featureEnabled: true } })
  }
}



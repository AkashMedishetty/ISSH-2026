import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Configuration from '@/lib/models/Configuration'
import Workshop from '@/lib/models/Workshop'
import { getCurrentTier, getTierPricing } from '@/lib/registration'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { registrationType, workshopSelections = [], accompanyingPersons = [], discountCode, age = 0 } = body
    
    if (!registrationType) {
      return NextResponse.json({
        success: false,
        message: 'Registration type is required'
      }, { status: 400 })
    }

    // Get current tier and pricing
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

    // Calculate base registration fee
    const registrationCategory = categories[registrationType]
    if (!registrationCategory) {
      return NextResponse.json({
        success: false,
        message: 'Invalid registration type'
      }, { status: 400 })
    }
    
    // Get age exemption rules from database
    let seniorCitizenAge = 70
    let seniorCitizenCategory = 'consultant'
    
    try {
      const ageExemptionsConfig = await Configuration.findOne({
        type: 'pricing',
        key: 'age_exemptions',
        isActive: true
      })
      
      if (ageExemptionsConfig?.value) {
        seniorCitizenAge = ageExemptionsConfig.value.senior_citizen_age || 70
        seniorCitizenCategory = ageExemptionsConfig.value.senior_citizen_category || 'consultant'
      }
    } catch (error) {
      console.log('Using fallback age exemptions - database config unavailable')
    }
    
    // Apply age-based free registration for senior citizens
    let baseAmount = registrationCategory.amount
    const currency = registrationCategory.currency || 'INR'
    
    // Check if senior citizen exemption applies
    const appliesForSeniorExemption = 
      age >= seniorCitizenAge && 
      (seniorCitizenCategory === 'all' || 
       seniorCitizenCategory === registrationType)
    
    if (appliesForSeniorExemption) {
      baseAmount = 0 // Free registration for qualifying senior citizens
    }

    // Get workshops from Workshop collection
    let workshops: any[] = []
    try {
      const workshopDocs = await Workshop.find({ isActive: true })
      workshops = workshopDocs.map(w => ({
        id: w.id,
        name: w.name,
        amount: w.price, // Workshop model uses 'price', map to 'amount' for consistency
        currency: w.currency
      }))
      console.log(`Found ${workshops.length} active workshops in database`)
    } catch (error) {
      console.error('Error fetching workshops from database:', error)
      // Fallback workshop pricing if database fetch fails
      workshops = [
        { id: 'joint-replacement', name: 'Advanced Joint Replacement Techniques', amount: 2000 },
        { id: 'spinal-surgery', name: 'Spine Surgery and Instrumentation', amount: 2500 },
        { id: 'pediatric-orthopaedics', name: 'Pediatric Orthopaedics', amount: 2000 },
        { id: 'arthroscopy', name: 'Arthroscopic Surgery Techniques', amount: 1500 },
        { id: 'orthopaedic-rehab', name: 'Orthopaedic Rehabilitation', amount: 1800 },
        { id: 'trauma-surgery', name: 'Orthopaedic Trauma Surgery', amount: 2200 }
      ]
      console.log('Using fallback workshops due to error')
    }

    // Calculate workshop fees
    let workshopFees: Array<{ name: string; amount: number }> = []
    let totalWorkshopFees = 0

    console.log('Available workshops:', workshops.map(w => ({ id: w.id, name: w.name, amount: w.amount })))
    console.log('Workshop selections from request:', workshopSelections)

    if (workshopSelections && workshopSelections.length > 0) {
      workshopSelections.forEach((workshopId: string) => {
        console.log(`Looking for workshop with ID: "${workshopId}"`)
        const workshop = workshops.find(w => w.id === workshopId)
        if (workshop) {
          console.log(`✓ Found workshop: ${workshop.name} - ₹${workshop.amount}`)
          workshopFees.push({
            name: workshop.name,
            amount: workshop.amount
          })
          totalWorkshopFees += workshop.amount
        } else {
          console.log(`✗ Workshop not found: ${workshopId}`)
        }
      })
      console.log('Total workshop fees calculated:', totalWorkshopFees)
    } else {
      console.log('No workshop selections provided')
    }

    // Get accompanying person fees and age exemptions from database config only
    let accompanyingPersonFee = 0
    let childrenUnderAge = 10
    
    try {
      console.log('Fetching accompanying person config from database...')
      // Try without isActive filter first to see if data exists
      const accompanyingConfig = await Configuration.findOne({
        type: 'pricing',
        key: 'accompanying_person'
      }).sort({ updatedAt: -1 })
      
      console.log('Accompanying person config found:', accompanyingConfig ? 'YES' : 'NO')
      if (accompanyingConfig) {
        console.log('Config document:', {
          key: accompanyingConfig.key,
          isActive: accompanyingConfig.isActive,
          value: accompanyingConfig.value,
          updatedAt: accompanyingConfig.updatedAt
        })
      }
      
      if (accompanyingConfig?.value && accompanyingConfig.isActive !== false) {
        // Support both old format (basePrice/tierPricing) and new format (amount)
        if (accompanyingConfig.value.amount) {
          // New simple format
          accompanyingPersonFee = accompanyingConfig.value.amount
          console.log('Using database accompanying person fee (new format):', accompanyingPersonFee)
        } else if (accompanyingConfig.value.basePrice && !isNaN(accompanyingConfig.value.basePrice)) {
          // Old format with basePrice
          accompanyingPersonFee = accompanyingConfig.value.basePrice
          console.log('Using database accompanying person fee (old format - basePrice):', accompanyingPersonFee)
        } else if (accompanyingConfig.value.tierPricing) {
          // Old format with tierPricing - use regular tier as default
          const tierPrice = accompanyingConfig.value.tierPricing.regular || 
                           accompanyingConfig.value.tierPricing.earlyBird ||
                           Object.values(accompanyingConfig.value.tierPricing)[0]
          if (tierPrice) {
            accompanyingPersonFee = tierPrice
            console.log('Using database accompanying person fee (old format - tier pricing):', accompanyingPersonFee)
          } else {
            console.log('Old format found but no valid price, using fallback:', accompanyingPersonFee)
          }
        } else {
          console.log('Config value exists but no amount found, using fallback:', accompanyingPersonFee)
        }
      } else {
        console.log('Using fallback accompanying person fee:', accompanyingPersonFee)
      }
      
      console.log('Fetching age exemptions config from database...')
      const ageExemptionsConfig = await Configuration.findOne({
        type: 'pricing',
        key: 'age_exemptions'
      }).sort({ updatedAt: -1 })
      
      console.log('Age exemptions config found:', ageExemptionsConfig ? 'YES' : 'NO')
      if (ageExemptionsConfig) {
        console.log('Config document:', {
          key: ageExemptionsConfig.key,
          isActive: ageExemptionsConfig.isActive,
          value: ageExemptionsConfig.value,
          updatedAt: ageExemptionsConfig.updatedAt
        })
      }
      
      if (ageExemptionsConfig?.value && ageExemptionsConfig.isActive !== false) {
        childrenUnderAge = ageExemptionsConfig.value.children_under_age || 10
        console.log('Using database children under age:', childrenUnderAge)
      } else {
        console.log('Using fallback children under age:', childrenUnderAge)
      }
    } catch (error) {
      console.error('Error fetching accompanying person fees and age exemptions:', error)
      console.log('Using fallback values - database config unavailable')
    }
    
    // Calculate accompanying person fees
    let totalAccompanyingFees = 0
    let accompanyingPersonCount = 0
    let freeChildrenCount = 0
    
    // Process each accompanying person
    if (accompanyingPersons && accompanyingPersons.length > 0) {
      accompanyingPersons.forEach((person: any) => {
        const personAge = person.age || 0
        if (personAge < childrenUnderAge) {
          freeChildrenCount++ // Children under configured age are free
        } else {
          accompanyingPersonCount++
          totalAccompanyingFees += accompanyingPersonFee
        }
      })
    }

    // Calculate subtotal
    const subtotal = baseAmount + totalWorkshopFees + totalAccompanyingFees

    // Apply discounts (if any)
    let totalDiscount = 0
    const appliedDiscounts: Array<{
      type: string
      code?: string
      percentage: number
      amount: number
    }> = []

    if (discountCode) {
      try {
        const discountConfigs = await Configuration.find({
          type: 'discounts',
          isActive: true
        })

        const currentDate = new Date()
        discountConfigs.forEach(config => {
          if (config.value && Array.isArray(config.value)) {
            config.value.forEach((discount: any) => {
              if (discount.code === discountCode && discount.isActive) {
                const discountEndDate = new Date(discount.endDate)
                if (currentDate <= discountEndDate) {
                  const discountAmount = Math.floor((subtotal * discount.percentage) / 100)
                  totalDiscount += discountAmount
                  appliedDiscounts.push({
                    type: discount.type || 'code-based',
                    code: discount.code,
                    percentage: discount.percentage,
                    amount: discountAmount
                  })
                }
              }
            })
          }
        })
      } catch (error) {
        console.log('Error applying discount:', error)
      }
    }

    // Calculate final total
    const total = subtotal - totalDiscount
    const finalAmount = Math.max(total, 0) // Ensure non-negative

    const calculationData = {
      baseAmount,
      registrationFee: baseAmount, // Add this for frontend compatibility
      workshopFees: totalWorkshopFees,
      accompanyingPersons: totalAccompanyingFees,
      accompanyingPersonFees: totalAccompanyingFees, // Add this for frontend compatibility
      subtotal,
      discount: totalDiscount,
      total: finalAmount,
      finalAmount,
      currency,
      breakdown: {
        registration: baseAmount,
        workshops: workshopFees,
        accompanyingPersonFees: totalAccompanyingFees,
        appliedDiscounts,
        registrationType,
        tier: currentTierName
      }
    }

    return NextResponse.json({
      success: true,
      data: calculationData
    })

  } catch (error) {
    console.error('Price calculation error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 })
  }
}
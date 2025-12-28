"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/conference-backend-core/components/ui/card"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Navigation } from "@/conference-backend-core/components/Navigation"
import { ArrowRight, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

interface PricingTier {
  name: string
  key: string
  validFrom: string
  validUntil: string
  isActive: boolean
  displayOrder: number
  pricing: Array<{
    categoryKey: string
    basePrice: number
    workshopPrice: number
    accompanyingPersonPrice: number
    currency: string
  }>
}

interface Category {
  key: string
  label: string
  description?: string
  isActive: boolean
}

export default function PricingPage() {
  const [loading, setLoading] = useState(true)
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentTierKey, setCurrentTierKey] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchPricingData()
  }, [])

  const fetchPricingData = async () => {
    try {
      const response = await fetch('/api/config/pricing')
      const data = await response.json()
      
      if (data.success && data.data.pricing) {
        const { pricingTiers: tiers, categories: cats } = data.data.pricing
        
        // Sort tiers by display order
        const sortedTiers = tiers
          .filter((t: PricingTier) => t.isActive)
          .sort((a: PricingTier, b: PricingTier) => a.displayOrder - b.displayOrder)
        
        setPricingTiers(sortedTiers)
        setCategories(cats.filter((c: Category) => c.isActive))
        
        // Determine current tier
        const now = new Date()
        const current = sortedTiers.find((tier: PricingTier) => {
          const from = new Date(tier.validFrom)
          const until = new Date(tier.validUntil)
          return now >= from && now <= until
        })
        
        if (current) {
          setCurrentTierKey(current.key)
        }
      }
    } catch (err) {
      console.error('Failed to fetch pricing:', err)
      setError('Failed to load pricing information')
    } finally {
      setLoading(false)
    }
  }

  const getPriceForCategory = (tier: PricingTier, categoryKey: string) => {
    const pricing = tier.pricing.find(p => p.categoryKey === categoryKey)
    return pricing ? pricing.basePrice : 0
  }

  const getCategoryLabel = (categoryKey: string) => {
    const category = categories.find(c => c.key === categoryKey)
    return category ? category.label : categoryKey
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCurrentTierName = () => {
    const tier = pricingTiers.find(t => t.key === currentTierKey)
    return tier ? tier.name : 'Regular'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: conferenceConfig.theme.primary }} />
            <p className="text-gray-600">Loading pricing information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || pricingTiers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-bold mb-2">Pricing Not Available</h3>
              <p className="text-gray-600 mb-4">
                {error || 'Pricing information is not configured yet. Please check back later.'}
              </p>
              <Button asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-r from-blue-600 to-purple-600" style={{
        background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.accent} 100%)`
      }}>
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Conference Pricing
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 max-w-3xl mx-auto px-4">
              Choose your registration category for {conferenceConfig.shortName}
            </p>
            {currentTierKey && (
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur border border-white/30 rounded-full px-4 sm:px-6 py-3 text-sm sm:text-base">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-semibold">
                  Current Tier: {getCurrentTierName()}
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
              Registration Categories & Pricing
            </h2>
            <p className="text-base sm:text-lg text-gray-600 text-center max-w-2xl mx-auto px-4">
              All prices are in {conferenceConfig.payment.currency}. Choose the category that best fits your profile.
            </p>
          </motion.div>

          {/* Desktop Table View */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block overflow-x-auto"
          >
            <div className="min-w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Table Header */}
              <div className="text-white" style={{
                background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.accent} 100%)`
              }}>
                <div className={`grid gap-4 p-6`} style={{
                  gridTemplateColumns: `200px repeat(${categories.length}, 1fr)`
                }}>
                  <div className="font-bold text-lg">Pricing Tier</div>
                  {categories.map((category) => (
                    <div key={category.key} className="text-center font-bold text-lg">
                      {category.label}
                      {category.description && (
                        <div className="text-sm font-normal opacity-90">{category.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {pricingTiers.map((tier, index) => (
                  <div
                    key={tier.key}
                    className={`grid gap-4 p-6 transition-colors`}
                    style={{
                      gridTemplateColumns: `200px repeat(${categories.length}, 1fr)`,
                      ...(tier.key === currentTierKey ? {
                        background: `linear-gradient(90deg, ${conferenceConfig.theme.primary}10 0%, ${conferenceConfig.theme.accent}10 100%)`,
                        borderLeft: `4px solid ${conferenceConfig.theme.primary}`
                      } : {})
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-gray-900">{tier.name}</span>
                        {tier.key === currentTierKey && (
                          <Badge style={{ backgroundColor: conferenceConfig.theme.success }} className="text-white text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDate(tier.validFrom)} - {formatDate(tier.validUntil)}
                      </div>
                    </div>
                    
                    {categories.map((category) => (
                      <div key={category.key} className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {conferenceConfig.payment.currencySymbol}{getPriceForCategory(tier, category.key).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mobile Card View */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:hidden space-y-6"
          >
            {pricingTiers.map((tier) => (
              <Card
                key={tier.key}
                className={`transition-all duration-300 ${
                  tier.key === currentTierKey 
                    ? 'ring-2 shadow-lg' 
                    : 'hover:shadow-lg'
                }`}
                style={tier.key === currentTierKey ? {
                  background: `linear-gradient(135deg, ${conferenceConfig.theme.primary}10 0%, ${conferenceConfig.theme.accent}10 100%)`,
                  borderColor: conferenceConfig.theme.primary
                } : {}}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900">{tier.name}</CardTitle>
                    {tier.key === currentTierKey && (
                      <Badge style={{ backgroundColor: conferenceConfig.theme.success }} className="text-white">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(tier.validFrom)} - {formatDate(tier.validUntil)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <div key={category.key} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">{category.label}</div>
                        <div className="text-lg font-bold text-gray-900">
                          {conferenceConfig.payment.currencySymbol}{getPriceForCategory(tier, category.key).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 text-white" style={{
        background: `linear-gradient(135deg, ${conferenceConfig.theme.primary} 0%, ${conferenceConfig.theme.accent} 100%)`
      }}>
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to Register for {conferenceConfig.shortName}?
            </h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-white/90 px-4">
              Secure your spot at this premier conference. Early registration saves you money and guarantees your participation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button size="lg" className="bg-white hover:bg-gray-100 w-full sm:w-auto" style={{ color: conferenceConfig.theme.primary }} asChild>
                <Link href="/register">
                  Register Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20 w-full sm:w-auto" asChild>
                <Link href="/program-schedule">
                  View Program
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/conference-backend-core/components/ui/button"
import { Input } from "@/conference-backend-core/components/ui/input"
import { FloatingInput } from "@/conference-backend-core/components/ui/floating-input"
import { Textarea } from "@/conference-backend-core/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/conference-backend-core/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/conference-backend-core/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/conference-backend-core/components/ui/radio-group"
import { Label } from "@/conference-backend-core/components/ui/label"
import { Checkbox } from "@/conference-backend-core/components/ui/checkbox"
import { Alert, AlertDescription } from "@/conference-backend-core/components/ui/alert"
import { Badge } from "@/conference-backend-core/components/ui/badge"
import { Progress, StepProgress } from "@/conference-backend-core/components/ui/progress"
import { Calendar, FileText, Award, Users, CheckCircle, CreditCard, Eye, EyeOff, Loader2, AlertCircle, CheckIcon, UserPlus, MapPin, Phone, Mail, Building, Shield, Sparkles } from "lucide-react"
import Link from "next/link"
import { Navigation } from "@/conference-backend-core/components/Navigation"
import dynamic from "next/dynamic"
import { useToast } from "@/conference-backend-core/hooks/use-toast"
import { getCurrentTier, getTierSummary, getTierPricing } from "@/conference-backend-core/lib/registration"
import { signIn } from "next-auth/react"
import { conferenceConfig } from "@/conference-backend-core/config/conference.config"

// Payment configuration interface
interface PaymentConfig {
  gateway: boolean
  bankTransfer: boolean
  externalRedirect: boolean
  externalRedirectUrl: string
  redirectUrl?: string
  bankDetails: {
    accountName?: string
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    branch?: string
    qrCodeUrl?: string
  } | null
}

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'gateway' | 'bank-transfer' | null>(null)
  const [registrationData, setRegistrationData] = useState<any>(null)
  const [priceCalculation, setPriceCalculation] = useState<any>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const shouldReduceMotion = useReducedMotion()

  // Avoid hydration glitches on first paint (observed on some mobile browsers)
  useEffect(() => {
    setMounted(true)
    
    // Load Razorpay SDK
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      // Cleanup: remove script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Step configuration for the new design
  const steps = [
    { label: "Personal Info", completed: step > 1, current: step === 1 },
    { label: "Registration", completed: step > 2, current: step === 2 },
    { label: "Payment", completed: step > 3, current: step === 3 },
  ]

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }
    }
  }, [emailCheckTimeout])

  // Load dynamic pricing data and workshops
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingPricing(true)
        
        // Load registration types from database (admin-configured)
        const typesResponse = await fetch('/api/admin/registration-types')
        let hasValidTypes = false
        
        if (typesResponse.ok) {
          const typesResult = await typesResponse.json()
          if (typesResult.success && typesResult.data && typesResult.data.length > 0) {
            const updatedTypes = typesResult.data.map((type: any) => ({
              value: type.key,
              label: type.label,
              price: type.price,
              currency: type.currency,
              description: type.description || ''
            }))
            setRegistrationTypes(updatedTypes)
            hasValidTypes = true
          }
        }
        
        // Fallback to config if no types in database
        if (!hasValidTypes) {
          console.log('📋 Using fallback - loading from config file')
          const tierName = getCurrentTier()
          const pricing = getTierPricing(tierName)
          console.log('Current tier:', tierName)
          console.log('Pricing:', pricing)
          const updatedTypes = conferenceConfig.registration.categories.map(cat => {
            const categoryPricing = pricing?.categories as unknown as Record<string, { amount: number; currency: string }> | undefined
            const price = categoryPricing?.[cat.key]?.amount ?? 0
            const currency = categoryPricing?.[cat.key]?.currency ?? "INR"
            console.log(`Category ${cat.key}: price=${price}, currency=${currency}`)
            return {
              value: cat.key,
              label: cat.label,
              price,
              currency,
              description: `${tierName} (Inclusive of GST)`
            }
          })
          console.log('Updated types:', updatedTypes)
          setRegistrationTypes(updatedTypes)
        }

        // Load workshops data
        const workshopsResponse = await fetch('/api/workshops')
        if (workshopsResponse.ok) {
          const workshopsResult = await workshopsResponse.json()
          if (workshopsResult.success && workshopsResult.data) {
            const updatedWorkshops = workshopsResult.data.map((workshop: any) => ({
              id: workshop.id,
              label: workshop.name,
              price: workshop.price,
              maxSeats: workshop.maxSeats,
              availableSeats: workshop.availableSeats,
              canRegister: workshop.canRegister
            }))
            setWorkshops(updatedWorkshops)
          }
        }

        // Load payment configuration
        try {
          const paymentResponse = await fetch('/api/admin/settings/payment-methods')
          if (paymentResponse.ok) {
            const paymentResult = await paymentResponse.json()
            if (paymentResult.success && paymentResult.data) {
              setPaymentConfig(paymentResult.data)
              
              // Check if external redirect is enabled - HIGHEST PRIORITY
              if (paymentResult.data.externalRedirect && paymentResult.data.externalRedirectUrl) {
                // Show redirecting message
                setRedirecting(true)
                // Ensure URL has protocol
                let url = paymentResult.data.externalRedirectUrl.trim()
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  url = 'https://' + url
                }
                // Store the URL for later use
                setPaymentConfig(prev => ({ ...prev, redirectUrl: url }))
                
                // Try to open in new tab after brief delay
                setTimeout(() => {
                  const popup = window.open(url, '_blank', 'noopener,noreferrer')
                  // Check if popup was blocked
                  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    // Popup was blocked - keep redirecting=true to show link
                    console.log('Popup blocked - showing manual redirect link')
                  } else {
                    // Popup opened successfully - we can reset after a bit
                    setTimeout(() => {
                      setRedirecting(false)
                    }, 2000)
                  }
                }, 1500)
                return // Stop execution
              }
              
              // Set payment method based on admin configuration - NO user choice
              setFormData(prev => ({
                ...prev,
                paymentMethod: paymentResult.data.gateway ? 'pay-now' : 'bank-transfer'
              }))
            }
          }
        } catch (error) {
          console.log('Using default payment config')
        } finally {
          setLoadingPaymentConfig(false)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingPricing(false)
        setLoadingPaymentConfig(false)
      }
    }

    loadData()
  }, [])

  const [formData, setFormData] = useState({
    // Personal Information
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    designation: "",
    password: "",
    confirmPassword: "",
    institution: "",
    mciNumber: "",

    // Address
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",

    // Registration Details
    registrationType: "",
    membershipNumber: "",
    dietaryRequirements: "",
    specialNeeds: "",
    workshopSelection: [] as string[],
    accompanyingPersons: [] as Array<{
      name: string
      age: number
      relationship: string
      dietaryRequirements?: string
    }>,
    discountCode: "",

    // Payment
    paymentMethod: "bank-transfer",
    bankTransferUTR: "",
    agreeTerms: false,
  })

  // Track which fields have been touched/interacted with
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // State for dynamic data - Updated ISCSG Pricing
  // Initialize with conference config categories
  const [registrationTypes, setRegistrationTypes] = useState(
    conferenceConfig.registration.categories.map(cat => ({
      value: cat.key,
      label: cat.label,
      price: 0,
      currency: "INR",
      description: "Loading..."
    }))
  )
  const [workshops, setWorkshops] = useState<Array<{
    id: string
    label: string
    price: number
    maxSeats?: number
    availableSeats?: number
    canRegister?: boolean
  }>>([
    { id: "joint-replacement", label: "Advanced Joint Replacement Techniques", price: 2000, canRegister: true },
    { id: "spinal-surgery", label: "Spine Surgery and Instrumentation", price: 2500, canRegister: true },
    { id: "pediatric-neurovascular", label: "Pediatric Neurovascular Care", price: 2000, canRegister: true },
    { id: "arthroscopy", label: "Arthroscopic Surgery Techniques", price: 1500, canRegister: true },
    { id: "stroke-rehab", label: "Stroke Rehabilitation", price: 1800, canRegister: true },
    { id: "trauma-surgery", label: "Neurovascular Trauma Management", price: 2200, canRegister: true }
  ])
  const [currentTier, setCurrentTier] = useState<any>(null)
  const [nextTier, setNextTier] = useState<any>(null)
  const [loadingPricing, setLoadingPricing] = useState(true)
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ 
    gateway: false, 
    bankTransfer: true, 
    externalRedirect: false, 
    externalRedirectUrl: '', 
    bankDetails: null 
  })
  const [loadingPaymentConfig, setLoadingPaymentConfig] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  // Calculate price when registration type, workshops, accompanying persons, or discount code change
  useEffect(() => {
    if (formData.registrationType || formData.workshopSelection.length > 0 || formData.accompanyingPersons.length > 0) {
      calculatePrice()
    }
  }, [formData.registrationType, formData.workshopSelection, formData.accompanyingPersons, formData.discountCode])

  const calculatePrice = async () => {
    if (!formData.registrationType) return

    try {
      const response = await fetch('/api/payment/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationType: formData.registrationType,
          workshopSelections: formData.workshopSelection,
          accompanyingPersons: formData.accompanyingPersons,
          discountCode: formData.discountCode || undefined,
          age: parseInt(formData.age) || 0
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('💰 Price calculation result:', result.data)
          setPriceCalculation(result.data)
        } else {
          console.error('❌ Price calculation failed:', result.message)
        }
      } else {
        console.error('❌ Price calculation API error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Price calculation error:', error)
    }
  }

  const checkEmailUniqueness = async (email: string) => {
    // Validate email format first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) return

    setIsCheckingEmail(true)
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      if (!response.ok) {
        console.error('Email check failed:', response.status, response.statusText)
        return
      }

      const result = await response.json()
      console.log('Email check result:', result)

      if (!result.available) {
        console.log('Email not available, showing toast...')
        setEmailAvailable(false)
        toast({
          title: "Email Already Registered",
          description: "This email is already registered. Please use a different email or sign in.",
          variant: "destructive"
        })
      } else {
        console.log('Email is available')
        setEmailAvailable(true)
      }
    } catch (error) {
      console.error('Email check error:', error)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-select registration type based on designation (if applicable)
      if (field === 'designation') {
        // Find student/resident category if exists
        const studentCategory = conferenceConfig.registration.categories.find(cat => 
          cat.label.toLowerCase().includes('student') || cat.label.toLowerCase().includes('resident')
        )
        
        if (value === 'PG/Student' && studentCategory) {
          newData.registrationType = studentCategory.key
        } else if (value === 'Consultant' && studentCategory && prev.registrationType === studentCategory.key) {
          // Clear student category if consultant is selected
          newData.registrationType = ''
        }
      }

      return newData
    })

    // Check email uniqueness when email field changes with proper debouncing
    if (field === 'email' && typeof value === 'string') {
      // Reset email availability when email changes
      setEmailAvailable(null)

      // Clear existing timeout
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout)
      }

      // Only check if email looks valid
      if (value.includes('@') && value.includes('.')) {
        const timeoutId = setTimeout(() => checkEmailUniqueness(value), 1000) // Increased delay
        setEmailCheckTimeout(timeoutId)
      }
    }
  }

  const handleWorkshopToggle = (workshop: string) => {
    setFormData((prev) => {
      const workshops = [...prev.workshopSelection]
      if (workshops.includes(workshop)) {
        return { ...prev, workshopSelection: workshops.filter((w) => w !== workshop) }
      } else {
        return { ...prev, workshopSelection: [...workshops, workshop] }
      }
    })
  }

  const addAccompanyingPerson = () => {
    setFormData((prev) => ({
      ...prev,
      accompanyingPersons: [...prev.accompanyingPersons, {
        name: "",
        age: 0,
        relationship: "",
        dietaryRequirements: ""
      }]
    }))
  }

  const removeAccompanyingPerson = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.filter((_, i) => i !== index)
    }))
  }

  const updateAccompanyingPerson = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.map((person, i) =>
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const validateStep = (currentStep: number) => {
    console.log(`Validating step ${currentStep}...`)
    console.log(`Current form data:`, JSON.stringify(formData, null, 2))

    switch (currentStep) {
      case 1:
        // Check all required fields for step 1
        const requiredFields = {
          title: formData.title,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          age: formData.age,
          designation: formData.designation,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          institution: formData.institution
        }

        console.log('Checking required fields:', requiredFields)

        const missingFields = Object.entries(requiredFields).filter(([key, value]) => {
          const isEmpty = !value || (typeof value === 'string' && value.trim() === '')
          if (isEmpty) {
            console.log(`Missing field: ${key} = "${value}"`)
          }
          return isEmpty
        })

        if (missingFields.length > 0) {
          const missingFieldNames = missingFields.map(([key]) => {
            // Convert camelCase to readable format
            return key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())
          }).join(', ')

          console.log('Missing fields detected:', missingFieldNames)

          // Mark all missing fields as touched to show error messages
          const touchedUpdates: Record<string, boolean> = {}
          missingFields.forEach(([key]) => {
            touchedUpdates[key] = true
          })
          setTouchedFields(prev => ({ ...prev, ...touchedUpdates }))

          toast({
            title: "❌ Cannot Proceed to Next Step",
            description: `Please fill in all required fields: ${missingFieldNames}`,
            variant: "destructive",
            duration: 8000 // Show for 8 seconds
          })

          // Scroll to the first missing field and highlight it
          const fieldElement = document.querySelector(`[name="${missingFields[0][0]}"], #${missingFields[0][0]}`)
          if (fieldElement) {
            fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add visual highlight
            fieldElement.classList.add('border-2', 'border-red-500')
            setTimeout(() => {
              fieldElement.classList.remove('border-2', 'border-red-500')
            }, 5000)
          }

          return false
        }
        // Password validation
        if (!formData.password || formData.password.length < 8) {
          console.log('Password validation failed:', formData.password?.length || 0)
          toast({
            title: "❌ Password Requirements Not Met",
            description: "Password must be at least 8 characters long to proceed.",
            variant: "destructive",
            duration: 8000
          })
          const passwordField = document.querySelector('input[type="password"]')
          if (passwordField) {
            passwordField.scrollIntoView({ behavior: 'smooth', block: 'center' })
            passwordField.classList.add('border-2', 'border-red-500')
            setTimeout(() => passwordField.classList.remove('border-2', 'border-red-500'), 5000)
          }
          return false
        }

        // Phone number validation
        if (formData.phone.length !== 10) {
          console.log('Phone number validation failed:', formData.phone.length)
          toast({
            title: "❌ Invalid Phone Number",
            description: "Phone number must be exactly 10 digits.",
            variant: "destructive",
            duration: 5000
          })
          document.querySelector('input[type="tel"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return false
        }

        // Age validation
        const ageNum = parseInt(formData.age)
        if (!ageNum || ageNum <= 0 || ageNum >= 100) {
          console.log('Age validation failed:', formData.age)
          toast({
            title: "❌ Invalid Age",
            description: "Age must be between 1 and 99.",
            variant: "destructive",
            duration: 5000
          })
          return false
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
          console.log('Password confirmation failed')
          toast({
            title: "Passwords Don't Match",
            description: "Please ensure both password fields contain the same value.",
            variant: "destructive",
            duration: 5000
          })
          document.querySelector('input[placeholder*="Confirm"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return false
        }

        // Email availability validation
        if (emailAvailable === false) {
          console.log('Email already registered')
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please use a different email or sign in with your existing account.",
            variant: "destructive",
            duration: 7000
          })
          document.querySelector('input[type="email"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return false
        }

        // Check if email verification is still pending
        if (emailAvailable === null && formData.email.includes('@') && formData.email.includes('.')) {
          console.log('Email verification still pending')
          // Trigger email check again
          setTimeout(() => checkEmailUniqueness(formData.email), 100)
          toast({
            title: "Email Verification Pending",
            description: "Please wait a moment while we verify your email address is available.",
            variant: "destructive",
            duration: 5000
          })
          return false
        }

        console.log('✅ Step 1 validation passed successfully!')
        return true
      case 2:
        console.log('Step 2 validation - checking registration details...')
        console.log('Step 2 form data:', {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          registrationType: formData.registrationType
        })

        // Check address fields
        const addressFields = {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }

        const missingAddressFields = Object.entries(addressFields).filter(([key, value]) => {
          return !value || (typeof value === 'string' && value.trim() === '')
        })

        if (missingAddressFields.length > 0) {
          const missingNames = missingAddressFields.map(([key]) =>
            key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase())
          ).join(', ')

          console.log('Missing address fields:', missingNames)
          toast({
            title: "❌ Address Information Required",
            description: `Please complete all address fields: ${missingNames}`,
            variant: "destructive",
            duration: 8000
          })
          // Highlight the first missing address field
          const firstField = document.querySelector(`[name="${missingAddressFields[0][0]}"]`)
          if (firstField) {
            firstField.scrollIntoView({ behavior: 'smooth', block: 'center' })
            firstField.classList.add('border-2', 'border-red-500')
            setTimeout(() => firstField.classList.remove('border-2', 'border-red-500'), 5000)
          }
          return false
        }

        // Check registration type
        if (!formData.registrationType) {
          console.log('Missing registration type')
          toast({
            title: "Registration Type Required",
            description: "Please select your registration type (Postgraduate or Consultant) before proceeding to the next step.",
            variant: "destructive",
            duration: 8000
          })
          // Scroll to the registration type section
          const radioGroup = document.querySelector('[role="radiogroup"]')
          if (radioGroup) {
            radioGroup.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add a red border to highlight the missing field
            radioGroup.classList.add('border-2', 'border-red-500', 'rounded-lg', 'p-2')
            setTimeout(() => {
              radioGroup.classList.remove('border-2', 'border-red-500', 'rounded-lg', 'p-2')
            }, 5000)
          }
          return false
        }

        // Validate accompanying persons if any
        if (formData.accompanyingPersons.length > 0) {
          for (let i = 0; i < formData.accompanyingPersons.length; i++) {
            const person = formData.accompanyingPersons[i]
            if (!person.name || !person.age || !person.relationship) {
              toast({
                title: "Incomplete Accompanying Person Details",
                description: `Please fill all required fields for Person ${i + 1} (Name, Age, and Relationship).`,
                variant: "destructive",
                duration: 8000
              })
              return false
            }
          }
        }

        console.log('✅ Step 2 validation passed!')
        return true

      case 3:
        console.log('Step 3 validation - checking payment and terms...')
        console.log('Step 3 form data:', {
          agreeTerms: formData.agreeTerms,
          paymentMethod: formData.paymentMethod,
          bankTransferUTR: formData.bankTransferUTR
        })

        // Only validate UTR if bank transfer is selected
        if (formData.paymentMethod === 'bank-transfer') {
          if (!formData.bankTransferUTR) {
            console.log('UTR number missing')
            toast({
              title: "UTR Number Required",
              description: "Please enter your bank transfer UTR number",
              variant: "destructive",
              duration: 6000
            })
            return false
          }

          if (formData.bankTransferUTR.length < 12) {
            console.log('UTR number too short')
            toast({
              title: "Invalid UTR Number",
              description: "UTR number must be at least 12 characters",
              variant: "destructive",
              duration: 6000
            })
            return false
          }
        }

        if (!formData.agreeTerms) {
          console.log('Terms not agreed')
          toast({
            title: "Terms and Conditions Required",
            description: "Please read and agree to the terms and conditions before proceeding.",
            variant: "destructive",
            duration: 6000
          })
          document.querySelector('#terms')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return false
        }

        console.log('✅ Step 3 validation passed!')
        return true
      default:
        console.log(`Default validation for step ${currentStep}`)
        return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🔄 Form submitted! Current step:', step)
    console.log('📋 Complete form data:', JSON.stringify(formData, null, 2))

    if (step < 3) {
      console.log('➡️ Attempting to move to next step...')
      console.log('📊 Email availability status:', emailAvailable)

      const isValid = validateStep(step)
      console.log(`✅ Step ${step} validation result:`, isValid)

      if (isValid) {
        console.log(`🎉 Moving from step ${step} to step ${step + 1}`)
        setStep(step + 1)

        // Show success toast for step completion
        toast({
          title: "Step Completed",
          description: `Step ${step} completed successfully. Moving to step ${step + 1}.`,
          variant: "default",
          duration: 2000
        })
      } else {
        console.log(`❌ Step ${step} validation failed - staying on current step`)
      }
      return
    }

    // Final submission when on step 3
    if (step === 3) {
      console.log('Final submission - validating step 3...')
      if (!validateStep(3)) {
        console.log('Step 3 validation failed!')
        return
      }

      console.log('Starting registration API call...')
      setLoading(true)
      try {
        console.log('Making API call to /api/auth/register...')

        const requestBody = {
          email: formData.email,
          password: formData.password,
          profile: {
            title: formData.title,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            age: parseInt(formData.age) || 0,
            designation: formData.designation,
            institution: formData.institution,
            mciNumber: formData.mciNumber,
            address: {
              street: formData.address,
              city: formData.city,
              state: formData.state,
              country: formData.country,
              pincode: formData.pincode
            },
            dietaryRequirements: formData.dietaryRequirements,
            specialNeeds: formData.specialNeeds
          },
          registration: {
            type: formData.registrationType,
            membershipNumber: formData.membershipNumber,
            workshopSelections: formData.workshopSelection,
            accompanyingPersons: formData.accompanyingPersons
          },
          payment: {
            method: formData.paymentMethod,
            bankTransferUTR: formData.paymentMethod === 'bank-transfer' ? formData.bankTransferUTR : undefined,
            amount: priceCalculation?.total || 0,
            tier: priceCalculation?.currentTier?.name || undefined,
            status: formData.paymentMethod === 'pay-now' ? "processing" : "pending"
          }
        }

        console.log('Request body being sent:', JSON.stringify(requestBody, null, 2))

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        const result = await response.json()
        console.log('API Response:', result)

        if (result.success) {
          // Check if payment is required (Razorpay gateway)
          if (result.requiresPayment && result.data.razorpayOrder) {
            console.log('Opening Razorpay payment gateway...')
            toast({
              title: "Validation Complete!",
              description: "Opening payment gateway..."
            })
            
            // Store pending registration data
            const pendingData = result.data.pendingRegistration
            
            // Open Razorpay payment modal
            const options = {
              key: result.data.razorpayKey || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: result.data.razorpayOrder.amount,
              currency: result.data.razorpayOrder.currency,
              name: conferenceConfig.shortName,
              description: 'Conference Registration Fee',
              order_id: result.data.razorpayOrder.id,
              prefill: {
                name: `${pendingData.profile.firstName} ${pendingData.profile.lastName}`,
                email: pendingData.email,
                contact: pendingData.profile.phone
              },
              notes: {
                registrationId: pendingData.registrationId
              },
              theme: {
                color: conferenceConfig.theme.primary
              },
              handler: async function (response: any) {
                // Payment successful - Now create user
                console.log('Payment successful, creating user...', response)
                
                // Show loading state
                setLoading(true)
                toast({
                  title: "Payment Successful!",
                  description: "Processing your registration..."
                })
                
                // Verify payment and create user on backend
                try {
                  const verifyResponse = await fetch('/api/payment/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                      // Send pending registration data to create user
                      pendingRegistration: pendingData
                    })
                  })
                  
                  const verifyResult = await verifyResponse.json()
                  setLoading(false) // Stop loading
                  
                  if (verifyResult.success) {
                    // Store payment method and registration data for success page
                    setPaymentMethod('gateway')
                    setRegistrationData({
                      email: pendingData.email,
                      name: `${pendingData.profile.firstName} ${pendingData.profile.lastName}`,
                      registrationId: pendingData.registrationId,
                      paymentId: response.razorpay_payment_id,
                      amount: result.data.razorpayOrder.amount / 100,
                      currency: result.data.razorpayOrder.currency
                    })
                    
                    toast({
                      title: "Registration Complete!",
                      description: "Check your email for confirmation."
                    })
                    // Show success page
                    setStep(4)
                  } else if (verifyResult.paymentSuccessful) {
                    // CRITICAL CASE: Payment succeeded but registration failed
                    toast({
                      title: "Payment Successful",
                      description: verifyResult.message || "Payment received. Our team will complete your registration.",
                      variant: "default"
                    })
                    // Show special message
                    alert(`✅ Payment Successful!\n\n${verifyResult.message}\n\nPayment ID: ${verifyResult.support?.paymentId}\nOrder ID: ${verifyResult.support?.orderId}\n\nPlease contact: ${verifyResult.support?.email}`)
                  } else {
                    toast({
                      title: "Error",
                      description: verifyResult.message || "Failed to complete registration",
                      variant: "destructive"
                    })
                  }
                } catch (error) {
                  console.error('Payment verification error:', error)
                  setLoading(false) // Stop loading on error
                  toast({
                    title: "Error",
                    description: "Failed to verify payment. Please contact support.",
                    variant: "destructive"
                  })
                }
              },
              modal: {
                ondismiss: function() {
                  toast({
                    title: "Payment Cancelled",
                    description: "No charges applied. Please try again when ready.",
                    variant: "destructive"
                  })
                }
              }
            }
            
            // @ts-ignore
            const rzp = new window.Razorpay(options)
            rzp.open()
            return
          }

          // For bank transfer or other methods
          setPaymentMethod('bank-transfer')
          setRegistrationData({
            email: formData.email,
            name: `${formData.firstName} ${formData.lastName}`,
            registrationId: result.data.registrationId
          })
          
          toast({
            title: "Registration Successful!",
            description: "Your account has been created. Please check your email for confirmation."
          })

          console.log('Payment method:', formData.paymentMethod)
          console.log('Price calculation:', priceCalculation)

          // Show success page - bank transfer payment pending approval
          setStep(4)
        } else {
          toast({
            title: "Registration Failed",
            description: result.message || "Please try again.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Registration error:', error)
        toast({
          title: "Error",
          description: "An error occurred during registration. Please check the console for details.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (!amount || typeof amount !== 'number') return "₹0"
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `₹${amount.toLocaleString()}`
  }

  // Validation helper component
  const ValidationSummary = ({ currentStep }: { currentStep: number }) => {
    let missingFields: string[] = []

    if (currentStep === 1) {
      const requiredFields = {
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        designation: formData.designation,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        institution: formData.institution,
        mciNumber: formData.mciNumber
      }

      missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
        .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase()))
    }

    if (missingFields.length === 0) return null

    return (
      <Alert className="mb-4 border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-conference-primary" />
        <AlertDescription className="text-yellow-800">
          <strong>Please complete the following required fields:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            {missingFields.map(field => (
              <li key={field} className="text-sm">{field}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Compact Header */}
            <div className="border-b dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-conference-primary text-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 3</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                  <Select value={formData.title} onValueChange={(value) => handleInputChange("title", value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                    </SelectContent>
                  </Select>
                  {touchedFields.title && !formData.title && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Title is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[a-zA-Z\s'-]*$/.test(value)) {
                        handleInputChange("firstName", value)
                      }
                    }}
                    required
                    className="h-10"
                  />
                  {touchedFields.firstName && !formData.firstName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      First name is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => {
                      const value = e.target.value
                      if (/^[a-zA-Z\s'-]*$/.test(value)) {
                        handleInputChange("lastName", value)
                      }
                    }}
                    required
                    className="h-10"
                  />
                  {touchedFields.lastName && !formData.lastName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Last name is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className={`h-10 pr-10 ${
                        isCheckingEmail ? "border-blue-300" :
                          emailAvailable === true ? "border-green-300" :
                            emailAvailable === false ? "border-red-300" : ""
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isCheckingEmail && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      {emailAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {emailAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                  {emailAvailable === true && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Email is available
                    </p>
                  )}
                  {emailAvailable === false && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Email already registered
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      if (value.length <= 10) {
                        handleInputChange("phone", value)
                      }
                    }}
                    required
                    maxLength={10}
                    placeholder="10-digit mobile"
                    className="h-10"
                  />
                  {formData.phone && formData.phone.length !== 10 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Must be 10 digits
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Age *</label>
                  <Input
                    value={formData.age}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      const numValue = parseInt(value) || 0
                      if (value === '' || (numValue > 0 && numValue < 100)) {
                        handleInputChange("age", value)
                      }
                    }}
                    required
                    placeholder="Age"
                    className="h-10"
                  />
                  {formData.registrationType === conferenceConfig.registration.categories[0]?.key && parseInt(formData.age) >= 70 && parseInt(formData.age) < 100 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Free registration (70+)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation *</label>
                  <Select value={formData.designation} onValueChange={(value) => handleInputChange("designation", value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                      <SelectItem value="PG/Student">PG/Student</SelectItem>
                    </SelectContent>
                  </Select>
                  {touchedFields.designation && !formData.designation && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Designation is required
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Institution/Hospital *</label>
                  <Input
                    value={formData.institution}
                    onChange={(e) => handleInputChange("institution", e.target.value)}
                    required
                    className="h-10"
                  />
                  {touchedFields.institution && !formData.institution && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Institution is required
                    </p>
                  )}
                </div>
              </div>

              {/* Password Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-conference-primary" />
                  Account Security
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="h-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.password && formData.password.length < 8 && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Password must be at least 8 characters
                      </p>
                    )}
                    {touchedFields.password && !formData.password && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Password is required
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password *</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className="h-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {touchedFields.confirmPassword && !formData.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please confirm your password
                      </p>
                    )}
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Passwords do not match
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-conference-primary" />
                  Address Information
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                    <Textarea
                      value={formData.address}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^[a-zA-Z0-9\s.,#\-/()]*$/.test(value)) {
                          handleInputChange("address", value)
                        }
                      }}
                      placeholder="Complete address"
                      className="min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <Input
                        value={formData.city}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[a-zA-Z\s'-]*$/.test(value)) {
                            handleInputChange("city", value)
                          }
                        }}
                        className="h-10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">State/Province</label>
                      <Input
                        value={formData.state}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[a-zA-Z\s'-]*$/.test(value)) {
                            handleInputChange("state", value)
                          }
                        }}
                        className="h-10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                      <Input
                        value={formData.country}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[a-zA-Z\s'-]*$/.test(value)) {
                            handleInputChange("country", value)
                          }
                        }}
                        className="h-10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal/ZIP Code</label>
                      <Input
                        value={formData.pincode}
                        onChange={(e) => {
                          const value = e.target.value
                          if (/^[0-9-]*$/.test(value)) {
                            handleInputChange("pincode", value)
                          }
                        }}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                <Button
                  type="submit"
                  className="bg-conference-primary hover:opacity-90 text-black h-10"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Next Step
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            {/* Compact Header */}
            <div className="border-b dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-conference-primary text-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registration Details</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 3</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Registration Type *</label>
                {/* Special Offer Banner */}
                {currentTier && (
                  <div className="bg-conference-primary text-black p-3 rounded-lg mb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{currentTier.name}</h3>
                        <p className="text-xs opacity-90">{getTierSummary()}</p>
                      </div>
                    <div className="text-right"></div>
                  </div>
                </div>
              )}

              <RadioGroup
                value={formData.registrationType}
                onValueChange={(value) => handleInputChange("registrationType", value)}
                className="space-y-2"
              >
                {registrationTypes
                  .filter(type => {
                    // Find student/resident category
                    const studentCategory = conferenceConfig.registration.categories.find(cat => 
                      cat.label.toLowerCase().includes('student') || cat.label.toLowerCase().includes('resident')
                    )
                    
                    // If designation is PG/Student, only show student/resident option
                    if (formData.designation === 'PG/Student' && studentCategory) {
                      return type.value === studentCategory.key
                    }
                    // If designation is Consultant, show all except student/resident
                    if (formData.designation === 'Consultant' && studentCategory) {
                      return type.value !== studentCategory.key
                    }
                    // If no designation selected yet, show all
                    return true
                  })
                  .map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="text-sm">
                        {type.label} {type.price !== undefined ? `(${type.currency === 'USD' ? '$' : '₹'}${type.price.toLocaleString()})` : '(Price TBD)'}
                      </Label>
                    </div>
                  ))}
              </RadioGroup>
              {!formData.registrationType && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Please select a registration type
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Membership Number (if applicable)</label>
              <Input
                value={formData.membershipNumber}
                onChange={(e) => handleInputChange("membershipNumber", e.target.value)}
                placeholder="Membership number"
                className="h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">MCI Number *</label>
              <Input
                value={formData.mciNumber}
                onChange={(e) => {
                  const value = e.target.value
                  if (/^[a-zA-Z0-9-]*$/.test(value)) {
                    handleInputChange("mciNumber", value)
                  }
                }}
                placeholder="MCI number"
                required
                className="h-10"
              />
              {formData.mciNumber && !/^[a-zA-Z0-9-]{5,}$/.test(formData.mciNumber) && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  MCI number must be at least 5 characters
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Workshop Selection (Optional)</label>
              <div className="space-y-2">
                {workshops.map((workshop) => (
                  <div key={workshop.id} className={`flex items-center justify-between p-3 border rounded-lg ${!workshop.canRegister ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50'
                    }`}>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={workshop.id}
                        checked={formData.workshopSelection.includes(workshop.id)}
                        onCheckedChange={() => handleWorkshopToggle(workshop.id)}
                        disabled={!workshop.canRegister}
                      />
                      <div>
                        <label
                          htmlFor={workshop.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {workshop.label}
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {workshop.price ? `₹${workshop.price.toLocaleString()}` : 'Price TBD'}
                          {workshop.availableSeats !== undefined && (
                            <span className={`ml-2 ${workshop.availableSeats > 10 ? 'text-green-600' :
                                workshop.availableSeats > 0 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              • {workshop.availableSeats > 0 ? `${workshop.availableSeats} seats left` : 'Fully Booked'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Dietary Requirements - Commented out for now */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dietary Requirements</label>
              <Select
                value={formData.dietaryRequirements}
                onValueChange={(value) => handleInputChange("dietaryRequirements", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select if applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Special Requirements</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="gluten-free">Gluten Free</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="other">Other (Please specify)</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Needs/Accessibility Requirements
              </label>
              <Textarea
                value={formData.specialNeeds}
                onChange={(e) => handleInputChange("specialNeeds", e.target.value)}
                placeholder="Please let us know if you have any special needs or accessibility requirements"
              />
            </div>

            {/* Accompanying Persons Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Accompanying Persons (Optional)</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAccompanyingPerson}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Add Person</span>
                </Button>
              </div>

              {formData.accompanyingPersons.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No accompanying persons added yet.</p>
                  <p className="text-xs">Click "Add Person" to include family or colleagues.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.accompanyingPersons.map((person, index) => (
                    <div key={index} className="border dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Person {index + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAccompanyingPerson(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                          <Input
                            value={person.name}
                            onChange={(e) => {
                              const value = e.target.value
                              // Only allow letters, spaces, hyphens, and apostrophes for names
                              if (/^[a-zA-Z\s'-]*$/.test(value)) {
                                updateAccompanyingPerson(index, 'name', value)
                              }
                            }}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age *</label>
                          <Input
                            value={person.age || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              // Only allow numbers
                              if (/^\d*$/.test(value)) {
                                const age = parseInt(value) || 0
                                if (age >= 0 && age <= 120) {
                                  updateAccompanyingPerson(index, 'age', age)
                                }
                              }
                            }}
                            placeholder="Age"
                          />
                          {person.age < 10 && person.age > 0 && (
                            <p className="text-xs text-green-600 mt-1">✓ Free registration (under 10)</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship *</label>
                          <select
                            value={person.relationship}
                            onChange={(e) => updateAccompanyingPerson(index, 'relationship', e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select relationship</option>
                            <option value="spouse">Spouse</option>
                            <option value="parent">Parent</option>
                            <option value="child">Child</option>
                            <option value="sibling">Sibling</option>
                            <option value="friend">Friend</option>
                            <option value="colleague">Colleague</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      {/* Dietary Requirements - Commented out for now */}
                      {/* <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Requirements</label>
                        <Input
                          value={person.dietaryRequirements || ''}
                          onChange={(e) => updateAccompanyingPerson(index, 'dietaryRequirements', e.target.value)}
                          placeholder="Any dietary requirements (optional)"
                        />
                      </div> */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount Code Section */}
            {/* <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Discount Code (Optional)</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    value={formData.discountCode}
                    onChange={(e) => handleInputChange("discountCode", e.target.value)}
                    placeholder="Enter discount code (e.g., EARLY2025, STUDENT10)"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={calculatePrice}
                  disabled={!formData.discountCode}
                >
                  Apply
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Available discounts: Early Bird, Student discounts, Independence Day offers
              </p>
            </div> */}
            </div>

            <div className="flex gap-3 justify-between pt-4 border-t border-gray-200 mt-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10">
                Previous
              </Button>
              <Button type="submit" className="bg-conference-primary hover:opacity-90 text-black h-10">
                Next Step
              </Button>
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            {/* Compact Header */}
            <div className="border-b dark:border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-conference-primary text-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Step {step} of 3</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
            {/* Price Summary */}
            {priceCalculation && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Registration Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Registration Fee:</span>
                    <span className="font-medium">
                      {formatCurrency(priceCalculation.registrationFee || priceCalculation.baseAmount || 0, priceCalculation.currency)}
                    </span>
                  </div>
                  {priceCalculation.workshopFees > 0 && (
                    <div className="flex justify-between">
                      <span>Workshop Fees ({formData.workshopSelection.length} workshops):</span>
                      <span className="font-medium">
                        {formatCurrency(priceCalculation.workshopFees, priceCalculation.currency)}
                      </span>
                    </div>
                  )}
                  {priceCalculation.accompanyingPersonFees > 0 && (
                    <div className="flex justify-between">
                      <span>Accompanying Persons ({formData.accompanyingPersons.length} persons):</span>
                      <span className="font-medium">
                        {formatCurrency(priceCalculation.accompanyingPersonFees, priceCalculation.currency)}
                      </span>
                    </div>
                  )}
                  {priceCalculation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount Applied{formData.discountCode ? ` (${formData.discountCode})` : ''}:</span>
                      <span className="font-medium">
                        -{formatCurrency(priceCalculation.discount, priceCalculation.currency)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-conference-primary">
                        {formatCurrency(priceCalculation.total, priceCalculation.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Info - Admin Controlled (No User Selection) */}
            {formData.paymentMethod === 'pay-now' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Online Payment Gateway</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">You will be redirected to Razorpay after submitting</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Instructions - Admin Controlled */}
            {formData.paymentMethod === 'bank-transfer' && (
            <div className="bg-yellow-50 dark:bg-blue-900/20 border border-yellow-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-yellow-100 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Bank Transfer Payment Details
              </h3>
              <div className="space-y-4 text-sm">
                {/* QR Code Display */}
                {paymentConfig.bankDetails?.qrCodeUrl && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700 text-center">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-3">Scan QR Code to Pay</p>
                    <img 
                      src={paymentConfig.bankDetails?.qrCodeUrl || ''} 
                      alt="Payment QR Code" 
                      className="mx-auto w-48 h-48 border-2 border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">Scan with any UPI app</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Account Name:</span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                      <p className="text-gray-800 dark:text-gray-200 font-medium break-all">
                        {paymentConfig.bankDetails?.accountName || conferenceConfig.shortName}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const name = paymentConfig.bankDetails?.accountName || conferenceConfig.shortName
                          navigator.clipboard.writeText(name)
                          toast({ title: "Copied!", description: "Account name copied to clipboard" })
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-blue-900 text-conference-primary dark:text-blue-300 rounded hover:bg-yellow-200 dark:hover:bg-blue-800 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Account Number:</span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                      <p className="text-gray-800 dark:text-gray-200 font-mono break-all">
                        {paymentConfig.bankDetails?.accountNumber || '137912010002201'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const accNum = paymentConfig.bankDetails?.accountNumber || '137912010002201'
                          navigator.clipboard.writeText(accNum)
                          toast({ title: "Copied!", description: "Account number copied to clipboard" })
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-blue-900 text-conference-primary dark:text-blue-300 rounded hover:bg-yellow-200 dark:hover:bg-blue-800 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">IFSC Code:</span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                      <p className="text-gray-800 dark:text-gray-200 font-mono">
                        {paymentConfig.bankDetails?.ifscCode || 'UBIN0813796'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const ifsc = paymentConfig.bankDetails?.ifscCode || 'UBIN0813796'
                          navigator.clipboard.writeText(ifsc)
                          toast({ title: "Copied!", description: "IFSC code copied to clipboard" })
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-blue-900 text-conference-primary dark:text-blue-300 rounded hover:bg-yellow-200 dark:hover:bg-blue-800 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Bank Name:</span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                      <p className="text-gray-800 dark:text-gray-200 break-all">
                        {paymentConfig.bankDetails?.bankName || 'Union Bank of India'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const bank = paymentConfig.bankDetails?.bankName || 'Union Bank of India'
                          navigator.clipboard.writeText(bank)
                          toast({ title: "Copied!", description: "Bank name copied to clipboard" })
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-blue-900 text-conference-primary dark:text-blue-300 rounded hover:bg-yellow-200 dark:hover:bg-blue-800 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {paymentConfig.bankDetails?.branch && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-blue-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Branch:</span>
                    <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded border">
                      <p className="text-gray-800 dark:text-gray-200 break-all">{paymentConfig.bankDetails?.branch}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (paymentConfig.bankDetails?.branch) {
                            navigator.clipboard.writeText(paymentConfig.bankDetails.branch)
                            toast({ title: "Copied!", description: "Branch name copied to clipboard" })
                          }
                        }}
                        className="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-blue-900 text-conference-primary dark:text-blue-300 rounded hover:bg-yellow-200 dark:hover:bg-blue-800 flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  )}
                </div>
                <div className="border-t border-yellow-200 dark:border-blue-700 pt-3 mt-4">
                  <p className="text-blue-800 dark:text-blue-200 font-medium">
                    💡 Transfer Amount: ₹{priceCalculation?.finalAmount || 'TBD'}
                  </p>
                  <p className="text-xs text-conference-primary dark:text-blue-300 mt-1">
                    Please transfer the exact amount and enter the UTR number below
                  </p>
                </div>
              </div>
            </div>
            )}

            {/* UTR Number Field - Only for Bank Transfer */}
            {formData.paymentMethod === 'bank-transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bank Transfer UTR Number *
              </label>
              <Input
                type="text"
                value={formData.bankTransferUTR}
                onChange={(e) => handleInputChange("bankTransferUTR", e.target.value)}
                placeholder="Enter 12-digit UTR number from your bank transfer"
                className="dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                maxLength={12}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The UTR (Unique Transaction Reference) number is provided by your bank after successful transfer
              </p>
            </div>
            )}

            <div className="flex items-start space-x-2 mt-6">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) => handleInputChange("agreeTerms", checked === true)}
              />
              <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="#" className="text-conference-primary dark:text-conference-primary hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-conference-primary dark:text-conference-primary hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            </div>
            
            <div className="flex gap-3 justify-between pt-4 border-t border-gray-200 mt-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-10">
                Previous
              </Button>
              <Button
                type="submit"
                className="bg-conference-primary hover:opacity-90 text-black h-10"
                disabled={!formData.agreeTerms || (formData.paymentMethod === 'bank-transfer' && !formData.bankTransferUTR) || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </div>
          </div>
        )
      case 4:
        // Different success pages based on payment method
        if (paymentMethod === 'gateway') {
          // Payment Gateway Success Page
          return (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-12"
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Payment Successful! 🎉</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Your payment has been processed successfully and your registration is now <span className="font-bold text-green-600">confirmed</span>.
              </p>

              {/* Registration Details Card */}
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 p-6 rounded-xl mb-6">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Registration Details</h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Name:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{registrationData?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Email:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{registrationData?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Registration ID:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{registrationData?.registrationId}</span>
                  </div>
                  {registrationData?.paymentId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Payment ID:</span>
                      <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{registrationData?.paymentId}</span>
                    </div>
                  )}
                  {registrationData?.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">Amount Paid:</span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">₹{registrationData?.amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg mb-6 text-left">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">What's Next?</h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>✅ Confirmation email sent to your inbox</p>
                  <p>✅ You can now sign in to access your dashboard</p>
                  <p>✅ Download your registration certificate</p>
                  <p>✅ Receive conference updates and materials</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:justify-center">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
                    Sign In to Dashboard
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">Return to Home</Button>
                </Link>
              </div>
            </motion.div>
          )
        } else {
          // Bank Transfer Success Page
          return (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center p-12"
            >
              <CheckCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Registration Application Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thank you for registering for {conferenceConfig.shortName}. Your registration application has been submitted successfully.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                An acknowledgment email has been sent to <span className="font-semibold">{registrationData?.email || formData.email}</span> with your
                application details.
              </p>
              <div className="bg-yellow-50 dark:bg-blue-900/20 border border-yellow-200 dark:border-blue-800 p-6 rounded-lg mb-6 text-left">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-yellow-100 mb-4">What happens next?</h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <p>• Our team will verify your bank transfer within 10 business days</p>
                  <p>• You will receive a confirmation email once your payment is verified</p>
                  <p>• Your registration will be confirmed and dashboard access will be activated</p>
                  <p>• Conference materials and updates will be shared via email</p>
                </div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg mb-6">
                <p className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Important:</strong> Your registration is currently under review. Please allow up to 10 business days for verification.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:justify-center">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button className="bg-conference-primary hover:bg-yellow-800 w-full sm:w-auto">
                    Sign In Now
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">Return to Home</Button>
                </Link>
              </div>
            </motion.div>
          )
        }
      default:
        return null
    }
  }

  // Enhanced loading skeleton
  if (!mounted || loadingPricing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#181818]">
        <Navigation />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header Skeleton */}
            <div className="text-center mb-12">
              <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg w-3/4 mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-1/2 mx-auto animate-pulse"></div>
            </div>

            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-2/3 mb-4 animate-pulse"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-4/6 animate-pulse"></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="h-40 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-xl">
                  {/* Progress Steps */}
                  <div className="flex justify-between mb-8">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-full animate-pulse"></div>
                        {i < 3 && <div className="flex-1 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 mx-2 animate-pulse"></div>}
                      </div>
                    ))}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-6">
                    <div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="mt-8">
                    <div className="h-12 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading Text */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">Loading registration form...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show redirecting message if external redirect is enabled
  if (redirecting) {
    const redirectUrl = paymentConfig.redirectUrl || paymentConfig.externalRedirectUrl || ''
    
    return (
      <div className="min-h-screen bg-white dark:bg-[#181818]">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="text-center p-8 max-w-2xl mx-auto">
            <div className="mb-8">
              <svg className="w-20 h-20 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              External Registration Enabled
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Registration is handled through an external system. Click the button below to open the registration page.
            </p>
            
            {redirectUrl && (
              <div className="space-y-4">
                <a
                  href={redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                >
                  <span>Open Registration Page</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Note:</strong> If the page didn't open automatically, your browser may have blocked the popup.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please click the button above or copy this link:
                  </p>
                  <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                    <code className="text-sm text-blue-600 dark:text-blue-400 break-all">
                      {redirectUrl}
                    </code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#181818] text-gray-800 dark:text-gray-200">
      <Navigation />

      {/* Loading Overlay during payment verification */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md mx-4">
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-yellow-200 dark:border-yellow-900 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please wait while we verify your payment and create your registration...
              </p>
              <div className="flex items-center justify-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
                This usually takes just a few seconds
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-16 pb-8">
        {/* Compact Two-Column Layout */}
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
            
            {/* LEFT SIDE - Conference Info (Sticky) */}
            <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
              <div className="space-y-4">
                {/* Conference Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {conferenceConfig.shortName}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {conferenceConfig.name}
                  </p>
                </div>

                {/* Date & Location */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-conference-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Date</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-conference-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Venue</p>
                      <p className="text-xs sm:text-sm text-gray-600">{conferenceConfig.venue.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600">{conferenceConfig.venue.city}, {conferenceConfig.venue.state}</p>
                    </div>
                  </div>
                </div>

                {/* Registration Steps */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Registration Steps</h3>
                  <div className="space-y-2">
                    {steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                          s.completed ? 'bg-green-500 text-white' : 
                          s.current ? 'bg-conference-primary text-black' : 
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {s.completed ? <CheckCircle className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-xs sm:text-sm ${s.current ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Already have account */}
                <div className="text-xs sm:text-sm text-gray-600">
                  Already registered? <Link href="/login" className="text-conference-primary font-semibold hover:underline">Sign in here</Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - Registration Form */}
            <div className="lg:col-span-3">
              <Card className="shadow-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1f1f1f]">
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <form onSubmit={handleSubmit}>
                    {renderStepContent()}
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
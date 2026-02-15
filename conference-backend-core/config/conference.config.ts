/**
 * Conference Configuration
 * 
 * This is the ONLY file you need to edit for a new conference.
 * All other components will automatically use these settings.
 */

export interface ConferenceConfig {
  // Basic Information
  name: string
  shortName: string
  registrationPrefix?: string  // Optional: Custom prefix for IDs (e.g., "NV2026")
  organizationName: string
  tagline?: string
  
  // Event Dates
  eventDate: {
    start: string // YYYY-MM-DD
    end: string   // YYYY-MM-DD
  }
  
  // Venue Information
  venue: {
    name: string
    address?: string
    city: string
    state: string
    country: string
    pincode?: string
    description?: string
    facilities?: string[]
    accessibility?: string[]
    mapUrl?: string
    googleMapsLink?: string
    aboutCity?: {
      title?: string
      description?: string
      highlights?: Array<{
        title: string
        description: string
        icon: string
      }>
    }
  }
  
  // Contact Information
  contact: {
    email: string
    phone: string
    website: string
    supportEmail?: string
    abstractsEmail?: string
  }
  
  // Theme Colors - These will be applied throughout the system
  theme: {
    primary: string      // Main brand color (buttons, headers)
    secondary: string    // Accent color (links, highlights)
    accent: string       // Special highlights (warnings, alerts)
    success: string      // Success states
    error: string        // Error states
    warning: string      // Warning states
    dark: string         // Dark text and elements
    light: string        // Light backgrounds
  }
  
  // Registration Configuration
  registration: {
    enabled: boolean
    startDate?: string   // YYYY-MM-DD
    endDate?: string     // YYYY-MM-DD
    
    // Form Fields Configuration
    formFields: {
      titles: string[]              // ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.']
      designations: string[]        // ['Consultant', 'PG/Student']
      relationshipTypes: string[]   // ['Spouse', 'Child', 'Parent', 'Other']
      paymentMethods: string[]      // ['bank-transfer', 'online', 'cash']
    }
    
    // Registration Categories
    categories: {
      key: string
      label: string
      description?: string
      requiresMembership?: boolean
      membershipField?: string
    }[]
    
    // Workshop Configuration
    workshopsEnabled: boolean
    maxWorkshopsPerUser?: number
    
    // Accompanying Person
    accompanyingPersonEnabled: boolean
    maxAccompanyingPersons?: number
  }
  
  // Payment Configuration
  payment: {
    enabled: boolean
    currency: string
    currencySymbol: string
    
    // Payment Methods
    methods: {
      razorpay: boolean
      bankTransfer: boolean
      cash: boolean
    }
    
    // Bank Details (for bank transfer)
    bankDetails?: {
      accountName: string
      accountNumber: string
      bankName: string
      ifscCode: string
      branchName?: string
    }
    
    // Pricing Tiers
    tiers: {
      earlyBird?: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
      regular: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
      onsite?: {
        enabled: boolean
        startDate: string
        endDate: string
        label: string
      }
    }
  }
  
  // Abstract Submission
  abstracts: {
    enabled: boolean
    enableAbstractsWithoutRegistration?: boolean  // Allow unregistered users to submit abstracts
    submissionWindow?: {
      enabled: boolean
      start: string
      end: string
    }
    maxAbstractsPerUser: number
    
    // Tracks (e.g., Free Paper, Poster, E-Poster)
    tracks: {
      key: string
      label: string
      enabled: boolean
      categories?: string[]
      subcategories?: string[]
    }[]
    
    // File Upload Settings
    allowedInitialFileTypes: string[]
    allowedFinalFileTypes: string[]
    maxFileSizeMB: number
  }
  
  // Email Branding
  email: {
    fromName: string
    replyTo: string
    footerText?: string
    logoUrl?: string
  }
  
  // Social Media
  social?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
    youtube?: string
  }
  
  // Features Toggle
  features: {
    userDashboard: boolean
    adminPanel: boolean
    reviewerPortal: boolean
    abstractSubmission: boolean
    workshopBooking: boolean
    certificateGeneration: boolean
    qrCodeGeneration: boolean
  }
}

/**
 * DEFAULT CONFIGURATION
 * ISSH Midterm CME 2026 - 12th ISSH Midterm CME on Hand Surgery
 */
export const conferenceConfig: ConferenceConfig = {
  // Basic Information
  name: "12th ISSH Midterm CME Hyderabad 2026",
  shortName: "ISSH Midterm CME 2026",
  registrationPrefix: "ISSH2026",  // Prefix for registration IDs (ISSH2026-001, ISSH2026-002, etc.)
  organizationName: "Indian Society for Surgery of the Hand (ISSH)",
  tagline: "Inappropriate, Appropriate and Most Appropriate ways to do Hand Surgery",
  
  // Event Dates
  eventDate: {
    start: "2026-04-25",
    end: "2026-04-26"
  },
  
  // Venue
  venue: {
    name: "Hyderabad International Convention Center (HICC), Novotel",
    address: "HICC Complex, Madhapur",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500081",
    description: "HICC is India's largest purpose-built convention center, offering world-class facilities for international conferences and events. Located in the heart of HITEC City, it provides state-of-the-art infrastructure for medical conferences.",
    facilities: [
      "Large Convention Halls (2000+ capacity)",
      "Multiple Breakout Rooms",
      "State-of-the-art AV Equipment",
      "High-Speed Wi-Fi",
      "Live Surgery Demonstration Facilities",
      "Exhibition Area",
      "Premium Catering by Novotel",
      "Ample Parking"
    ],
    accessibility: [
      "30 mins from Rajiv Gandhi International Airport",
      "Located in HITEC City",
      "Metro connectivity (Hitec City Station)",
      "Wheelchair accessible"
    ],
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.3!2d78.3!3d17.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc8c5d69df%3A0x19688beb557fa0ee!2sHyderabad%20International%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1234567890",
    googleMapsLink: "https://maps.google.com/?q=HICC+Hyderabad+International+Convention+Centre",
    aboutCity: {
      title: "About Hyderabad",
      description: "Hyderabad, the City of Pearls, is a vibrant metropolis that seamlessly blends rich history with modern innovation. Known for its world-class healthcare facilities, premier medical institutions, and warm hospitality.",
      highlights: [
        {
          title: "Medical Excellence",
          description: "Home to premier medical institutions like KIMS Hospital, Apollo Hospital, and leading orthopedic and hand surgery centers.",
          icon: "Hospital"
        },
        {
          title: "Modern Infrastructure",
          description: "World-class convention centers like HICC, luxury hotels, and excellent transportation make it ideal for international conferences.",
          icon: "Building"
        },
        {
          title: "Cultural Heritage",
          description: "Rich history with iconic landmarks like Charminar, Golconda Fort, Hussain Sagar, and vibrant local cuisine including the famous Hyderabadi Biryani.",
          icon: "Landmark"
        }
      ]
    }
  },

  // Contact
  contact: {
    email: "contact@isshmidtermcme2026.com",
    phone: "+91 9052192744",
    website: "https://isshmidtermcme2026.com",
    supportEmail: "support@isshmidtermcme2026.com",
    abstractsEmail: "abstracts@isshmidtermcme2026.com"
  },
  
  // Theme Colors - ISSH palette
  theme: {
    primary: "#25406b",      // Deep Blue - main brand color
    secondary: "#ebc975",    // Gold - accents  
    accent: "#852016",       // Deep Red - highlights
    success: "#10b981",      // Green - success states
    error: "#ef4444",        // Red - errors
    warning: "#f59e0b",      // Amber - warnings
    dark: "#25406b",         // Deep Blue - dark text
    light: "#f5f0e6"         // Cream - light backgrounds
  },
  
  // Registration
  registration: {
    enabled: true,
    startDate: "2025-10-01",
    endDate: "2026-04-24",
    
    // Form field options (used in dropdowns and validation)
    formFields: {
      titles: ['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'],
      designations: ['Consultant', 'PG/Student'],
      relationshipTypes: ['Spouse', 'Child', 'Parent', 'Friend', 'Colleague', 'Other'],
      paymentMethods: ['bank-transfer', 'online', 'pay-now', 'cash']
    },
    
    categories: [
      {
        key: "issh-member",
        label: "ISSH Member",
        requiresMembership: true,
        membershipField: "membershipNumber"
      },
      {
        key: "non-issh-member",
        label: "Non ISSH Member"
      },
      {
        key: "postgraduate",
        label: "Postgraduate"
      }
    ],
    
    workshopsEnabled: true,
    maxWorkshopsPerUser: 3,
    
    accompanyingPersonEnabled: true,
    maxAccompanyingPersons: 2
  },
  
  // Payment
  payment: {
    enabled: true,
    currency: "INR",
    currencySymbol: "₹",
    
    methods: {
      razorpay: true,
      bankTransfer: true,
      cash: true
    },
    
    bankDetails: {
      accountName: "ISSH Midterm CME 2026",
      accountNumber: "1234567890",
      bankName: "State Bank of India",
      ifscCode: "SBIN0001234",
      branchName: "Hyderabad Main Branch"
    },
    
    tiers: {
      earlyBird: {
        enabled: true,
        startDate: "2025-10-01",
        endDate: "2026-02-14",
        label: "Early Bird"
      },
      regular: {
        enabled: true,
        startDate: "2026-02-15",
        endDate: "2026-03-31",
        label: "Regular"
      },
      onsite: {
        enabled: true,
        startDate: "2026-04-01",
        endDate: "2026-04-26",
        label: "Late / Spot Registration"
      }
    }
  },
  
  // Abstracts
  abstracts: {
    enabled: false,
    enableAbstractsWithoutRegistration: false,  // New field from TNSCON2026 structure, disabled for ISSH
    submissionWindow: {
      enabled: false,
      start: "2025-10-01",
      end: "2026-03-31"
    },
    maxAbstractsPerUser: 5,
    
    tracks: [],
    
    allowedInitialFileTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    allowedFinalFileTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    maxFileSizeMB: 10
  },
  
  // Email
  email: {
    fromName: "ISSH Midterm CME 2026",
    replyTo: "noreply@isshmidtermcme2026.com",
    footerText: "© 2026 ISSH Midterm CME - Indian Society for Surgery of the Hand. All rights reserved.",
    logoUrl: "/images/logo.png"
  },
  
  // Social Media
  social: {
    facebook: "https://facebook.com/issh",
    twitter: "https://twitter.com/issh",
    instagram: "https://instagram.com/issh",
    linkedin: "https://linkedin.com/company/issh"
  },
  
  // Features
  features: {
    userDashboard: true,
    adminPanel: true,
    reviewerPortal: true,
    abstractSubmission: true,
    workshopBooking: true,
    certificateGeneration: true,
    qrCodeGeneration: true
  }
}

/**
 * Helper function to get conference config
 * Can be extended to support database-driven config
 */
export function getConferenceConfig(): ConferenceConfig {
  return conferenceConfig
}

/**
 * Get current pricing tier based on date
 */
export function getCurrentPricingTier(): string {
  const today = new Date()
  const config = conferenceConfig.payment.tiers
  
  if (config.earlyBird?.enabled) {
    const start = new Date(config.earlyBird.startDate)
    const end = new Date(config.earlyBird.endDate)
    if (today >= start && today <= end) return 'earlyBird'
  }
  
  if (config.regular?.enabled) {
    const start = new Date(config.regular.startDate)
    const end = new Date(config.regular.endDate)
    if (today >= start && today <= end) return 'regular'
  }
  
  if (config.onsite?.enabled) {
    const start = new Date(config.onsite.startDate)
    const end = new Date(config.onsite.endDate)
    if (today >= start && today <= end) return 'onsite'
  }
  
  return 'regular'
}

/**
 * Check if registration is currently open
 */
export function isRegistrationOpen(): boolean {
  const config = conferenceConfig.registration
  if (!config.enabled) return false
  
  if (!config.startDate || !config.endDate) return true
  
  const today = new Date()
  const start = new Date(config.startDate)
  const end = new Date(config.endDate)
  
  return today >= start && today <= end
}

/**
 * Check if abstract submission is currently open
 */
export function isAbstractSubmissionOpen(): boolean {
  const config = conferenceConfig.abstracts
  if (!config.enabled) return false
  
  if (!config.submissionWindow?.enabled) return true
  
  const today = new Date()
  const start = new Date(config.submissionWindow.start)
  const end = new Date(config.submissionWindow.end)
  
  return today >= start && today <= end
}

/**
 * Get admin email derived from contact email domain
 * Example: contact@isshmidtermcme2026.com -> admin@isshmidtermcme2026.com
 */
export function getAdminEmail(): string {
  const domain = conferenceConfig.contact.email.split('@')[1]
  return `admin@${domain}`
}

/**
 * Get registration ID prefix
 * Uses registrationPrefix if defined, otherwise derives from shortName
 * Example: "ISSH2026" or "ISSHMidtermCME2026" (from shortName with spaces removed)
 */
export function getRegistrationPrefix(): string {
  return conferenceConfig.registrationPrefix || conferenceConfig.shortName.replace(/\s+/g, '')
}

/**
 * Get email subject with conference name
 * Example: getEmailSubject("Registration Confirmation") -> "Registration Confirmation - ISSH Midterm CME 2026"
 */
export function getEmailSubject(type: string): string {
  return `${type} - ${conferenceConfig.shortName}`
}

/**
 * Get category label from key
 * Returns the label for a registration category, or the key itself if not found
 * Example: getCategoryLabel("issh-member") -> "ISSH Member"
 */
export function getCategoryLabel(key: string): string {
  const category = conferenceConfig.registration.categories.find(c => c.key === key)
  return category?.label || key
}

/**
 * Get all valid category keys
 * Returns an array of all registration category keys defined in config
 * Example: ["issh-member", "consultant", "postgraduate", "international", "complimentary"]
 */
export function getCategoryKeys(): string[] {
  return conferenceConfig.registration.categories.map(c => c.key)
}

/**
 * Check if a category key is valid
 * Returns true if the key exists in the registration categories
 */
export function isValidCategoryKey(key: string): boolean {
  return getCategoryKeys().includes(key)
}

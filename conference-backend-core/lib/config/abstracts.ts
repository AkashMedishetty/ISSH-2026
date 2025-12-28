export interface AbstractsSettings {
  // Tracks like Free Paper, Poster Presentation, E-Posters
  tracks: Array<{
    key: string
    label: string
    enabled: boolean
    categories?: Array<{
      key: string
      label: string
      enabled: boolean
      subcategories?: Array<{
        key: string
        label: string
        enabled: boolean
      }>
    }>
  }>

  // Topics and Subtopics for abstract categorization
  topics: Array<{
    id: string
    name: string
    description?: string
    subtopics: Array<{
      id: string
      name: string
    }>
  }>

  // Submission controls
  submissionWindow: {
    start: string // ISO date
    end: string   // ISO date
    enabled: boolean
  }

  // Guidelines
  guidelines: {
    general: string
    freePaper: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
    poster: {
      enabled: boolean
      title: string
      wordLimit: number
      requirements: string[]
      format: string
    }
  }

  maxAbstractsPerUser: number // admin configurable
  assignmentPolicy?: 'round-robin' | 'load-based'
  reviewersPerAbstractDefault?: number

  // File settings
  allowedInitialFileTypes: string[] // e.g., ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  allowedFinalFileTypes: string[] // e.g., ppt/pptx MIME types
  maxFileSizeMB: number // applies to both initial and final unless overridden
}

// MINIMAL FALLBACK - All configuration should be database-driven via admin panel
// This is only used when database config is not found (e.g., fresh installation)
export const defaultAbstractsSettings: AbstractsSettings = {
  tracks: [
    { key: 'free-paper', label: 'Free Paper', enabled: true },
    { key: 'poster', label: 'Poster Presentation', enabled: true }
  ],
  topics: [], // Configure in admin panel
  submissionWindow: {
    start: new Date().toISOString(),
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
    enabled: false // Disabled by default - enable in admin panel
  },
  guidelines: {
    general: 'Please configure submission guidelines in the admin panel.',
    freePaper: {
      enabled: true,
      title: 'Free Paper Presentation',
      wordLimit: 250,
      requirements: ['Please configure requirements in admin panel'],
      format: ''
    },
    poster: {
      enabled: true,
      title: 'Poster Presentation',
      wordLimit: 250,
      requirements: ['Please configure requirements in admin panel'],
      format: ''
    }
  },
  maxAbstractsPerUser: 3,
  assignmentPolicy: 'load-based',
  reviewersPerAbstractDefault: 2,
  allowedInitialFileTypes: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedFinalFileTypes: [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ],
  maxFileSizeMB: 10
}



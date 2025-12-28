"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Navigation } from "../../components/Navigation"
import { Calendar, FileText, Award, Upload, CheckCircle, Bell, Mail, X, Zap, Clock, Phone, AlertCircle, User, Lock, LogIn } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { conferenceConfig } from "../../config/conference.config"

export default function AbstractsPage() {
  const { data: session, status } = useSession()
  
  // Update page title
  useEffect(() => {
    document.title = `Abstract Submission | ${conferenceConfig.shortName}`
  }, [])

  // Fetch abstracts configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/abstracts/config')
        const data = await response.json()
        if (data.success) {
          setAbstractsConfig(data.data)
        }
      } catch (error) {
        console.error('Failed to load abstracts config:', error)
      } finally {
        setConfigLoading(false)
      }
    }
    fetchConfig()
  }, [])
  
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authData, setAuthData] = useState({ registrationId: "", password: "" })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useSessionAuth, setUseSessionAuth] = useState(true)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [abstractsConfig, setAbstractsConfig] = useState<any>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [reminderEmail, setReminderEmail] = useState("")
  const [reminderLoading, setReminderLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    authors: "",
    abstract: "",
    keywords: "",
    file: null as File | null
  })

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsAuthenticated(true)
        setShowSubmissionForm(true)
        toast.success("Authentication successful! You can now submit your abstract.")
      } else {
        toast.error(data.message || "Invalid registration ID or password")
      }
    } catch (error) {
      toast.error("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Please enter an abstract title')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a presentation category')
      return
    }
    
    if (!formData.authors.trim()) {
      toast.error('Please enter author names')
      return
    }
    
    if (!formData.file) {
      toast.error('Please upload an abstract file (.doc or .docx)')
      return
    }
    
    // Validate word count for abstract content if provided
    if (formData.abstract.trim()) {
      const wordCount = formData.abstract.trim().split(/\s+/).filter(word => word.length > 0).length
      const wordLimit = abstractsConfig?.guidelines?.freePaper?.wordLimit || 250
      if (wordCount > wordLimit) {
        toast.error(`Abstract content exceeds the maximum word limit of ${wordLimit} words (current: ${wordCount} words)`)
        return
      }
    }
    
    setIsLoading(true)
    
    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('track', formData.category)
      submitData.append('authors', formData.authors)
      submitData.append('abstract', formData.abstract)
      submitData.append('keywords', formData.keywords)
      
      // Use session-based auth if logged in, otherwise use registration ID
      if (session) {
        // Don't need to append registrationId for session-based auth
      } else {
        submitData.append('registrationId', authData.registrationId)
      }
      
      if (formData.file) {
        submitData.append('file', formData.file)
      }

      // Choose the appropriate endpoint based on auth method
      const endpoint = session ? '/api/abstracts/submit-auth' : '/api/abstracts/submit'
      const response = await fetch(endpoint, {
        method: 'POST',
        body: submitData
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSubmissionData(data.data)
        setIsSubmitted(true)
        toast.success("Abstract submitted successfully!")
      } else {
        toast.error(data.message || "Submission failed. Please try again.")
      }
    } catch (error) {
      toast.error("Submission failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | File) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['.doc', '.docx']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error("Please upload only Word documents (.doc or .docx)")
        return
      }
      
      setFormData((prev) => ({ ...prev, file }))
    }
  }

  const handleReminderSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reminderEmail.trim() || !reminderEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    
    setReminderLoading(true)
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: reminderEmail,
          type: 'abstract-reminder'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('Thank you! We\'ll notify you when abstract submissions open.')
        setReminderEmail('')
      } else {
        toast.error(data.message || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setReminderLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 lg:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Abstract Submitted Successfully!</h2>
          
          {submissionData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">Submission Details</h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p><strong>Abstract ID:</strong> {submissionData.abstractId}</p>
                <p><strong>Title:</strong> {submissionData.title}</p>
                <p><strong>Track:</strong> {submissionData.track}</p>
                <p><strong>Status:</strong> {submissionData.status}</p>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Your abstract has been submitted and will be reviewed by our scientific committee.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            📧 A confirmation email has been sent to your registered email address with your Abstract ID.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/abstracts" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-2" />
                View My Abstracts Dashboard
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => {
                setIsSubmitted(false)
                setShowSubmissionForm(false)
                setIsAuthenticated(false)
                setSubmissionData(null)
                setFormData({
                  title: "",
                  category: "",
                  authors: "",
                  abstract: "",
                  keywords: "",
                  file: null
                })
                setAuthData({ registrationId: "", password: "" })
              }} variant="outline" className="w-full sm:flex-1">
                Submit Another
              </Button>
              <Link href="/" className="w-full sm:flex-1">
                <Button variant="outline" className="w-full">
                  Go Home
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Check if submissions are disabled
  const submissionsDisabled = !configLoading && abstractsConfig && !abstractsConfig.submissionWindow?.enabled

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      <div className="pt-24 pb-12">
        {/* Header */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-green-600 to-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">Abstract Submission</h1>
              
              <div className="mb-6">
                <motion.div 
                  className={`inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-4 ${
                    submissionsDisabled ? 'bg-orange-500/30' : ''
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  {submissionsDisabled ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 text-white" />
                      <span className="text-white font-semibold">Coming Soon</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2 text-white" />
                      <span className="text-white font-semibold">Now Open</span>
                    </>
                  )}
                </motion.div>
                
              <p className="text-lg md:text-xl max-w-3xl mx-auto">
                  Submit your research abstracts for Free Paper Presentation and Poster Presentation
                  <br />
                  <span className="text-green-200">at {conferenceConfig.shortName}, {conferenceConfig.venue.city}</span>
                </p>
              </div>

              {submissionsDisabled ? (
                <div className="max-w-xl mx-auto">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardContent className="pt-6">
                      <Bell className="w-12 h-12 mx-auto mb-4 text-white" />
                      <h3 className="text-xl font-bold text-white mb-2">Get Notified When Submissions Open</h3>
                      <p className="text-green-100 mb-4">
                        Enter your email to receive a notification when abstract submissions are open
                      </p>
                      <form onSubmit={handleReminderSignup} className="flex flex-col sm:flex-row gap-3">
                        <Input
                          type="email"
                          placeholder="your.email@example.com"
                          value={reminderEmail}
                          onChange={(e) => setReminderEmail(e.target.value)}
                          className="flex-1 bg-white text-gray-900"
                          required
                        />
                        <Button 
                          type="submit" 
                          disabled={reminderLoading}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          {reminderLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Notify Me
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        if (session) {
                          // User is logged in, go directly to submission form
                          setIsAuthenticated(true)
                          setShowSubmissionForm(true)
                        } else {
                          // User not logged in, show auth options
                          setShowSubmissionForm(true)
                        }
                      }}
                      className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl font-bold"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Submit Your Abstract
                    </Button>
                  </motion.div>

                {session && (
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Link href="/dashboard/abstracts">
                      <Button 
                        variant="outline"
                        className="px-8 py-4 text-lg bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 rounded-full shadow-xl font-bold backdrop-blur-sm"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        View My Abstracts
                      </Button>
                    </Link>
                  </motion.div>
                )}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content Section - Guidelines when open, Why Submit when closed */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            {submissionsDisabled ? (
              // Coming Soon Content
              <div className="max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 via-green-600 to-blue-600 bg-clip-text text-transparent">
                    Why Submit Your Abstract?
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                    Join leading researchers and professionals at {conferenceConfig.shortName}
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <Award className="w-12 h-12 text-green-600 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Expert Review</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        All submissions are reviewed by our distinguished panel of experts in neurovascular sciences
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <FileText className="w-12 h-12 text-blue-600 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Publication Opportunity</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Selected abstracts will be published in conference proceedings and partner journals
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <User className="w-12 h-12 text-purple-600 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Networking</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Connect with peers, mentors, and leaders in the field of neurovascular medicine
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <Zap className="w-12 h-12 text-yellow-600 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Best Paper Awards</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Compete for recognition and awards for outstanding research presentations
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-slate-800">
                    <CardContent className="pt-6">
                      <CheckCircle className="w-12 h-12 text-teal-600 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Career Growth</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enhance your professional profile and gain visibility in the neurovascular community
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // Guidelines when open
              <>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-center mb-16"
                >
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 via-green-600 to-blue-600 bg-clip-text text-transparent">
                    Submission Guidelines
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                    Please read the guidelines carefully before submitting your abstract
                  </p>
                </motion.div>

            {/* General Guidelines */}
            {abstractsConfig?.guidelines?.general && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <p className="text-gray-700 dark:text-gray-300 text-center">
                      {abstractsConfig.guidelines.general}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Free Paper Guidelines */}
              {abstractsConfig?.guidelines?.freePaper?.enabled && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-all duration-300"></div>
                  <Card className="relative bg-white dark:bg-gray-800 border border-green-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl font-bold text-gray-800 dark:text-gray-100">
                        <FileText className="w-8 h-8 mr-3 text-green-600" />
                        {abstractsConfig?.guidelines?.freePaper?.title || 'Free Paper Presentation'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          Word Limit: {abstractsConfig?.guidelines?.freePaper?.wordLimit || 250} words
                        </p>
                      </div>
                      <div className="space-y-3 text-gray-600 dark:text-gray-300">
                        {abstractsConfig?.guidelines?.freePaper?.requirements?.map((req: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                      {abstractsConfig?.guidelines?.freePaper?.format && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Format:</strong> {abstractsConfig.guidelines.freePaper.format}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Poster Guidelines */}
              {abstractsConfig?.guidelines?.poster?.enabled && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-green-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-all duration-300"></div>
                  <Card className="relative bg-white dark:bg-gray-800 border border-blue-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl font-bold text-gray-800 dark:text-gray-100">
                        <Award className="w-8 h-8 mr-3 text-blue-600" />
                        {abstractsConfig?.guidelines?.poster?.title || 'Poster Presentation'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                          Word Limit: {abstractsConfig?.guidelines?.poster?.wordLimit || 250} words
                        </p>
                      </div>
                      <div className="space-y-3 text-gray-600 dark:text-gray-300">
                        {abstractsConfig?.guidelines?.poster?.requirements?.map((req: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                      {abstractsConfig?.guidelines?.poster?.format && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Format:</strong> {abstractsConfig.guidelines.poster.format}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-6 h-6 mr-3 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-2">Important Notice</h3>
                      <p className="text-orange-700 dark:text-orange-300">
                        The scientific committee reserves the right to accept/reject any paper without assigning any reason thereof. 
                        All submissions will be reviewed by our expert panel, and decisions will be communicated via email.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Access Section for Logged-in Users */}
            {session && !submissionsDisabled && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-12 max-w-4xl mx-auto"
              >
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-1 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          Welcome back, {session.user?.name}!
                        </h3>
                        <p className="text-green-700 dark:text-green-300">
                          Track your submitted abstracts, check review status, and manage your submissions.
                        </p>
                      </div>
                      <Link href="/dashboard/abstracts">
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <FileText className="w-4 h-4 mr-2" />
                          My Abstracts Dashboard
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
              </>
            )}
          </div>
        </section>

        {/* Submission Forms */}
        {showSubmissionForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 lg:p-8 relative my-4 sm:my-8 max-h-[95vh] overflow-y-auto"
            >
              <button
                onClick={() => {
                  setShowSubmissionForm(false)
                  setIsAuthenticated(false)
                  setAuthData({ registrationId: "", password: "" })
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>

              {!isAuthenticated ? (
                // Authentication Form
                <div>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      {session ? <FileText className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      {session ? 'Submit Abstract' : 'Authentication Required'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {session 
                        ? `Welcome ${session.user?.name}! You can submit your abstract directly.`
                        : 'Please login to your account or verify your registration to submit an abstract'
                      }
                    </p>
                  </div>

                  {session ? (
                    // User is logged in, show direct submission button
                    <div className="text-center">
                      <Button
                        onClick={() => setIsAuthenticated(true)}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Continue to Submission Form
                      </Button>
                    </div>
                  ) : (
                    // User not logged in, show auth options
                    <div className="space-y-6">
                      <div className="text-center">
                        <Link href="/auth/login">
                          <Button className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 mb-4">
                            <LogIn className="w-4 h-4 mr-2" />
                            Login to Your Account
                          </Button>
                        </Link>
                        <p className="text-sm text-gray-500 mb-4">or</p>
                        <Button
                          variant="outline"
                          onClick={() => setUseSessionAuth(false)}
                          className="px-6 py-2"
                        >
                          Verify with Registration ID
                        </Button>
                      </div>
                    </div>
                  )}

                  {!session && !useSessionAuth && (

                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
                        Manual Verification
                      </h4>
                      <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Registration ID
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter your registration ID"
                        value={authData.registrationId}
                        onChange={(e) => setAuthData(prev => ({ ...prev, registrationId: e.target.value }))}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={authData.password}
                        onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="w-full"
                      />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setUseSessionAuth(true)
                            setShowSubmissionForm(false)
                          }}
                          className="w-full sm:flex-1"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Verify & Continue
                            </>
                          )}
                        </Button>
                      </div>
                      </form>
                    </div>
                  )}
                </div>
              ) : (
                // Abstract Submission Form
                <div>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      Submit Abstract
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Fill in the details below to submit your abstract
                    </p>
                  </div>

                  <div className="bg-yellow-50 dark:bg-blue-900/20 border border-yellow-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Important: One Abstract Per Category</span>
                    </div>
                    <p className="text-xs text-conference-primary dark:text-blue-300 mt-1">
                      You can submit only one abstract per category. Choose your category carefully.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Abstract Title *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter a concise title (avoid abbreviations)"
                        value={formData.title}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow letters, numbers, spaces, and common punctuation
                          if (/^[a-zA-Z0-9\s.,;:'"()\-–—]*$/.test(value)) {
                            handleInputChange('title', value)
                          }
                        }}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Presentation Category *
                      </label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select presentation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {abstractsConfig?.tracks?.filter((track: any) => track.enabled).map((track: any) => (
                            <SelectItem key={track.key} value={track.key}>
                              {track.label}
                            </SelectItem>
                          )) || (
                            <>
                              <SelectItem value="Free Paper">Free Paper Presentation</SelectItem>
                              <SelectItem value="Poster">Poster Presentation</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Authors *
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter authors separated by commas (first author will be presenting author)"
                        value={formData.authors}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow letters, spaces, commas, periods, hyphens, and apostrophes for names
                          if (/^[a-zA-Z\s,.''-]*$/.test(value)) {
                            handleInputChange('authors', value)
                          }
                        }}
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Abstract Content (Max 150 words)
                      </label>
                      <Textarea
                        placeholder="Include Aim, Methods/Objectives/Methodology, and Conclusions. Do not include personal details, images, tables, or graphs."
                        value={formData.abstract}
                        onChange={(e) => {
                          const value = e.target.value
                          const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length
                          // Limit to 150 words
                          if (wordCount <= 150) {
                            handleInputChange('abstract', value)
                          } else {
                            toast.error('Abstract content cannot exceed 150 words')
                          }
                        }}
                        className="w-full min-h-[120px]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Word count: {formData.abstract.trim().split(/\s+/).filter(word => word.length > 0).length}/150 words
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Keywords
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter keywords separated by commas"
                        value={formData.keywords}
                        onChange={(e) => {
                          const value = e.target.value
                          // Allow letters, numbers, spaces, commas, and hyphens for keywords
                          if (/^[a-zA-Z0-9\s,\-]*$/.test(value)) {
                            handleInputChange('keywords', value)
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Abstract File * (.doc or .docx only)
                      </label>
                      <input
                        type="file"
                        accept=".doc,.docx"
                        onChange={handleFileChange}
                        required
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                      />
                      {formData.file && (
                        <p className="text-sm text-green-600 mt-2">
                          Selected: {formData.file.name}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAuthenticated(false)
                          setFormData({
                            title: "",
                            category: "",
                            authors: "",
                            abstract: "",
                            keywords: "",
                            file: null
                          })
                        }}
                        className="w-full sm:flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !formData.title || !formData.category || !formData.authors || !formData.abstract || !formData.file}
                        className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Submit Abstract
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

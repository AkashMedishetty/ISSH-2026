"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Input } from "../../components/ui/input"
import { 
  Calendar, Clock, MapPin, Users, Download, FileText, 
  Zap, Bell, Mail, CheckCircle, Radio, User, Award, BookOpen, Eye, Search, Filter, AlertCircle
} from "lucide-react"
import { toast } from "sonner"

// Helper function to generate ICS calendar file
const generateICS = (day: any) => {
  const sessions = day.sessions || []
  let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Conference Program//EN\n'
  
  sessions.forEach((session: any) => {
    const sessionDate = new Date(day.date)
    const [startHour, startMin] = session.startTime.split(':').map(Number)
    const [endHour, endMin] = session.endTime.split(':').map(Number)
    
    const startDateTime = new Date(sessionDate)
    startDateTime.setHours(startHour, startMin, 0)
    
    const endDateTime = new Date(sessionDate)
    endDateTime.setHours(endHour, endMin, 0)
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }
    
    const speakers = session.speakers?.map((s: any) => s.name).join(', ') || ''
    
    icsContent += 'BEGIN:VEVENT\n'
    icsContent += `DTSTART:${formatDate(startDateTime)}\n`
    icsContent += `DTEND:${formatDate(endDateTime)}\n`
    icsContent += `SUMMARY:${session.title}\n`
    icsContent += `DESCRIPTION:${session.description || ''} ${speakers ? '\\nSpeakers: ' + speakers : ''}\n`
    icsContent += `LOCATION:${session.venue}\n`
    icsContent += 'END:VEVENT\n'
  })
  
  icsContent += 'END:VCALENDAR'
  return icsContent
}

// Helper function to download ICS file
const downloadICS = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

interface Speaker {
  name: string
  designation?: string
  organization?: string
  photo?: string
}

interface Session {
  id: string
  title: string
  description?: string
  speakers: Speaker[]
  startTime: string
  endTime: string
  venue: string
  type: string
  tags?: string[]
  isBreak?: boolean
}

interface DayProgram {
  id: string
  date: string
  title: string
  description?: string
  sessions: Session[]
}

export default function ProgramPage() {
  const [programConfig, setProgramConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)
  const [reminderEmail, setReminderEmail] = useState("")
  const [reminderLoading, setReminderLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  useEffect(() => {
    document.title = `Program | ${conferenceConfig.shortName}`
    fetchProgramConfig()
  }, [])

  const fetchProgramConfig = async () => {
    try {
      const response = await fetch('/api/program/config')
      const data = await response.json()
      if (data.success) {
        setProgramConfig(data.data)
        // Set selected day to current day if live
        if (data.data.currentDay) {
          const currentDayIndex = data.data.program.days.findIndex(
            (day: DayProgram) => day.id === data.data.currentDay.id
          )
          if (currentDayIndex !== -1) {
            setSelectedDay(currentDayIndex)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load program:', error)
    } finally {
      setLoading(false)
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
          type: 'program-reminder'
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Thank you! We\'ll notify you when the program is available.')
        setReminderEmail('')
      } else {
        toast.error(data.message || 'Failed to subscribe')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setReminderLoading(false)
    }
  }

  const getSessionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      keynote: 'bg-purple-100 dark:bg-purple-900/30 border-l-purple-500 text-purple-900 dark:text-purple-100',
      panel: 'bg-pink-100 dark:bg-pink-900/30 border-l-pink-500 text-pink-900 dark:text-pink-100',
      workshop: 'bg-green-100 dark:bg-green-900/30 border-l-green-500 text-green-900 dark:text-green-100',
      'paper-presentation': 'bg-blue-100 dark:bg-blue-900/30 border-l-blue-500 text-blue-900 dark:text-blue-100',
      poster: 'bg-yellow-100 dark:bg-yellow-900/30 border-l-yellow-500 text-yellow-900 dark:text-yellow-100',
      break: 'bg-gray-100 dark:bg-gray-800 border-l-gray-400 text-gray-700 dark:text-gray-300',
      networking: 'bg-indigo-100 dark:bg-indigo-900/30 border-l-indigo-500 text-indigo-900 dark:text-indigo-100',
      other: 'bg-slate-100 dark:bg-slate-800 border-l-slate-400 text-slate-700 dark:text-slate-300'
    }
    return colors[type] || colors.other
  }

  const getSessionTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      keynote: 'Keynote',
      panel: 'Panel',
      workshop: 'Workshop',
      'paper-presentation': 'Paper Presentation',
      poster: 'Poster Session',
      break: 'Break',
      networking: 'Networking',
      other: 'Session'
    }
    return labels[type] || 'Session'
  }

  const isCurrentSession = (session: Session) => {
    return programConfig?.currentSession?.id === session.id
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Coming Soon Page - PROFESSIONAL like Abstracts Page
  if (!programConfig || !programConfig.isEnabled) {
    const primary = conferenceConfig.theme.primary
    const accent = conferenceConfig.theme.accent
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <div className="mb-6">
                <motion.div 
                  className="inline-flex items-center px-6 py-3 bg-orange-500/30 backdrop-blur-sm rounded-full mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Clock className="w-5 h-5 mr-2 text-white" />
                  <span className="text-white font-semibold">Coming Soon</span>
                </motion.div>
                
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  Conference Program
                </motion.h1>
                
                <motion.p 
                  className="text-xl md:text-2xl text-green-100 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  We're preparing an exceptional program for {conferenceConfig.shortName}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="max-w-xl mx-auto"
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="pt-6">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-white" />
                    <h3 className="text-xl font-bold text-white mb-2">Get Notified</h3>
                    <p className="text-green-100 mb-4">
                      Enter your email to receive the program as soon as it's released
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
              </motion.div>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 via-green-600 to-blue-600 bg-clip-text text-transparent">
                  What to Expect
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                  Get ready for an exciting lineup of sessions, workshops, and networking opportunities
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    icon: Users,
                    title: 'Expert Speakers',
                    description: 'Leading professionals and thought leaders from around the world sharing their insights',
                    color: 'green'
                  },
                  {
                    icon: BookOpen,
                    title: 'Keynote Sessions',
                    description: 'Inspiring presentations on cutting-edge research and latest developments',
                    color: 'blue'
                  },
                  {
                    icon: Zap,
                    title: 'Interactive Workshops',
                    description: 'Hands-on sessions to enhance your skills and knowledge',
                    color: 'purple'
                  },
                  {
                    icon: FileText,
                    title: 'Paper Presentations',
                    description: 'Research presentations showcasing innovative work in the field',
                    color: 'teal'
                  },
                  {
                    icon: Award,
                    title: 'Panel Discussions',
                    description: 'Expert panels addressing key challenges and opportunities',
                    color: 'yellow'
                  },
                  {
                    icon: CheckCircle,
                    title: 'Networking Events',
                    description: 'Connect with peers, collaborators, and industry leaders',
                    color: 'indigo'
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="h-full bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
                      <CardContent className="pt-6">
                        <feature.icon className={`w-12 h-12 text-${feature.color}-600 mb-4`} />
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Conference Details */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Calendar className="w-6 h-6 mr-2" style={{ color: primary }} />
                        Event Details
                      </h3>
                      <div className="space-y-3 text-gray-600 dark:text-gray-400">
                        <p><strong className="text-gray-900 dark:text-white">Conference:</strong> {conferenceConfig.name}</p>
                        <p><strong className="text-gray-900 dark:text-white">Dates:</strong> {new Date(conferenceConfig.eventDate.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(conferenceConfig.eventDate.end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p><strong className="text-gray-900 dark:text-white">Location:</strong> {conferenceConfig.venue.city}, {conferenceConfig.venue.state}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                        <AlertCircle className="w-6 h-6 mr-2" style={{ color: accent }} />
                        Stay Updated
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The detailed program schedule will be published soon. Sign up above to receive instant notifications.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          Multi-day Event
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          CME Credits
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
                          Certificate
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Brochure Only Mode - PROFESSIONAL DESIGN
  if (programConfig.mode === 'brochure-only') {
    const primary = conferenceConfig.theme.primary
    const accent = conferenceConfig.theme.accent
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <FileText className="w-16 h-16 mx-auto mb-6 text-white" />
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  {programConfig.brochure.title || 'Conference Program'}
                </h1>
                {programConfig.brochure.description && (
                  <p className="text-xl md:text-2xl text-green-100 mb-8">
                    {programConfig.brochure.description}
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card className="border-2 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Download className="w-20 h-20 mx-auto mb-6 text-green-600" />
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                      Download Conference Program
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                      Get the complete program brochure with detailed schedule, speaker information, and session descriptions
                    </p>
                    {programConfig.brochure.fileUrl ? (
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button 
                          size="lg"
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
                          onClick={() => window.open(programConfig.brochure.fileUrl, '_blank')}
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download PDF
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-2"
                          onClick={() => window.open(programConfig.brochure.fileUrl, '_blank')}
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Preview
                        </Button>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">Brochure will be available soon</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
                What's Inside
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Calendar, title: 'Complete Schedule', desc: 'Day-by-day program with all sessions and timings' },
                  { icon: Users, title: 'Speaker Profiles', desc: 'Detailed information about all presenters' },
                  { icon: MapPin, title: 'Venue Information', desc: 'Maps and directions to all conference venues' }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full bg-white dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
                      <CardContent className="pt-6">
                        <feature.icon className="w-12 h-12 text-green-600 mb-4" />
                        <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {feature.desc}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Full Program Mode
  const primary = conferenceConfig.theme.primary
  const accent = conferenceConfig.theme.accent
  
  // Safety check for days
  if (!programConfig.program.days || programConfig.program.days.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-600 dark:text-gray-400">No program days configured yet</p>
          </Card>
        </div>
      </div>
    )
  }

  const currentDay = programConfig.program.days[selectedDay]

  // Filter sessions based on search and type
  const filteredSessions = currentDay.sessions.filter((session: Session) => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.speakers.some((s: Speaker) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === "all" || session.type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      {/* Hero Section - Consistent Design */}
      <section className="relative py-20 md:py-32 bg-gradient-to-r from-green-600 to-blue-600 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {programConfig.isLive && programConfig.settings.showLiveIndicator && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center px-6 py-3 bg-red-500/30 backdrop-blur-sm rounded-full mb-4"
                >
                  <Radio className="w-5 h-5 mr-2 text-white animate-pulse" />
                  <span className="text-white font-semibold">LIVE NOW</span>
                </motion.div>
              )}
              
              <Calendar className="w-16 h-16 mx-auto mb-6 text-white" />
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {programConfig.program.title || 'Conference Program'}
              </h1>
              {programConfig.program.description && (
                <p className="text-xl md:text-2xl text-green-100 mb-8">
                  {programConfig.program.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Day Selector */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {programConfig.program.days.map((day: DayProgram, index: number) => (
                <Button
                  key={day.id}
                  onClick={() => setSelectedDay(index)}
                  variant={selectedDay === index ? "default" : "outline"}
                  className={`${
                    selectedDay === index
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border-2 hover:border-blue-600'
                  } transition-all`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-bold">{day.title}</div>
                    <div className="text-xs opacity-90">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
      </section>

      {/* Program Schedule */}
      <section className="py-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDay}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Day Info */}
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{currentDay.title}</CardTitle>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                          {new Date(currentDay.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      {programConfig.settings.allowDownload && (
                        <Button variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {/* Search & Filter Bar */}
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Search */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search sessions, speakers, topics..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-11 bg-white dark:bg-slate-950 border-2"
                        />
                      </div>

                      {/* Filter by Type */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={filterType === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("all")}
                          className={filterType === "all" ? "bg-blue-600" : ""}
                        >
                          All Sessions
                        </Button>
                        <Button
                          variant={filterType === "keynote" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("keynote")}
                          className={filterType === "keynote" ? "bg-purple-600" : ""}
                        >
                          Keynotes
                        </Button>
                        <Button
                          variant={filterType === "workshop" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("workshop")}
                          className={filterType === "workshop" ? "bg-green-600" : ""}
                        >
                          Workshops
                        </Button>
                        <Button
                          variant={filterType === "panel" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType("panel")}
                          className={filterType === "panel" ? "bg-pink-600" : ""}
                        >
                          Panels
                        </Button>
                      </div>

                      {/* Export to Calendar */}
                      <Button
                        variant="outline"
                        className="whitespace-nowrap border-2"
                        onClick={() => {
                          const icsContent = generateICS(currentDay)
                          downloadICS(icsContent, `${conferenceConfig.shortName}-${currentDay.title}.ics`)
                          toast.success('Calendar file downloaded!')
                        }}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Export Day
                      </Button>
                    </div>

                    {/* Results count */}
                    {(searchQuery || filterType !== "all") && (
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredSessions.length} of {currentDay.sessions.length} sessions
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sessions */}
                <div className="space-y-4">
                  {filteredSessions.length === 0 ? (
                    <Card className="p-12 text-center">
                      <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">No sessions found</h3>
                      <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter</p>
                    </Card>
                  ) : (
                    filteredSessions.map((session: Session, index: number) => {
                    const isCurrent = isCurrentSession(session)
                    const isHighlighted = isCurrent && programConfig.settings.highlightCurrentSession

                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`${
                          isHighlighted 
                            ? 'ring-4 ring-blue-500 shadow-2xl' 
                            : 'hover:shadow-lg'
                        } transition-all duration-300 ${
                          session.isBreak ? 'opacity-75' : ''
                        }`}>
                          <CardContent className="p-6">
                            <div className={`border-l-4 ${getSessionTypeColor(session.type)} pl-6 -ml-6 -mt-6 -mb-6 pt-6 pb-6`}>
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-1">
                                  {/* Time & Live Indicator */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center text-sm font-semibold">
                                      <Clock className="w-4 h-4 mr-2" />
                                      {session.startTime} - {session.endTime}
                                    </div>
                                    {isCurrent && (
                                      <Badge className="bg-red-500 text-white animate-pulse">
                                        <Radio className="w-3 h-3 mr-1" />
                                        LIVE
                                      </Badge>
                                    )}
                                    <Badge variant="outline">
                                      {getSessionTypeBadge(session.type)}
                                    </Badge>
                                  </div>

                                  {/* Title */}
                                  <h3 className="text-xl font-bold mb-2">
                                    {session.title}
                                  </h3>

                                  {/* Description */}
                                  {session.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      {session.description}
                                    </p>
                                  )}

                                  {/* Speakers */}
                                  {session.speakers && session.speakers.length > 0 && (
                                    <div className="space-y-2 mb-3">
                                      {session.speakers.map((speaker, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                          {programConfig.settings.showSpeakerPhotos && speaker.photo ? (
                                            <img 
                                              src={speaker.photo} 
                                              alt={speaker.name}
                                              className="w-10 h-10 rounded-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                          )}
                                          <div>
                                            <p className="font-semibold text-sm">{speaker.name}</p>
                                            {speaker.designation && (
                                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {speaker.designation}
                                                {speaker.organization && `, ${speaker.organization}`}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Venue */}
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {session.venue}
                                  </div>

                                  {/* Tags */}
                                  {session.tags && session.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {session.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
      </section>

      {/* Venues Section */}
      {programConfig.program.venues && programConfig.program.venues.length > 0 && (
          <section className="py-12 bg-slate-50 dark:bg-slate-900">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-bold mb-8 text-center">Venues</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programConfig.program.venues.map((venue: any) => (
                  <Card key={venue.id}>
                    <CardContent className="pt-6">
                      <MapPin className="w-8 h-8 text-blue-600 mb-3" />
                      <h3 className="font-bold text-lg mb-1">{venue.name}</h3>
                      {venue.floor && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {venue.floor}
                        </p>
                      )}
                      {venue.capacity && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Capacity: {venue.capacity}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { AbstractDetailsModal } from '../abstracts/AbstractDetailsModal'
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Upload,
  User,
  Calendar,
  Award,
  Mail,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface Abstract {
  _id: string
  abstractId: string
  title: string
  track: string
  authors: string[]
  status: 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'final-submitted'
  submittedAt: string
  wordCount?: number
  averageScore?: number
  decisionAt?: string
  userId: {
    _id: string
    firstName: string
    lastName: string
    email: string
    registration: {
      registrationId: string
    }
  }
  initial: {
    file?: {
      originalName: string
      uploadedAt: string
    }
    notes?: string
  }
  final?: {
    file?: {
      originalName: string
      uploadedAt: string
    }
    submittedAt?: string
  }
}

export function AbstractsSubmissionsManager() {
  const [abstracts, setAbstracts] = useState<Abstract[]>([])
  const [filteredAbstracts, setFilteredAbstracts] = useState<Abstract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [selectedAbstract, setSelectedAbstract] = useState<Abstract | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    underReview: 0,
    accepted: 0,
    rejected: 0,
    finalSubmitted: 0
  })

  useEffect(() => {
    fetchAbstracts()
  }, [])

  useEffect(() => {
    filterAbstracts()
  }, [abstracts, searchTerm, statusFilter, trackFilter])

  const fetchAbstracts = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/list')
      const data = await response.json()
      
      if (data.success) {
        setAbstracts(data.data)
        calculateStats(data.data)
      } else {
        toast.error('Failed to fetch abstracts')
      }
    } catch (error) {
      toast.error('Error fetching abstracts')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (abstractsData: Abstract[]) => {
    const stats = {
      total: abstractsData.length,
      submitted: abstractsData.filter(a => a.status === 'submitted').length,
      underReview: abstractsData.filter(a => a.status === 'under-review').length,
      accepted: abstractsData.filter(a => a.status === 'accepted').length,
      rejected: abstractsData.filter(a => a.status === 'rejected').length,
      finalSubmitted: abstractsData.filter(a => a.status === 'final-submitted').length
    }
    setStats(stats)
  }

  const filterAbstracts = () => {
    let filtered = abstracts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(abstract =>
        abstract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.abstractId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
        abstract.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abstract.userId.registration.registrationId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.status === statusFilter)
    }

    // Track filter
    if (trackFilter !== 'all') {
      filtered = filtered.filter(abstract => abstract.track === trackFilter)
    }

    setFilteredAbstracts(filtered)
  }

  const updateAbstractStatus = async (abstractId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/abstracts/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abstractId,
          status: newStatus
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`Abstract status updated to ${newStatus}`)
        fetchAbstracts() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Error updating abstract status')
    }
  }

  const exportAbstracts = async () => {
    try {
      const response = await fetch('/api/admin/abstracts/export')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `abstracts-export-${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Abstracts exported successfully')
      } else {
        toast.error('Failed to export abstracts')
      }
    } catch (error) {
      toast.error('Error exporting abstracts')
    }
  }

  const downloadFile = async (abstractId: string, fileType: 'initial' | 'final') => {
    setDownloading(`${abstractId}-${fileType}`)
    try {
      const response = await fetch(`/api/abstracts/download/${abstractId}?type=${fileType}`)
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Download failed')
        return
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `abstract-${fileType}.pdf`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed')
    } finally {
      setDownloading(null)
    }
  }

  const viewDetails = (abstract: Abstract) => {
    setSelectedAbstract(abstract)
    setIsDetailsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { color: 'bg-theme-primary-100 text-blue-800', icon: Clock, label: 'Submitted' },
      'under-review': { color: 'bg-yellow-100 text-yellow-800', icon: Eye, label: 'Under Review' },
      'accepted': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      'final-submitted': { color: 'bg-purple-100 text-purple-800', icon: Award, label: 'Final Submitted' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const uniqueTracks = [...new Set(abstracts.map(a => a.track))]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-primary-600">Submitted</p>
                <p className="text-2xl font-bold text-blue-900">{stats.submitted}</p>
              </div>
              <Clock className="w-8 h-8 text-theme-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Under Review</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.underReview}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Accepted</p>
                <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-accent-600">Final</p>
                <p className="text-2xl font-bold text-purple-900">{stats.finalSubmitted}</p>
              </div>
              <Award className="w-8 h-8 text-theme-accent-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-lg sm:text-xl">Abstract Submissions Management</span>
            <Button onClick={exportAbstracts} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              <span className="sm:hidden">Export</span>
              <span className="hidden sm:inline">Export All</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title, abstract ID, author, email, or registration ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="final-submitted">Final Submitted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {uniqueTracks.map(track => (
                    <SelectItem key={track} value={track}>{track}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Abstracts List */}
          <div className="space-y-4">
            {filteredAbstracts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Abstracts Found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || trackFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No abstracts have been submitted yet'
                  }
                </p>
              </div>
            ) : (
              filteredAbstracts.map((abstract, index) => (
                <motion.div
                  key={abstract._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="mb-4">
                        <div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 break-words">
                            {abstract.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <Badge variant="outline" className="text-xs sm:text-sm">{abstract.track}</Badge>
                            {getStatusBadge(abstract.status)}
                            <span className="text-xs sm:text-sm text-gray-500">ID: {abstract.abstractId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span><strong>Submitter:</strong> {abstract.userId.firstName} {abstract.userId.lastName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span><strong>Email:</strong> {abstract.userId.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span><strong>Reg ID:</strong> {abstract.userId.registration.registrationId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span><strong>Authors:</strong> {abstract.authors.join(', ')}</span>
                        </div>
                        {abstract.wordCount && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span><strong>Words:</strong> {abstract.wordCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Files */}
                      <div className="space-y-2">
                        {abstract.initial.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-theme-primary-600" />
                            <span className="text-gray-600">
                              <strong>Initial File:</strong> {abstract.initial.file.originalName}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloading === `${abstract._id}-initial`}
                              onClick={() => downloadFile(abstract._id, 'initial')}
                            >
                              {downloading === `${abstract._id}-initial` ? (
                                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                        {abstract.final?.file && (
                          <div className="flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4 text-green-600" />
                            <span className="text-gray-600">
                              <strong>Final File:</strong> {abstract.final.file.originalName}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloading === `${abstract._id}-final`}
                              onClick={() => downloadFile(abstract._id, 'final')}
                            >
                              {downloading === `${abstract._id}-final` ? (
                                <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Download className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-2 w-full lg:min-w-[200px]">
                      <Select
                        value={abstract.status}
                        onValueChange={(value) => updateAbstractStatus(abstract._id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="under-review">Under Review</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="final-submitted">Final Submitted</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => viewDetails(abstract)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <AbstractDetailsModal
        abstract={selectedAbstract}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedAbstract(null)
        }}
        showAdminDetails={true}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/conference-backend-core/components/ui/card'
import { Button } from '@/conference-backend-core/components/ui/button'
import { Badge } from '@/conference-backend-core/components/ui/badge'
import { Textarea } from '@/conference-backend-core/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/conference-backend-core/components/ui/select'
import { Input } from '@/conference-backend-core/components/ui/input'
import { AbstractDetailsModal } from '@/conference-backend-core/components/abstracts/AbstractDetailsModal'
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Award,
  Download,
  Search,
  Filter,
  Upload,
  User,
  Calendar,
  Mail,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface AbstractForReview {
  _id: string
  abstractId: string
  title: string
  track: string
  authors: string[]
  status: string
  submittedAt: string
  wordCount?: number
  keywords?: string[]
  averageScore?: number
  userId: {
    _id: string
    firstName?: string
    lastName?: string
    email: string
    registration?: {
      registrationId: string
    }
    profile?: {
      firstName?: string
      lastName?: string
      phone?: string
      institution?: string
      designation?: string
    }
  }
  initial: {
    notes?: string
    file?: {
      originalName: string
      mimeType: string
      fileSizeBytes: number
      storagePath: string
      uploadedAt: string
    }
  }
  final?: {
    file?: {
      originalName: string
      mimeType: string
      fileSizeBytes: number
      storagePath: string
      uploadedAt: string
    }
    submittedAt?: string
    displayId?: string
  }
  existingReview?: {
    decision: string
    comments: string
    reviewedAt: string
  }
}

export function ReviewerDashboard() {
  const [abstracts, setAbstracts] = useState<AbstractForReview[]>([])
  const [filteredAbstracts, setFilteredAbstracts] = useState<AbstractForReview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [trackFilter, setTrackFilter] = useState<string>('all')
  const [reviewingAbstract, setReviewingAbstract] = useState<string | null>(null)
  const [selectedAbstract, setSelectedAbstract] = useState<AbstractForReview | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState({
    decision: '',
    comments: ''
  })
  const [stats, setStats] = useState({
    assigned: 0,
    reviewed: 0,
    pending: 0
  })

  useEffect(() => {
    fetchAssignedAbstracts()
  }, [])

  useEffect(() => {
    filterAbstracts()
  }, [abstracts, searchTerm, statusFilter, trackFilter])

  const fetchAssignedAbstracts = async () => {
    try {
      const response = await fetch('/api/reviewer/abstracts')
      const data = await response.json()
      
      if (data.success) {
        setAbstracts(data.data)
        calculateStats(data.data)
      } else {
        toast.error('Failed to fetch assigned abstracts')
      }
    } catch (error) {
      toast.error('Error fetching abstracts')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (abstractsData: AbstractForReview[]) => {
    const stats = {
      assigned: abstractsData.length,
      reviewed: abstractsData.filter(a => a.existingReview).length,
      pending: abstractsData.filter(a => !a.existingReview).length
    }
    setStats(stats)
  }

  const filterAbstracts = () => {
    let filtered = abstracts

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(abstract =>
        abstract.title.toLowerCase().includes(search) ||
        abstract.abstractId.toLowerCase().includes(search) ||
        abstract.authors.some(author => author.toLowerCase().includes(search)) ||
        abstract.userId.email.toLowerCase().includes(search) ||
        abstract.userId.registration?.registrationId.toLowerCase().includes(search)
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
        // Update local state
        setAbstracts(prev => prev.map(abstract => 
          abstract._id === abstractId 
            ? { ...abstract, status: newStatus }
            : abstract
        ))
        toast.success('Status updated successfully')
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Error updating status')
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

  const viewDetails = (abstract: AbstractForReview) => {
    setSelectedAbstract(abstract)
    setIsDetailsModalOpen(true)
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

  const submitReview = async (abstractId: string) => {
    if (!reviewData.decision) {
      toast.error('Please select a decision (Accept or Reject)')
      return
    }

    try {
      const response = await fetch('/api/reviewer/abstracts/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abstractId,
          decision: reviewData.decision,
          comments: reviewData.comments
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Review submitted successfully')
        setReviewingAbstract(null)
        setReviewData({ decision: '', comments: '' })
        fetchAssignedAbstracts() // Refresh the list
      } else {
        toast.error(data.message || 'Failed to submit review')
      }
    } catch (error) {
      toast.error('Error submitting review')
    }
  }

  const getDecisionColor = (decision: string) => {
    if (decision === 'accept') return 'text-green-600'
    return 'text-red-600'
  }

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Assigned</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.assigned}</p>
                </div>
                <FileText className="w-8 h-8 text-theme-primary-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Reviewed</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.reviewed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-midnight-600 dark:text-midnight-400">Pending</p>
                  <p className="text-2xl font-bold text-midnight-800 dark:text-midnight-100">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-lg font-semibold">Assigned Abstracts</span>
            <Button 
              onClick={exportAbstracts} 
              className="bg-emerald-600 hover:bg-emerald-700 text-sm w-full sm:w-auto"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search abstracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="final-submitted">Final Submitted</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  <SelectItem value="Free Paper">Free Paper</SelectItem>
                  <SelectItem value="Poster Presentation">Poster Presentation</SelectItem>
                  <SelectItem value="E-Poster">E-Poster</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredAbstracts.length === 0 ? (
            <div className="text-center py-8 text-midnight-600 dark:text-midnight-400">
              {abstracts.length === 0 ? 'No abstracts assigned for review yet.' : 'No abstracts match your search criteria.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAbstracts.map((abstract, index) => (
                <motion.div
                  key={abstract._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-midnight-200 dark:border-midnight-700 rounded-lg p-4"
                >
                  <div className="flex flex-col space-y-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="space-y-2 mb-4">
                        <h3 className="font-semibold text-midnight-800 dark:text-midnight-100 text-sm sm:text-base leading-tight">
                          {abstract.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {abstract.track}
                          </Badge>
                          <Badge className={`text-xs ${
                            abstract.status === 'submitted' ? 'bg-theme-primary-100 text-blue-800' :
                            abstract.status === 'under-review' ? 'bg-yellow-100 text-yellow-800' :
                            abstract.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            abstract.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {abstract.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                          {abstract.existingReview && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reviewed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-midnight-600 dark:text-midnight-400 mb-4">
                        <div><strong>ID:</strong> {abstract.abstractId}</div>
                        <div><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</div>
                        <div><strong>Authors:</strong> {abstract.authors.join(', ')}</div>
                        {abstract.wordCount && <div><strong>Words:</strong> {abstract.wordCount}</div>}
                        {abstract.userId && (
                          <div><strong>Submitter:</strong> {abstract.userId.profile?.firstName || abstract.userId.firstName || 'N/A'} {abstract.userId.profile?.lastName || abstract.userId.lastName || ''}</div>
                        )}
                        {abstract.userId?.email && (
                          <div><strong>Email:</strong> {abstract.userId.email}</div>
                        )}
                      </div>

                      {/* Files */}
                      <div className="space-y-2 mb-4">
                        {abstract.initial?.file && (
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

                      {/* Review Status */}
                      {abstract.existingReview && (
                        <div className="bg-theme-primary-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-theme-primary-500" />
                            <span className={`font-semibold ${getDecisionColor(abstract.existingReview.decision || 'reject')}`}>
                              Decision: {abstract.existingReview.decision === 'accept' ? 'ACCEPTED' : 'REJECTED'}
                            </span>
                            <span className="text-xs text-midnight-500">
                              Reviewed on {new Date(abstract.existingReview.reviewedAt).toLocaleDateString()}
                            </span>
                          </div>
                          {abstract.existingReview.comments && (
                            <p className="text-sm text-midnight-600 dark:text-midnight-400">
                              <strong>Comments:</strong> {abstract.existingReview.comments}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                          value={abstract.status}
                          onValueChange={(value) => updateAbstractStatus(abstract._id, value)}
                        >
                          <SelectTrigger className="text-sm">
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
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>

                      {!abstract.existingReview ? (
                        reviewingAbstract === abstract._id ? (
                          <div className="space-y-3 w-full">
                            <div>
                              <label className="block text-sm font-medium text-midnight-700 dark:text-midnight-300 mb-2">
                                Decision
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant={reviewData.decision === 'accept' ? 'default' : 'outline'}
                                  onClick={() => setReviewData(prev => ({ ...prev, decision: 'accept' }))}
                                  className={`w-full ${reviewData.decision === 'accept' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant={reviewData.decision === 'reject' ? 'default' : 'outline'}
                                  onClick={() => setReviewData(prev => ({ ...prev, decision: 'reject' }))}
                                  className={`w-full ${reviewData.decision === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-midnight-700 dark:text-midnight-300 mb-1">
                                Comments <span className="text-gray-400 text-xs">(Optional)</span>
                              </label>
                              <Textarea
                                placeholder="Add optional feedback or comments..."
                                value={reviewData.comments}
                                onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                                className="min-h-[80px] text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                onClick={() => submitReview(abstract._id)}
                                className="bg-theme-primary-600 hover:bg-theme-primary-700 w-full"
                                disabled={!reviewData.decision}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Submit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReviewingAbstract(null)
                                  setReviewData({ decision: '', comments: '' })
                                }}
                                className="w-full"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setReviewingAbstract(abstract._id)}
                            className="bg-emerald-600 hover:bg-emerald-700 w-full"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 w-full"
                          disabled
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Reviewed
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
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

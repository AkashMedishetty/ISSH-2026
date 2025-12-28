"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { 
  FileText, 
  Download, 
  User, 
  Calendar, 
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface AbstractDetailsModalProps {
  abstract: any
  isOpen: boolean
  onClose: () => void
  showAdminDetails?: boolean
}

export function AbstractDetailsModal({ 
  abstract, 
  isOpen, 
  onClose, 
  showAdminDetails = false 
}: AbstractDetailsModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': { color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200', icon: Clock, label: 'Submitted' },
      'under-review': { color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200', icon: Eye, label: 'Under Review' },
      'accepted': { color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200', icon: CheckCircle, label: 'Accepted' },
      'rejected': { color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200', icon: XCircle, label: 'Rejected' },
      'final-submitted': { color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200', icon: Award, label: 'Final Submitted' }
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

  const downloadFile = async (fileType: 'initial' | 'final') => {
    if (!abstract._id) return
    
    setDownloading(fileType)
    try {
      const response = await fetch(`/api/abstracts/download/${abstract._id}?type=${fileType}`)
      
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || 'Download failed')
        return
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `${abstract.abstractId}-${fileType}.pdf`
      
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

  if (!abstract) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                {abstract.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {abstract.track}
                </Badge>
                {getStatusBadge(abstract.status)}
                <span className="text-xs sm:text-sm text-gray-500">
                  ID: {abstract.abstractId}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                Abstract Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span><strong>Authors:</strong> {abstract.authors?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span><strong>Submitted:</strong> {new Date(abstract.submittedAt).toLocaleDateString()}</span>
                </div>
                {abstract.wordCount && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span><strong>Word Count:</strong> {abstract.wordCount}</span>
                  </div>
                )}
                {abstract.averageScore && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span><strong>Review Score:</strong> {abstract.averageScore.toFixed(1)}/10</span>
                  </div>
                )}
              </div>

              {abstract.keywords && abstract.keywords.length > 0 && (
                <div>
                  <strong className="text-sm text-gray-700">Keywords:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {abstract.keywords.map((keyword: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Abstract Content */}
          {abstract.initial?.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Abstract Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {abstract.initial.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitter Information (Admin View) */}
          {showAdminDetails && abstract.userId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-green-600" />
                  Submitter Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span><strong>Name:</strong> {abstract.userId.firstName} {abstract.userId.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span><strong>Email:</strong> {abstract.userId.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span><strong>Registration ID:</strong> {abstract.userId.registration?.registrationId}</span>
                  </div>
                  {abstract.userId.profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span><strong>Phone:</strong> {abstract.userId.profile.phone}</span>
                    </div>
                  )}
                  {abstract.userId.profile?.institution && (
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span><strong>Institution:</strong> {abstract.userId.profile.institution}</span>
                    </div>
                  )}
                  {abstract.userId.profile?.designation && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span><strong>Designation:</strong> {abstract.userId.profile.designation}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Download className="w-5 h-5 text-blue-600" />
                Submitted Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Initial File */}
              {abstract.initial?.file && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Initial Submission</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{abstract.initial.file.originalName}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        Uploaded: {new Date(abstract.initial.file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadFile('initial')}
                    disabled={downloading === 'initial'}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    {downloading === 'initial' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Final File */}
              {abstract.final?.file && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <FileText className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Final Submission</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{abstract.final.file.originalName}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Uploaded: {new Date(abstract.final.file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => downloadFile('final')}
                    disabled={downloading === 'final'}
                    className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                  >
                    {downloading === 'final' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!abstract.initial?.file && !abstract.final?.file && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No files available for download</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Messages */}
          {abstract.status === 'rejected' && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Abstract Rejected</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Your abstract was not accepted for presentation. You can submit a new abstract if needed.
                </p>
              </CardContent>
            </Card>
          )}

          {abstract.status === 'accepted' && !abstract.final?.submittedAt && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Abstract Accepted!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Congratulations! Your abstract has been accepted. You can now submit your final presentation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

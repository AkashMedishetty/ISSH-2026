"use client"

import { useState } from "react"
import { Metadata } from "next"
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute"
import { RegistrationTable } from "../../../components/admin/RegistrationTable"
import { Navigation } from "../../../components/Navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Badge } from "../../../components/ui/badge"
import { 
  Users, 
  Search, 
  Filter,
  Download,
  Mail,
  RefreshCw
} from "lucide-react"
import { conferenceConfig } from "@/config/conference.config"

export default function RegistrationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [workshopFilter, setWorkshopFilter] = useState("all")
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("all")
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Trigger refresh in RegistrationTable component
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleBulkEmail = () => {
    // Implement bulk email functionality
    console.log("Send bulk email to:", selectedRegistrations)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log("Export registrations")
  }

  const handleWorkshopExport = async () => {
    try {
      const response = await fetch(`/api/admin/export/workshop?workshop=${workshopFilter}&format=csv`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `workshop_${workshopFilter}_registrations_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="container mx-auto px-4 py-4 md:py-8">
          <div className="space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Registration Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 md:mt-2 text-sm md:text-base">
                  View and manage all conference registrations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export All</span>
                </Button>
              </div>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
                <CardDescription>
                  Filter and search through registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="text-sm font-medium">Search</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {conferenceConfig.registration.categories.map(cat => (
                          <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workshop</label>
                    <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by workshop" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Workshops</SelectItem>
                        <SelectItem value="joint-replacement">Joint Replacement</SelectItem>
                        <SelectItem value="spinal-surgery">Spine Surgery</SelectItem>
                        <SelectItem value="pediatric-orthopaedics">Pediatric Orthopaedics</SelectItem>
                        <SelectItem value="arthroscopy">Arthroscopy</SelectItem>
                        <SelectItem value="orthopaedic-rehab">Orthopaedic Rehabilitation</SelectItem>
                        <SelectItem value="trauma-surgery">Trauma Surgery</SelectItem>
                        <SelectItem value="no-workshop">No Workshop Selected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Type</label>
                    <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payment Types</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="complementary">Complementary</SelectItem>
                        <SelectItem value="sponsored">Sponsored</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Actions</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegistrations.length > 0 && (
                        <Button
                          size="sm"
                          onClick={handleBulkEmail}
                          className="flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          <span className="hidden sm:inline">Email</span> ({selectedRegistrations.length})
                        </Button>
                      )}
                      {workshopFilter !== "all" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleWorkshopExport}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span className="hidden sm:inline">Export Workshop</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Table */}
            <div className="space-y-4">
              <RegistrationTable
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                workshopFilter={workshopFilter}
                paymentTypeFilter={paymentTypeFilter}
                onSelectionChange={setSelectedRegistrations}
              />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
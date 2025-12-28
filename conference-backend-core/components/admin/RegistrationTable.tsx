"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Alert, AlertDescription } from "../ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../ui/dialog"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Checkbox } from "../ui/checkbox"
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  Phone,
  Calendar,
  MoreVertical,
  Plus,
  Upload,
  FileSpreadsheet,
  Save,
  X,
  DollarSign,
  Gift,
  Award,
  MapPin,
  BookOpen,
  FileText,
  Send
} from "lucide-react"
import { useToast } from "../ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { EmailDialog } from "./EmailDialog"
import { VerifiedImportDialog } from "./VerifiedImportDialog"
import { conferenceConfig, getCategoryLabel } from "@/config/conference.config"

// Workshop Selection Editor Component
interface WorkshopSelectionEditorProps {
  selectedWorkshops: string[]
  onSelectionChange: (workshops: string[]) => void
}

function WorkshopSelectionEditor({ selectedWorkshops, onSelectionChange }: WorkshopSelectionEditorProps) {
  const [availableWorkshops, setAvailableWorkshops] = useState([
    { id: "joint-replacement", label: "Advanced Joint Replacement Techniques" },
    { id: "spinal-surgery", label: "Spine Surgery and Instrumentation" },
    { id: "pediatric-orthopaedics", label: "Pediatric Orthopaedics" },
    { id: "arthroscopy", label: "Arthroscopic Surgery Techniques" },
    { id: "orthopaedic-rehab", label: "Orthopaedic Rehabilitation" },
    { id: "trauma-surgery", label: "Orthopaedic Trauma Surgery" }
  ])

  const handleWorkshopToggle = (workshopId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedWorkshops, workshopId])
    } else {
      onSelectionChange(selectedWorkshops.filter(id => id !== workshopId))
    }
  }

  return (
    <div className="space-y-3">
      {availableWorkshops.map((workshop) => (
        <div key={workshop.id} className="flex items-center space-x-3 p-3 border rounded-lg">
          <Checkbox
            id={`workshop-${workshop.id}`}
            checked={selectedWorkshops.includes(workshop.id)}
            onCheckedChange={(checked) => handleWorkshopToggle(workshop.id, checked as boolean)}
          />
          <Label htmlFor={`workshop-${workshop.id}`} className="flex-1 cursor-pointer">
            {workshop.label}
          </Label>
        </div>
      ))}
      {selectedWorkshops.length === 0 && (
        <p className="text-sm text-gray-500 italic">No workshops selected</p>
      )}
    </div>
  )
}

// Accompanying Persons Editor Component
interface AccompanyingPersonsEditorProps {
  accompanyingPersons: Array<{
    name: string
    age: number
    relationship: string
    dietaryRequirements?: string
  }>
  onPersonsChange: (persons: Array<{
    name: string
    age: number
    relationship: string
    dietaryRequirements?: string
  }>) => void
}

function AccompanyingPersonsEditor({ accompanyingPersons, onPersonsChange }: AccompanyingPersonsEditorProps) {
  const addPerson = () => {
    onPersonsChange([
      ...accompanyingPersons,
      { name: '', age: 0, relationship: '', dietaryRequirements: '' }
    ])
  }

  const removePerson = (index: number) => {
    onPersonsChange(accompanyingPersons.filter((_, i) => i !== index))
  }

  const updatePerson = (index: number, field: string, value: any) => {
    const updated = accompanyingPersons.map((person, i) =>
      i === index ? { ...person, [field]: value } : person
    )
    onPersonsChange(updated)
  }

  return (
    <div className="space-y-4">
      {accompanyingPersons.map((person, index) => (
        <div key={index} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Person {index + 1}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePerson(index)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={person.name}
                onChange={(e) => updatePerson(index, 'name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                value={person.age}
                onChange={(e) => updatePerson(index, 'age', parseInt(e.target.value) || 0)}
                placeholder="Age"
              />
            </div>
            <div>
              <Label>Relationship</Label>
              <Select
                value={person.relationship}
                onValueChange={(value) => updatePerson(index, 'relationship', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="colleague">Colleague</SelectItem>
                  <SelectItem value="friend">Friend</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Dietary Requirements</Label>
            <Input
              value={person.dietaryRequirements || ''}
              onChange={(e) => updatePerson(index, 'dietaryRequirements', e.target.value)}
              placeholder="Any dietary restrictions"
            />
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        onClick={addPerson}
        className="w-full"
        disabled={accompanyingPersons.length >= 5}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Accompanying Person
      </Button>

      {accompanyingPersons.length === 0 && (
        <p className="text-sm text-gray-500 italic">No accompanying persons added</p>
      )}

      {accompanyingPersons.length >= 5 && (
        <p className="text-sm text-amber-600">Maximum 5 accompanying persons allowed</p>
      )}
    </div>
  )
}

interface Registration {
  _id: string
  email: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    address: {
      city: string
      state: string
      country: string
    }
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    registrationId: string
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: Array<{
      name: string
      age: number
      relationship: string
      dietaryRequirements?: string
    }>
    registrationDate: string
    paymentDate?: string
    paymentType?: 'regular' | 'complementary' | 'sponsored'
    sponsorName?: string
    sponsorCategory?: string
    paymentRemarks?: string
  }
  paymentInfo?: {
    amount: number
    currency: string
    transactionId: string
    status?: string
    breakdown?: {
      baseAmount?: number
      workshopFees?: Array<{ name: string; amount: number }>
      accompanyingPersonFees?: number
      discountsApplied?: Array<{ type: string; percentage: number; amount: number }>
    }
  }
}

interface NewRegistration {
  email: string
  password: string
  profile: {
    title: string
    firstName: string
    lastName: string
    phone: string
    institution: string
    designation: string
    address: {
      city: string
      state: string
      country: string
    }
    dietaryRequirements?: string
    specialNeeds?: string
  }
  registration: {
    type: string
    status: string
    membershipNumber?: string
    workshopSelections: string[]
    accompanyingPersons: Array<{
      name: string
      age: number
      relationship: string
      dietaryRequirements?: string
    }>
    paymentType?: 'regular' | 'complementary' | 'sponsored'
    sponsorName?: string
    sponsorCategory?: string
    paymentRemarks?: string
  }
  paymentInfo?: {
    amount: number
    currency: string
    status?: string
    breakdown?: {
      baseAmount?: number
      workshopFees?: Array<{ name: string; amount: number }>
      accompanyingPersonFees?: number
      discountsApplied?: Array<{ type: string; percentage: number; amount: number }>
    }
  }
}

interface RegistrationTableProps {
  searchTerm?: string
  statusFilter?: string
  typeFilter?: string
  workshopFilter?: string
  paymentTypeFilter?: string
  onSelectionChange?: (selectedIds: string[]) => void
}

export function RegistrationTable({
  onSelectionChange
}: RegistrationTableProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([])
  const [totalFilteredCount, setTotalFilteredCount] = useState(0)
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null)
  const [newRegistration, setNewRegistration] = useState<NewRegistration>({
    email: "",
    password: "",
    profile: {
      title: "",
      firstName: "",
      lastName: "",
      phone: "",
      institution: "",
      designation: "",
      address: {
        city: "",
        state: "",
        country: "India"
      }
    },
    registration: {
      type: "consultant",
      status: "pending",
      workshopSelections: [],
      accompanyingPersons: []
    }
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [paymentData, setPaymentData] = useState({
    paymentType: 'regular' as 'regular' | 'complementary' | 'sponsored',
    sponsorName: '',
    sponsorCategory: '',
    paymentRemarks: '',
    amount: 0,
    bankTransferUTR: '',
    transactionId: ''
  })
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [selectedRegistrationForEmail, setSelectedRegistrationForEmail] = useState<Registration | null>(null)
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false)
  const [bulkEmailConfig, setBulkEmailConfig] = useState({
    template: 'custom',
    subject: '',
    message: '',
    sendTo: 'selected' as 'selected' | 'filtered' | 'all'
  })

  const { toast } = useToast()

  // Email template definitions
  const emailTemplates = {
    registrationConfirmation: {
      subject: 'Registration Confirmation - NeuroVascon 2026',
      message: `Dear {name},\n\nThank you for registering for NeuroVascon 2026!\n\nYour Registration Details:\nRegistration ID: {registrationId}\nEmail: {email}\nInstitution: {institution}\n\nWe look forward to seeing you at the conference.\n\nBest regards,\nNeuroVascon 2026 Organizing Committee`
    },
    paymentReminder: {
      subject: 'Payment Reminder - NeuroVascon 2026 Registration',
      message: `Dear {name},\n\nThis is a friendly reminder regarding your registration payment for NeuroVascon 2026.\n\nRegistration ID: {registrationId}\nInstitution: {institution}\n\nPlease complete your payment at your earliest convenience to confirm your participation.\n\nFor any queries, please contact us.\n\nBest regards,\nNeuroVascon 2026 Team`
    },
    eventUpdate: {
      subject: 'Important Update - NeuroVascon 2026',
      message: `Dear {name},\n\nWe have an important update regarding NeuroVascon 2026.\n\n[Please add your update details here]\n\nRegistration ID: {registrationId}\n\nThank you for your attention.\n\nBest regards,\nNeuroVascon 2026 Organizing Committee`
    },
    welcomeEmail: {
      subject: 'Welcome to NeuroVascon 2026!',
      message: `Dear {name},\n\nWelcome to NeuroVascon 2026!\n\nWe are excited to have you join us. Your registration has been successfully processed.\n\nRegistration ID: {registrationId}\nEmail: {email}\nInstitution: {institution}\n\nStay tuned for more updates about the conference schedule and activities.\n\nWarm regards,\nNeuroVascon 2026 Team`
    },
    custom: {
      subject: '',
      message: ''
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  useEffect(() => {
    filterAndPaginateRegistrations()
  }, [registrations, searchTerm, statusFilter, typeFilter, currentPage, itemsPerPage])

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRegistrations)
    }
  }, [selectedRegistrations, onSelectionChange])

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/registrations")
      const data = await response.json()

      if (data.success) {
        setRegistrations(data.data)
      } else {
        setError(data.message || "Failed to fetch registrations")
      }
    } catch (error) {
      console.error("Registrations fetch error:", error)
      setError("An error occurred while fetching registrations")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndPaginateRegistrations = () => {
    let filtered = registrations

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reg =>
        reg.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.registration.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.profile.institution?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(reg => reg.registration.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(reg => reg.registration.type === typeFilter)
    }

    // Store total filtered count for pagination
    setTotalFilteredCount(filtered.length)

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginated = filtered.slice(startIndex, endIndex)

    setFilteredRegistrations(paginated)
    
    // Reset to page 1 if current page is out of range
    if (filtered.length > 0 && currentPage > Math.ceil(filtered.length / itemsPerPage)) {
      setCurrentPage(1)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(filteredRegistrations.map(reg => reg._id))
    } else {
      setSelectedRegistrations([])
    }
  }

  const handleSelectRegistration = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRegistrations(prev => [...prev, id])
    } else {
      setSelectedRegistrations(prev => prev.filter(regId => regId !== id))
    }
  }

  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Status Updated",
          description: "Registration status has been updated successfully."
        })
        fetchRegistrations()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update registration status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Status update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating the status",
        variant: "destructive"
      })
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/export/registrations")

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Export Started",
          description: "Registration data is being downloaded."
        })
      } else {
        toast({
          title: "Export Failed",
          description: "Unable to export registration data",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during export",
        variant: "destructive"
      })
    }
  }

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration({ ...registration })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingRegistration) return

    try {
      // Sync paymentType with registration type for complementary and sponsored
      const updatedRegistration = { ...editingRegistration }
      if (updatedRegistration.registration.type === 'complementary') {
        updatedRegistration.registration.paymentType = 'complementary'
        updatedRegistration.registration.status = 'paid'
        updatedRegistration.registration.paymentDate = new Date().toISOString()
      } else if (updatedRegistration.registration.type === 'sponsored') {
        updatedRegistration.registration.paymentType = 'sponsored'
        updatedRegistration.registration.status = 'paid'
        updatedRegistration.registration.paymentDate = new Date().toISOString()
      } else {
        updatedRegistration.registration.paymentType = 'regular'
      }

      const response = await fetch(`/api/admin/registrations/${editingRegistration._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedRegistration)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Registration Updated",
          description: "Registration has been updated successfully."
        })
        setIsEditOpen(false)
        setEditingRegistration(null)
        fetchRegistrations()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update registration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Edit error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating the registration",
        variant: "destructive"
      })
    }
  }

  const handleAddRegistration = async () => {
    try {
      const response = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newRegistration)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Registration Added",
          description: "New registration has been created successfully."
        })
        setIsAddOpen(false)
        setNewRegistration({
          email: "",
          password: "",
          profile: {
            title: "",
            firstName: "",
            lastName: "",
            phone: "",
            institution: "",
            designation: "",
            address: {
              city: "",
              state: "",
              country: "India"
            }
          },
          registration: {
            type: "consultant",
            status: "pending",
            workshopSelections: [],
            accompanyingPersons: []
          }
        })
        fetchRegistrations()
      } else {
        toast({
          title: "Add Failed",
          description: data.message || "Failed to add registration",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Add error:", error)
      toast({
        title: "Error",
        description: "An error occurred while adding the registration",
        variant: "destructive"
      })
    }
  }

  const handleImportRegistrations = async () => {
    if (!importFile) return

    const formData = new FormData()
    formData.append('file', importFile)

    try {
      const response = await fetch("/api/admin/registrations/import", {
        method: "POST",
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Import Successful",
          description: `${data.imported} registrations imported successfully.`
        })
        setIsImportOpen(false)
        setImportFile(null)
        fetchRegistrations()
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import registrations",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "Error",
        description: "An error occurred during import",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsPaid = (registration: Registration) => {
    setSelectedRegistration(registration)
    setPaymentData({
      paymentType: registration.registration.paymentType || 'regular',
      sponsorName: registration.registration.sponsorName || '',
      sponsorCategory: registration.registration.sponsorCategory || '',
      paymentRemarks: registration.registration.paymentRemarks || '',
      amount: registration.paymentInfo?.amount || 0,
      bankTransferUTR: registration.paymentInfo?.transactionId || '',
      transactionId: ''
    })
    setIsPaymentOpen(true)
  }

  const handleSavePayment = async () => {
    if (!selectedRegistration) return

    try {
      // Determine status based on payment type
      let status = "pending"
      if (paymentData.paymentType === 'complementary' || paymentData.paymentType === 'sponsored') {
        status = "paid" // Complementary and sponsored are automatically paid
      } else if (paymentData.amount && parseFloat(paymentData.amount.toString()) > 0) {
        status = "paid" // Regular payment with amount
      }

      const response = await fetch(`/api/admin/registrations/${selectedRegistration._id}/payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status,
          paymentType: paymentData.paymentType,
          sponsorName: paymentData.sponsorName,
          sponsorCategory: paymentData.sponsorCategory,
          paymentRemarks: paymentData.paymentRemarks,
          amount: paymentData.amount,
          bankTransferUTR: paymentData.bankTransferUTR || undefined,
          transactionId: paymentData.transactionId || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Payment Updated",
          description: "Payment status has been updated successfully."
        })
        setIsPaymentOpen(false)
        setSelectedRegistration(null)
        fetchRegistrations()
      } else {
        toast({
          title: "Update Failed",
          description: data.message || "Failed to update payment status",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Payment update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating payment status",
        variant: "destructive"
      })
    }
  }

  const downloadTemplate = () => {
    const template = `Title,First Name,Last Name,Email,Phone,Designation,Institution,City,State,Country,Registration Type,Membership Number,Dietary Requirements,Special Needs
Dr.,John,Doe,john.doe@example.com,+1234567890,Consultant,Example Hospital,Hyderabad,Telangana,India,consultant,,Vegetarian,None
Prof.,Jane,Smith,jane.smith@example.com,+0987654321,Consultant,Medical College,Mumbai,Maharashtra,India,consultant,MED123,None,Wheelchair access
Dr.,Alice,Johnson,alice.johnson@example.com,+1122334455,PG/Student,University Hospital,Chennai,Tamil Nadu,India,postgraduate,,None,None`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'registration-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Template Downloaded",
      description: "Excel template has been downloaded."
    })
  }

  const handleSendEmail = (registration: Registration | null) => {
    if (!registration) return
    setSelectedRegistrationForEmail(registration)
    setIsEmailDialogOpen(true)
  }

  const handleBulkEmail = () => {
    if (selectedRegistrations.length === 0) {
      toast({
        title: "No Recipients Selected",
        description: "Please select at least one registration to send bulk emails",
        variant: "destructive"
      })
      return
    }
    setIsBulkEmailOpen(true)
  }

  const handleBulkInvoice = async () => {
    if (selectedRegistrations.length === 0) return
    
    toast({
      title: "Sending Bulk Invoices...",
      description: `Preparing to send invoices to ${selectedRegistrations.length} recipients`,
    })

    let successCount = 0
    let failCount = 0

    for (const regId of selectedRegistrations) {
      try {
        const response = await fetch(`/api/admin/registrations/${regId}/send-invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch (error) {
        failCount++
      }
    }

    toast({
      title: successCount > 0 ? "✅ Bulk Invoices Sent" : "❌ Bulk Invoice Failed",
      description: `Successfully sent: ${successCount}, Failed: ${failCount}`,
      variant: failCount > 0 ? "destructive" : "default"
    })

    setSelectedRegistrations([])
  }

  const handleSendInvoice = async (registration: Registration | null) => {
    if (!registration) return

    try {
      toast({
        title: "Sending Invoice...",
        description: `Preparing invoice for ${registration.profile.firstName} ${registration.profile.lastName}`,
      })

      const response = await fetch(`/api/admin/registrations/${registration._id}/send-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast({
          title: "✅ Invoice Sent Successfully",
          description: `Invoice sent to ${registration.email}`,
        })
      } else {
        toast({
          title: "❌ Failed to Send Invoice",
          description: "Please try again or contact support",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Send invoice error:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending invoice",
        variant: "destructive"
      })
    }
  }

  const handleSendCertificate = async (registration: Registration | null) => {
    if (!registration) return

    try {
      toast({
        title: "Sending Certificate...",
        description: `Preparing certificate for ${registration.profile.firstName} ${registration.profile.lastName}`,
      })

      const response = await fetch(`/api/admin/registrations/${registration._id}/send-certificate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast({
          title: "✅ Certificate Sent Successfully",
          description: `Certificate sent to ${registration.email}`,
        })
      } else {
        const data = await response.json()
        toast({
          title: "❌ Failed to Send Certificate",
          description: data.message || "Please try again or contact support",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Send certificate error:", error)
      toast({
        title: "Error",
        description: "An error occurred while sending certificate",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <CheckCircle className="h-3 w-3" />
      case "pending":
        return <Clock className="h-3 w-3" />
      case "cancelled":
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "postgraduate": return "Postgraduate"
      case "consultant": return "Consultant"
      case "iscsg-member": return "ISCSG Member"
      case "complimentary": return "Complimentary"
      case "sponsored": return "Sponsored"
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") {
      return `$${amount.toFixed(2)}`
    }
    return `₹${amount.toLocaleString()}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="h-5 w-5 text-orange-500" />
                Registrations ({registrations.length})
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Manage conference registrations and attendee information
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Add Registration clicked')
                  setIsAddOpen(true)
                }}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
                <span className="hidden lg:inline">Registration</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Import clicked')
                  setIsImportOpen(true)
                }}
                className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import Basic</span>
              </Button>
              <VerifiedImportDialog onImportComplete={fetchRegistrations} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              {selectedRegistrations.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkEmail}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Email ({selectedRegistrations.length})</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkInvoice}
                    className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="hidden sm:inline">Invoice ({selectedRegistrations.length})</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-white dark:bg-slate-900">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {registrations.filter(r => r.registration.status === 'paid').length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Paid</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {registrations.filter(r => r.registration.status === 'pending').length}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {registrations.reduce((sum, r) => sum + r.registration.workshopSelections.length, 0)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Workshop Registrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {registrations.reduce((sum, r) => sum + r.registration.accompanyingPersons.length, 0)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Accompanying Persons</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, registration ID, or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {conferenceConfig.registration.categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(searchTerm || statusFilter !== "all" || typeFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                      setTypeFilter("all")
                    }}
                    className="bg-white dark:bg-slate-900"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {filteredRegistrations.map((registration) => (
                <Card key={registration._id} className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRegistrations.includes(registration._id)}
                        onChange={(e) => handleSelectRegistration(registration._id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <DropdownMenuItem onClick={() => {
                          setSelectedRegistration(registration)
                          setIsDetailsOpen(true)
                        }} className="text-slate-700 dark:text-slate-300 cursor-pointer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditRegistration(registration)} className="text-slate-700 dark:text-slate-300 cursor-pointer">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Registration
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMarkAsPaid(registration)} className="text-slate-700 dark:text-slate-300 cursor-pointer">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer" onClick={() => handleStatusUpdate(registration._id, 'cancelled')}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Registration
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {registration.profile.title} {registration.profile.firstName} {registration.profile.lastName}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{registration.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">{registration.profile.institution}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-orange-50"
                        onClick={() => {
                          setSelectedRegistration(registration)
                          setIsDetailsOpen(true)
                        }}
                      >
                        {registration.registration.registrationId}
                      </Badge>
                      <Badge variant="secondary">
                        {getTypeLabel(registration.registration.type)}
                      </Badge>
                      <Badge className={`${getStatusColor(registration.registration.status)} flex items-center gap-1`}>
                        {getStatusIcon(registration.registration.status)}
                        {registration.registration.status.charAt(0).toUpperCase() + registration.registration.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      <div>Registered: {new Date(registration.registration.registrationDate).toLocaleDateString()}</div>
                      {registration.paymentInfo && (
                        <div className="font-medium text-green-600 dark:text-green-400">Payment: {formatCurrency(registration.paymentInfo.amount, registration.paymentInfo.currency)}</div>
                      )}
                      {registration.registration.paymentType && registration.registration.paymentType !== 'regular' && (
                        <div className="flex items-center gap-1 mt-1">
                          {registration.registration.paymentType === 'complementary' ? (
                            <Gift className="h-3 w-3 text-green-600" />
                          ) : (
                            <Award className="h-3 w-3 text-theme-primary-600" />
                          )}
                          <span className="text-xs capitalize">{registration.registration.paymentType}</span>
                          {registration.registration.sponsorName && (
                            <span className="text-xs">- {registration.registration.sponsorName}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration._id} className="hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <TableCell className="bg-white dark:bg-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.includes(registration._id)}
                          onChange={(e) => handleSelectRegistration(registration._id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {registration.profile.title} {registration.profile.firstName} {registration.profile.lastName}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">{registration.email}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">{registration.profile.institution}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <div>
                          <Badge
                            variant="outline"
                            className="mb-1 cursor-pointer hover:bg-orange-50"
                            onClick={() => {
                              setSelectedRegistration(registration)
                              setIsDetailsOpen(true)
                            }}
                          >
                            {registration.registration.registrationId}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {registration.registration.workshopSelections.length} workshops
                          </div>
                          {registration.registration.accompanyingPersons.length > 0 && (
                            <div className="text-xs text-gray-500">
                              +{registration.registration.accompanyingPersons.length} accompanying
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <Badge variant="secondary">
                          {getTypeLabel(registration.registration.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <Badge className={`${getStatusColor(registration.registration.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(registration.registration.status)}
                          {registration.registration.status.charAt(0).toUpperCase() + registration.registration.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <div className="text-sm">
                          {new Date(registration.registration.registrationDate).toLocaleDateString()}
                        </div>
                        {registration.registration.paymentDate && (
                          <div className="text-xs text-gray-500">
                            Paid: {new Date(registration.registration.paymentDate).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        {registration.paymentInfo ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {formatCurrency(registration.paymentInfo.amount, registration.paymentInfo.currency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {registration.paymentInfo.transactionId}
                            </div>
                            {registration.registration.paymentType && registration.registration.paymentType !== 'regular' && (
                              <div className="flex items-center gap-1 mt-1">
                                {registration.registration.paymentType === 'complementary' ? (
                                  <Gift className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Award className="h-3 w-3 text-theme-primary-600" />
                                )}
                                <span className="text-xs capitalize">{registration.registration.paymentType}</span>
                              </div>
                            )}
                            {registration.registration.sponsorName && (
                              <div className="text-xs text-gray-500">
                                Sponsor: {registration.registration.sponsorName}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Pending
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="bg-white dark:bg-slate-900">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRegistration(registration)
                                setIsDetailsOpen(true)
                              }}
                              className="text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditRegistration(registration)} className="text-slate-700 dark:text-slate-300 cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Registration
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(registration)} className="text-slate-700 dark:text-slate-300 cursor-pointer">
                              <DollarSign className="h-4 w-4 mr-2" />
                              Mark as Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 dark:text-red-400 cursor-pointer" onClick={() => handleStatusUpdate(registration._id, 'cancelled')}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel Registration
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredRegistrations.length === 0 && (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                No registrations found matching your criteria.
              </div>
            )}

            {/* Pagination */}
            {filteredRegistrations.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalFilteredCount)} of {totalFilteredCount} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="bg-white dark:bg-slate-900"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(totalFilteredCount / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || 
                               page === Math.ceil(totalFilteredCount / itemsPerPage) ||
                               Math.abs(page - currentPage) <= 1
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-slate-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-orange-500 hover:bg-orange-600" : "bg-white dark:bg-slate-900"}
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalFilteredCount / itemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(totalFilteredCount / itemsPerPage)}
                    className="bg-white dark:bg-slate-900"
                  >
                    Next
                  </Button>
                </div>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => {
                  setItemsPerPage(parseInt(v))
                  setCurrentPage(1)
                }}>
                  <SelectTrigger className="w-[120px] bg-white dark:bg-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Registration Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-lg sm:text-xl">Registration Details</DialogTitle>
                <DialogDescription className="text-sm">
                  Complete information for {selectedRegistration?.profile.firstName} {selectedRegistration?.profile.lastName}
                </DialogDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendEmail(selectedRegistration)}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendInvoice(selectedRegistration)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Send Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendCertificate(selectedRegistration)}
                  className="flex items-center gap-2"
                >
                  <Award className="h-4 w-4" />
                  Send Certificate
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
              {/* Registration Summary Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 border-slate-300 dark:border-slate-600">
                <CardContent className="p-4 sm:p-6 break-words">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        {selectedRegistration.profile.title} {selectedRegistration.profile.firstName} {selectedRegistration.profile.lastName}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                        {selectedRegistration.profile.institution}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {selectedRegistration.registration.registrationId}
                        </Badge>
                        <Badge className={`${getStatusColor(selectedRegistration.registration.status)} text-sm`}>
                          {getStatusIcon(selectedRegistration.registration.status)}
                          {selectedRegistration.registration.status.charAt(0).toUpperCase() + selectedRegistration.registration.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-slate-900 dark:text-white">
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Registration Type</div>
                      <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{getTypeLabel(selectedRegistration.registration.type)}</div>
                      {selectedRegistration.paymentInfo && (
                        <div className="text-xl sm:text-2xl font-bold text-green-600 mt-2">
                          {formatCurrency(selectedRegistration.paymentInfo.amount, selectedRegistration.paymentInfo.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Personal Information */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                      <User className="h-5 w-5 text-orange-500" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 break-words">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Full Name:</span>
                        <p className="font-medium">
                          {selectedRegistration.profile.title} {selectedRegistration.profile.firstName} {selectedRegistration.profile.lastName}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Email:</span>
                        <p className="font-medium text-theme-primary-600">{selectedRegistration.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Phone:</span>
                        <p className="font-medium">{selectedRegistration.profile.phone}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Institution:</span>
                        <p className="font-medium">{selectedRegistration.profile.institution}</p>
                      </div>
                    </div>

                    {selectedRegistration.profile.address && (
                      <div>
                        <span className="text-sm text-gray-600">Address:</span>
                        <p className="font-medium">
                          {[
                            selectedRegistration.profile.address.city,
                            selectedRegistration.profile.address.state,
                            selectedRegistration.profile.address.country
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}

                    {selectedRegistration.registration.membershipNumber && (
                      <div>
                        <span className="text-sm text-gray-600">Membership Number:</span>
                        <p className="font-medium">{selectedRegistration.registration.membershipNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Registration Details */}
                                                                                                                                                                          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      Registration Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 break-words">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Registration Date:</span>
                        <p className="font-medium">
                          {new Date(selectedRegistration.registration.registrationDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Registration Type:</span>
                        <p className="font-medium">{getTypeLabel(selectedRegistration.registration.type)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Current Status:</span>
                        <Badge className={`${getStatusColor(selectedRegistration.registration.status)} w-fit`}>
                          {getStatusIcon(selectedRegistration.registration.status)}
                          {selectedRegistration.registration.status.charAt(0).toUpperCase() + selectedRegistration.registration.status.slice(1)}
                        </Badge>
                      </div>
                      {selectedRegistration.registration.paymentDate && (
                        <div>
                          <span className="text-sm text-gray-600">Payment Date:</span>
                          <p className="font-medium">
                            {new Date(selectedRegistration.registration.paymentDate).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workshop Selections */}
              {selectedRegistration.registration.workshopSelections.length > 0 && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-500" />
                      Workshop Selections ({selectedRegistration.registration.workshopSelections.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedRegistration.registration.workshopSelections.map((workshop, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                          <CheckCircle className="h-5 w-5 text-theme-accent-600" />
                          <span className="font-medium">{workshop}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Accompanying Persons */}
              {selectedRegistration.registration.accompanyingPersons.length > 0 && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-500" />
                      Accompanying Persons ({selectedRegistration.registration.accompanyingPersons.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedRegistration.registration.accompanyingPersons.map((person, index) => (
                        <div key={index} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-indigo-800 dark:text-indigo-200">{person.name}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>Age: {person.age}</span>
                                <span>Relationship: {person.relationship}</span>
                              </div>
                              {person.dietaryRequirements && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">Dietary Requirements:</span>
                                  <p className="text-sm">{person.dietaryRequirements}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Information */}
              {selectedRegistration.paymentInfo && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedRegistration.paymentInfo.amount, selectedRegistration.paymentInfo.currency)}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Transaction ID:</span>
                          <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {selectedRegistration.paymentInfo.transactionId}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Payment Status:</span>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            {selectedRegistration.paymentInfo.status}
                          </Badge>
                        </div>
                      </div>

                      {selectedRegistration.paymentInfo.breakdown && (
                        <div>
                          <h4 className="font-semibold mb-3">Payment Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Registration Fee:</span>
                              <span className="font-medium">₹{selectedRegistration.paymentInfo.breakdown.baseAmount?.toLocaleString()}</span>
                            </div>
                            {selectedRegistration.paymentInfo.breakdown.workshopFees && selectedRegistration.paymentInfo.breakdown.workshopFees.length > 0 && (
                              <div className="flex justify-between">
                                <span>Workshop Fees:</span>
                                <span className="font-medium">
                                  ₹{selectedRegistration.paymentInfo.breakdown.workshopFees.reduce((sum: number, w: any) => sum + w.amount, 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {selectedRegistration.paymentInfo.breakdown.accompanyingPersonFees && selectedRegistration.paymentInfo.breakdown.accompanyingPersonFees > 0 && (
                              <div className="flex justify-between">
                                <span>Accompanying Persons:</span>
                                <span className="font-medium">₹{selectedRegistration.paymentInfo.breakdown.accompanyingPersonFees.toLocaleString()}</span>
                              </div>
                            )}
                            {selectedRegistration.paymentInfo.breakdown.discountsApplied && selectedRegistration.paymentInfo.breakdown.discountsApplied.length > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount Applied:</span>
                                <span className="font-medium">
                                  -₹{selectedRegistration.paymentInfo.breakdown.discountsApplied.reduce((sum: number, d: any) => sum + d.amount, 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Special Requirements */}
              {(selectedRegistration.profile.dietaryRequirements || selectedRegistration.profile.specialNeeds) && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Special Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedRegistration.profile.dietaryRequirements && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Dietary Requirements:</span>
                        <p className="mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                          {selectedRegistration.profile.dietaryRequirements}
                        </p>
                      </div>
                    )}
                    {selectedRegistration.profile.specialNeeds && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Special Needs:</span>
                        <p className="mt-1 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                          {selectedRegistration.profile.specialNeeds}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Type Information */}
              {selectedRegistration.registration.paymentType && selectedRegistration.registration.paymentType !== 'regular' && (
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedRegistration.registration.paymentType === 'complementary' ? (
                        <Gift className="h-5 w-5 text-green-500" />
                      ) : (
                        <Award className="h-5 w-5 text-theme-primary-500" />
                      )}
                      {selectedRegistration.registration.paymentType === 'complementary' ? 'Complementary Registration' : 'Sponsored Registration'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Payment Type:</span>
                        <Badge className={selectedRegistration.registration.paymentType === 'complementary' ? 'bg-green-100 text-green-800' : 'bg-theme-primary-100 text-blue-800'}>
                          {selectedRegistration.registration.paymentType.charAt(0).toUpperCase() + selectedRegistration.registration.paymentType.slice(1)}
                        </Badge>
                      </div>
                      {selectedRegistration.registration.sponsorName && (
                        <div>
                          <span className="text-sm text-gray-600">Sponsor Name:</span>
                          <p className="font-medium">{selectedRegistration.registration.sponsorName}</p>
                        </div>
                      )}
                      {selectedRegistration.registration.sponsorCategory && (
                        <div>
                          <span className="text-sm text-gray-600">Sponsor Category:</span>
                          <p className="font-medium">{selectedRegistration.registration.sponsorCategory}</p>
                        </div>
                      )}
                      {selectedRegistration.registration.paymentRemarks && (
                        <div>
                          <span className="text-sm text-gray-600">Remarks:</span>
                          <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            {selectedRegistration.registration.paymentRemarks}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => selectedRegistration && handleEditRegistration(selectedRegistration)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Registration
              </Button>
              <Button
                variant="outline"
                onClick={() => selectedRegistration && handleMarkAsPaid(selectedRegistration)}
                className="flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Update Payment
              </Button>
            </div>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Registration Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Edit Registration</DialogTitle>
            <DialogDescription>
              Update registration information for {editingRegistration?.profile.firstName} {editingRegistration?.profile.lastName}
            </DialogDescription>
          </DialogHeader>

          {editingRegistration && (
            <div className="space-y-4 w-full max-w-full overflow-hidden">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-title">Title</Label>
                      <Select
                        value={editingRegistration.profile.title}
                        onValueChange={(value) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, title: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dr.">Dr.</SelectItem>
                          <SelectItem value="Prof.">Prof.</SelectItem>
                          <SelectItem value="Mr.">Mr.</SelectItem>
                          <SelectItem value="Ms.">Ms.</SelectItem>
                          <SelectItem value="Mrs.">Mrs.</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-firstName">First Name</Label>
                      <Input
                        id="edit-firstName"
                        value={editingRegistration.profile.firstName}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, firstName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName">Last Name</Label>
                      <Input
                        id="edit-lastName"
                        value={editingRegistration.profile.lastName}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, lastName: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editingRegistration.email}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          email: e.target.value
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone</Label>
                      <Input
                        id="edit-phone"
                        value={editingRegistration.profile.phone}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, phone: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-institution">Institution</Label>
                      <Input
                        id="edit-institution"
                        value={editingRegistration.profile.institution}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, institution: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-city">City</Label>
                      <Input
                        id="edit-city"
                        value={editingRegistration.profile.address?.city || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: {
                            ...editingRegistration.profile,
                            address: {
                              ...editingRegistration.profile.address,
                              city: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-state">State</Label>
                      <Input
                        id="edit-state"
                        value={editingRegistration.profile.address?.state || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: {
                            ...editingRegistration.profile,
                            address: {
                              ...editingRegistration.profile.address,
                              state: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-country">Country</Label>
                      <Input
                        id="edit-country"
                        value={editingRegistration.profile.address?.country || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: {
                            ...editingRegistration.profile,
                            address: {
                              ...editingRegistration.profile.address,
                              country: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Registration Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-type">Registration Type</Label>
                      <Select
                        value={editingRegistration.registration.type}
                        onValueChange={(value) => setEditingRegistration({
                          ...editingRegistration,
                          registration: { ...editingRegistration.registration, type: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conferenceConfig.registration.categories.map(cat => (
                            <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                          ))}
                          <SelectItem value="sponsored">Sponsored</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-status">Status</Label>
                      <Select
                        value={editingRegistration.registration.status}
                        onValueChange={(value) => setEditingRegistration({
                          ...editingRegistration,
                          registration: { ...editingRegistration.registration, status: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-membership">Membership Number</Label>
                      <Input
                        id="edit-membership"
                        value={editingRegistration.registration.membershipNumber || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          registration: { ...editingRegistration.registration, membershipNumber: e.target.value }
                        })}
                        placeholder="Enter membership number"
                      />
                    </div>
                  </div>
                </div>

                {/* Workshop Selections */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Workshop Selections
                  </h3>
                  <WorkshopSelectionEditor
                    selectedWorkshops={editingRegistration.registration.workshopSelections}
                    onSelectionChange={(workshops) => setEditingRegistration({
                      ...editingRegistration,
                      registration: { ...editingRegistration.registration, workshopSelections: workshops }
                    })}
                  />
                </div>

                {/* Accompanying Persons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Accompanying Persons
                  </h3>
                  <AccompanyingPersonsEditor
                    accompanyingPersons={editingRegistration.registration.accompanyingPersons}
                    onPersonsChange={(persons) => setEditingRegistration({
                      ...editingRegistration,
                      registration: { ...editingRegistration.registration, accompanyingPersons: persons }
                    })}
                  />
                </div>

                {/* Special Requirements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Special Requirements
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-dietary">Dietary Requirements</Label>
                      <Textarea
                        id="edit-dietary"
                        value={editingRegistration.profile.dietaryRequirements || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, dietaryRequirements: e.target.value }
                        })}
                        placeholder="Any dietary restrictions or preferences"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-special">Special Needs</Label>
                      <Textarea
                        id="edit-special"
                        value={editingRegistration.profile.specialNeeds || ''}
                        onChange={(e) => setEditingRegistration({
                          ...editingRegistration,
                          profile: { ...editingRegistration.profile, specialNeeds: e.target.value }
                        })}
                        placeholder="Any accessibility requirements or special needs"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Registration Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Add New Registration</DialogTitle>
            <DialogDescription>
              Create a new registration manually
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-title">Title</Label>
                  <Select
                    value={newRegistration.profile.title}
                    onValueChange={(value) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, title: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dr.">Dr.</SelectItem>
                      <SelectItem value="Prof.">Prof.</SelectItem>
                      <SelectItem value="Mr.">Mr.</SelectItem>
                      <SelectItem value="Ms.">Ms.</SelectItem>
                      <SelectItem value="Mrs.">Mrs.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-firstName">First Name</Label>
                  <Input
                    id="new-firstName"
                    value={newRegistration.profile.firstName}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, firstName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-lastName">Last Name</Label>
                  <Input
                    id="new-lastName"
                    value={newRegistration.profile.lastName}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, lastName: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newRegistration.email}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      email: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-phone">Phone</Label>
                  <Input
                    id="new-phone"
                    value={newRegistration.profile.phone}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, phone: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-institution">Institution</Label>
                  <Input
                    id="new-institution"
                    value={newRegistration.profile.institution}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, institution: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-designation">Designation</Label>
                  <Select
                    value={newRegistration.profile.designation}
                    onValueChange={(value) => setNewRegistration({
                      ...newRegistration,
                      profile: { ...newRegistration.profile, designation: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultant">Consultant</SelectItem>
                      <SelectItem value="PG/Student">PG/Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newRegistration.password}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      password: e.target.value
                    })}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-city">City</Label>
                  <Input
                    id="new-city"
                    value={newRegistration.profile.address.city}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: {
                        ...newRegistration.profile,
                        address: { ...newRegistration.profile.address, city: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-state">State</Label>
                  <Input
                    id="new-state"
                    value={newRegistration.profile.address.state}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: {
                        ...newRegistration.profile,
                        address: { ...newRegistration.profile.address, state: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-country">Country</Label>
                  <Input
                    id="new-country"
                    value={newRegistration.profile.address.country}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      profile: {
                        ...newRegistration.profile,
                        address: { ...newRegistration.profile.address, country: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Registration Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Registration Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-type">Registration Type</Label>
                  <Select
                    value={newRegistration.registration.type}
                    onValueChange={(value) => setNewRegistration({
                      ...newRegistration,
                      registration: { ...newRegistration.registration, type: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conferenceConfig.registration.categories.map(cat => (
                        <SelectItem key={cat.key} value={cat.key}>{cat.label}</SelectItem>
                      ))}
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-status">Status</Label>
                  <Select
                    value={newRegistration.registration.status}
                    onValueChange={(value) => setNewRegistration({
                      ...newRegistration,
                      registration: { ...newRegistration.registration, status: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="new-membership">Membership Number</Label>
                  <Input
                    id="new-membership"
                    value={newRegistration.registration.membershipNumber || ''}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      registration: { ...newRegistration.registration, membershipNumber: e.target.value }
                    })}
                    placeholder="Enter membership number"
                  />
                </div>
                <div>
                  <Label htmlFor="new-paymentType">Payment Type</Label>
                  <Select
                    value={newRegistration.registration.paymentType || 'regular'}
                    onValueChange={(value) => setNewRegistration({
                      ...newRegistration,
                      registration: { ...newRegistration.registration, paymentType: value as 'regular' | 'complementary' | 'sponsored' }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="complementary">Complimentary</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newRegistration.registration.paymentType === 'sponsored' && (
                  <>
                    <div>
                      <Label htmlFor="new-sponsorName">Sponsor Name</Label>
                      <Input
                        id="new-sponsorName"
                        value={newRegistration.registration.sponsorName || ''}
                        onChange={(e) => setNewRegistration({
                          ...newRegistration,
                          registration: { ...newRegistration.registration, sponsorName: e.target.value }
                        })}
                        placeholder="Enter sponsor name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-sponsorCategory">Sponsor Category</Label>
                      <Input
                        id="new-sponsorCategory"
                        value={newRegistration.registration.sponsorCategory || ''}
                        onChange={(e) => setNewRegistration({
                          ...newRegistration,
                          registration: { ...newRegistration.registration, sponsorCategory: e.target.value }
                        })}
                        placeholder="Enter sponsor category"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="new-paymentRemarks">Payment Remarks</Label>
                  <Input
                    id="new-paymentRemarks"
                    value={newRegistration.registration.paymentRemarks || ''}
                    onChange={(e) => setNewRegistration({
                      ...newRegistration,
                      registration: { ...newRegistration.registration, paymentRemarks: e.target.value }
                    })}
                    placeholder="Additional payment notes"
                  />
                </div>
              </div>
            </div>

            {/* Workshop Selections */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Workshop Selections</h3>
              <WorkshopSelectionEditor
                selectedWorkshops={newRegistration.registration.workshopSelections}
                onSelectionChange={(workshops) => setNewRegistration({
                  ...newRegistration,
                  registration: { ...newRegistration.registration, workshopSelections: workshops }
                })}
              />
            </div>

            {/* Accompanying Persons */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Accompanying Persons</h3>
              <AccompanyingPersonsEditor
                accompanyingPersons={newRegistration.registration.accompanyingPersons}
                onPersonsChange={(persons) => setNewRegistration({
                  ...newRegistration,
                  registration: { ...newRegistration.registration, accompanyingPersons: persons }
                })}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRegistration}>
              <Plus className="h-4 w-4 mr-2" />
              Add Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Import Registrations</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple registrations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="import-file">CSV File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Template Format</h4>
              <p className="text-sm text-gray-600 mb-3">
                Download the template to see the required format for importing registrations.
              </p>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportRegistrations} disabled={!importFile}>
              <Upload className="h-4 w-4 mr-2" />
              Import Registrations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Management Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
            <DialogDescription>
              Update payment status and details for {selectedRegistration?.profile.firstName} {selectedRegistration?.profile.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-type">Payment Type</Label>
              <Select
                value={paymentData.paymentType}
                onValueChange={(value: 'regular' | 'complementary' | 'sponsored') =>
                  setPaymentData({ ...paymentData, paymentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Payment</SelectItem>
                  <SelectItem value="complementary">Complementary</SelectItem>
                  <SelectItem value="sponsored">Sponsored</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentData.paymentType === 'sponsored' && (
              <>
                <div>
                  <Label htmlFor="sponsor-name">Sponsor Name</Label>
                  <Input
                    id="sponsor-name"
                    value={paymentData.sponsorName}
                    onChange={(e) => setPaymentData({ ...paymentData, sponsorName: e.target.value })}
                    placeholder="Enter sponsor name"
                  />
                </div>
                <div>
                  <Label htmlFor="sponsor-category">Sponsor Category</Label>
                  <Select
                    value={paymentData.sponsorCategory}
                    onValueChange={(value) => setPaymentData({ ...paymentData, sponsorCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platinum">Platinum Sponsor</SelectItem>
                      <SelectItem value="gold">Gold Sponsor</SelectItem>
                      <SelectItem value="silver">Silver Sponsor</SelectItem>
                      <SelectItem value="bronze">Bronze Sponsor</SelectItem>
                      <SelectItem value="exhibitor">Exhibitor</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter amount"
              />
            </div>

            {paymentData.paymentType === 'regular' && (
              <>
                <div>
                  <Label htmlFor="bank-utr">Bank UTR / Reference ID</Label>
                  <Input
                    id="bank-utr"
                    value={paymentData.bankTransferUTR}
                    onChange={(e) => setPaymentData({ ...paymentData, bankTransferUTR: e.target.value })}
                    placeholder="Enter bank UTR / reference"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="txn-id">Internal Transaction ID (optional)</Label>
                  <Input
                    id="txn-id"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                    placeholder="Enter transaction id"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="payment-remarks">Remarks</Label>
              <Textarea
                id="payment-remarks"
                value={paymentData.paymentRemarks}
                onChange={(e) => setPaymentData({ ...paymentData, paymentRemarks: e.target.value })}
                placeholder="Additional remarks or notes"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePayment}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      {selectedRegistrationForEmail && (
        <EmailDialog
          isOpen={isEmailDialogOpen}
          registration={selectedRegistrationForEmail}
          onClose={() => {
            setIsEmailDialogOpen(false)
            setSelectedRegistrationForEmail(null)
          }}
          onEmailSent={() => {
            setIsEmailDialogOpen(false)
            setSelectedRegistrationForEmail(null)
          }}
        />
      )}

      {/* Bulk Email Dialog */}
      <Dialog open={isBulkEmailOpen} onOpenChange={setIsBulkEmailOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-blue-500" />
              Send Bulk Emails
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              Configure and send emails to {selectedRegistrations.length} selected registration{selectedRegistrations.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 w-full max-w-full overflow-hidden">
            {/* Recipients Info */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
                    <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {selectedRegistrations.length} Recipient{selectedRegistrations.length !== 1 ? 's' : ''}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Emails will be sent to all selected registrations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Template Selection */}
            <div className="space-y-3">
              <Label className="text-slate-900 dark:text-white">Email Template</Label>
              <Select 
                value={bulkEmailConfig.template} 
                onValueChange={(value) => {
                  const template = emailTemplates[value as keyof typeof emailTemplates]
                  if (template) {
                    setBulkEmailConfig({
                      ...bulkEmailConfig,
                      template: value,
                      subject: template.subject,
                      message: template.message
                    })
                  }
                }}
              >
                <SelectTrigger className="bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registrationConfirmation">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Registration Confirmation</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paymentReminder">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Payment Reminder</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="eventUpdate">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Event Update</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="welcomeEmail">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Welcome Email</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span>Custom Message</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Line */}
            <div className="space-y-2">
              <Label htmlFor="bulk-subject" className="text-slate-900 dark:text-white">Subject Line</Label>
              <Input
                id="bulk-subject"
                value={bulkEmailConfig.subject}
                onChange={(e) => setBulkEmailConfig({...bulkEmailConfig, subject: e.target.value})}
                placeholder="Enter email subject..."
                className="bg-white dark:bg-slate-900"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-2">
              <Label htmlFor="bulk-message" className="text-slate-900 dark:text-white">Message</Label>
              <Textarea
                id="bulk-message"
                value={bulkEmailConfig.message}
                onChange={(e) => setBulkEmailConfig({...bulkEmailConfig, message: e.target.value})}
                placeholder="Enter your message..."
                rows={8}
                className="bg-white dark:bg-slate-900 resize-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Available variables: {'{name}'}, {'{email}'}, {'{registrationId}'}, {'{institution}'}
              </p>
            </div>

            {/* Preview Info */}
            {bulkEmailConfig.subject && bulkEmailConfig.message && (
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-slate-700 dark:text-slate-300">
                  <strong>Ready to send!</strong> Your bulk email is configured and ready to be sent to {selectedRegistrations.length} recipient{selectedRegistrations.length !== 1 ? 's' : ''}.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBulkEmailOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!bulkEmailConfig.subject || !bulkEmailConfig.message) {
                  toast({
                    title: "Missing Information",
                    description: "Please fill in both subject and message",
                    variant: "destructive"
                  })
                  return
                }

                toast({
                  title: "Sending Bulk Emails...",
                  description: `Preparing to send emails to ${selectedRegistrations.length} recipients`,
                })

                let successCount = 0
                let failCount = 0

                for (const regId of selectedRegistrations) {
                  const registration = registrations.find(r => r._id === regId)
                  if (!registration) continue

                  try {
                    const response = await fetch(`/api/admin/registrations/${regId}/send-email`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: bulkEmailConfig.template,
                        subject: bulkEmailConfig.subject,
                        message: bulkEmailConfig.message
                      })
                    })

                    if (response.ok) {
                      successCount++
                    } else {
                      failCount++
                    }
                  } catch (error) {
                    failCount++
                  }
                }

                toast({
                  title: successCount > 0 ? "✅ Bulk Email Sent" : "❌ Bulk Email Failed",
                  description: `Successfully sent: ${successCount}, Failed: ${failCount}`,
                  variant: failCount > 0 ? "destructive" : "default"
                })

                setSelectedRegistrations([])
                setIsBulkEmailOpen(false)
                setBulkEmailConfig({
                  template: 'custom',
                  subject: '',
                  message: '',
                  sendTo: 'selected'
                })
              }}
              disabled={!bulkEmailConfig.subject || !bulkEmailConfig.message}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedRegistrations.length} Recipient{selectedRegistrations.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
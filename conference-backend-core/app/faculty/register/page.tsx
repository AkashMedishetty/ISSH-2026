"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Label } from "../../../components/ui/label"
import { Checkbox } from "../../../components/ui/checkbox"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Navigation } from "../../../components/Navigation"
import { CheckCircle, Loader2, AlertCircle, Eye, EyeOff, GraduationCap, UserPlus, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { conferenceConfig } from "../../../config/conference.config"

const TITLES = conferenceConfig.registration.formFields.titles
const RELATIONSHIP_TYPES = conferenceConfig.registration.formFields.relationshipTypes

export default function FacultyRegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailCheckTimeout, setEmailCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  const [formData, setFormData] = useState({
    title: "Dr.",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    password: "",
    confirmPassword: "",
    institution: "",
    mciNumber: "",
    specialization: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    dietaryRequirements: "",
    specialNeeds: "",
    accompanyingPersons: [] as Array<{ name: string; age: number; relationship: string; dietaryRequirements?: string }>,
    agreeTerms: false,
  })

  useEffect(() => {
    document.title = `Faculty Registration | ${conferenceConfig.shortName}`
    return () => { if (emailCheckTimeout) clearTimeout(emailCheckTimeout) }
  }, [emailCheckTimeout])

  const checkEmailUniqueness = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return
    setIsCheckingEmail(true)
    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (response.ok) {
        const result = await response.json()
        setEmailAvailable(result.available)
        if (!result.available) toast.error("This email is already registered.")
      }
    } catch {} finally { setIsCheckingEmail(false) }
  }, [])

  const handleEmailChange = useCallback((email: string) => {
    setFormData(prev => ({ ...prev, email: email.toLowerCase() }))
    setEmailAvailable(null)
    if (emailCheckTimeout) clearTimeout(emailCheckTimeout)
    if (email.includes("@") && email.includes(".")) {
      const t = setTimeout(() => checkEmailUniqueness(email), 1000)
      setEmailCheckTimeout(t)
    }
  }, [emailCheckTimeout, checkEmailUniqueness])

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const addAccompanyingPerson = () => {
    if (formData.accompanyingPersons.length >= (conferenceConfig.registration.maxAccompanyingPersons || 3)) {
      toast.error(`Maximum ${conferenceConfig.registration.maxAccompanyingPersons || 3} accompanying persons allowed`)
      return
    }
    setFormData(prev => ({
      ...prev,
      accompanyingPersons: [...prev.accompanyingPersons, { name: "", age: 0, relationship: "Spouse" }],
    }))
  }

  const removeAccompanyingPerson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.filter((_, i) => i !== index),
    }))
  }

  const updateAccompanyingPerson = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      accompanyingPersons: prev.accompanyingPersons.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }))
  }

  const validate = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) { toast.error("First and last name are required"); return false }
    if (!formData.email.trim() || emailAvailable === false) { toast.error("Valid email is required"); return false }
    if (!formData.phone.trim() || !/^[0-9]{10}$/.test(formData.phone)) { toast.error("Valid 10-digit phone required"); return false }
    if (!formData.institution.trim()) { toast.error("Institution is required"); return false }
    if (!formData.mciNumber.trim()) { toast.error("MCI/NMC number is required"); return false }
    if (!formData.password || formData.password.length < 8) { toast.error("Password must be at least 8 characters"); return false }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match"); return false }
    if (!formData.city.trim() || !formData.state.trim()) { toast.error("City and state are required"); return false }
    if (!formData.agreeTerms) { toast.error("Please agree to the terms"); return false }
    for (const p of formData.accompanyingPersons) {
      if (!p.name.trim()) { toast.error("All accompanying person names are required"); return false }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/faculty/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Faculty registration successful!")
        setSubmissionData(data.data)
        setIsSubmitted(true)
      } else {
        toast.error(data.message || "Registration failed")
      }
    } catch {
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center p-8 lg:p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Faculty Registration Complete!</h2>
          {submissionData && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
                <p><strong>Registration ID:</strong> {submissionData.registrationId}</p>
                <p><strong>Name:</strong> {submissionData.name}</p>
                <p><strong>Type:</strong> Faculty (Invited)</p>
              </div>
            </div>
          )}
          {submissionData?.accompanyingPersonsCharge > 0 && (
            <Alert className="mb-6 text-left bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Payment Required for Accompanying Persons:</strong> ₹{submissionData.accompanyingPersonsCharge.toLocaleString()} (+ GST). Please login to complete payment.
              </AlertDescription>
            </Alert>
          )}
          <p className="text-gray-600 dark:text-gray-300 mb-2">Your registration as faculty is confirmed.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">📧 A confirmation email has been sent.</p>
          <div className="flex flex-col gap-3">
            <Link href="/auth/login"><Button className="w-full bg-green-600 hover:bg-green-700">Login to Dashboard</Button></Link>
            <Link href="/"><Button variant="outline" className="w-full">Go Home</Button></Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="pt-24 pb-12">
        {/* Header */}
        <section className="py-12 bg-gradient-to-r from-[#25406b] to-[#152843] text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <GraduationCap className="w-5 h-5 mr-2" />
                <span className="font-semibold">Faculty Registration</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Faculty Registration</h1>
              <p className="text-lg text-blue-200 max-w-2xl mx-auto">
                Complimentary registration for invited faculty members of {conferenceConfig.shortName}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
              <Card className="bg-white dark:bg-gray-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#25406b]" />
                    Faculty Registration Form
                  </CardTitle>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Registration is <strong>free</strong> for faculty members. Accompanying persons, if any, will be charged at the standard rate.
                    </AlertDescription>
                  </Alert>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2">Personal Information</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <Label>Title</Label>
                          <Select value={formData.title} onValueChange={(v) => updateField("title", v)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>{TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Label>First Name <span className="text-red-500">*</span></Label>
                          <Input value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="First name" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Last Name <span className="text-red-500">*</span></Label>
                          <Input value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Last name" className="mt-1" />
                        </div>
                        <div>
                          <Label>Age</Label>
                          <Input type="number" value={formData.age} onChange={(e) => updateField("age", e.target.value)} placeholder="Age" min="18" max="100" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Email <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type="email" value={formData.email} onChange={(e) => handleEmailChange(e.target.value)} placeholder="email@example.com" className={`pr-10 ${emailAvailable === false ? "border-red-500" : emailAvailable === true ? "border-green-500" : ""}`} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isCheckingEmail && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                              {!isCheckingEmail && emailAvailable === true && <CheckCircle className="w-4 h-4 text-green-500" />}
                              {!isCheckingEmail && emailAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label>Phone <span className="text-red-500">*</span></Label>
                          <Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile" maxLength={10} className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Institution <span className="text-red-500">*</span></Label>
                          <Input value={formData.institution} onChange={(e) => updateField("institution", e.target.value)} placeholder="Your institution" className="mt-1" />
                        </div>
                        <div>
                          <Label>MCI/NMC Number <span className="text-red-500">*</span></Label>
                          <Input value={formData.mciNumber} onChange={(e) => updateField("mciNumber", e.target.value)} placeholder="Registration number" className="mt-1" />
                        </div>
                      </div>
                      <div>
                        <Label>Specialization</Label>
                        <Input value={formData.specialization} onChange={(e) => updateField("specialization", e.target.value)} placeholder="e.g., Hand Surgery" className="mt-1" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> Create Password</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Password <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateField("password", e.target.value)} placeholder="Min 8 characters" className="pr-10" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <Label>Confirm Password <span className="text-red-500">*</span></Label>
                          <div className="relative mt-1">
                            <Input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} placeholder="Re-enter password" className="pr-10" />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-800 dark:text-white border-b pb-2">Address</h3>
                      <Input value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address" />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>City <span className="text-red-500">*</span></Label>
                          <Input value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" className="mt-1" />
                        </div>
                        <div>
                          <Label>State <span className="text-red-500">*</span></Label>
                          <Input value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" className="mt-1" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input value={formData.country} onChange={(e) => updateField("country", e.target.value)} placeholder="Country" />
                        <Input value={formData.pincode} onChange={(e) => updateField("pincode", e.target.value)} placeholder="Pincode" />
                      </div>
                    </div>

                    {/* Accompanying Persons */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">Accompanying Persons</h3>
                        <Button type="button" variant="outline" size="sm" onClick={addAccompanyingPerson}>+ Add Person</Button>
                      </div>
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                        ⚠️ Accompanying persons are chargeable at the standard rate. Payment will be required after registration.
                      </p>
                      {formData.accompanyingPersons.map((person, idx) => (
                        <div key={idx} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm">Person {idx + 1}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeAccompanyingPerson(idx)} className="text-red-500 h-8">Remove</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                              <Label>Name <span className="text-red-500">*</span></Label>
                              <Input value={person.name} onChange={(e) => updateAccompanyingPerson(idx, "name", e.target.value)} placeholder="Full name" className="mt-1" />
                            </div>
                            <div>
                              <Label>Age</Label>
                              <Input type="number" value={person.age || ""} onChange={(e) => updateAccompanyingPerson(idx, "age", parseInt(e.target.value) || 0)} placeholder="Age" min="0" className="mt-1" />
                            </div>
                            <div>
                              <Label>Relationship</Label>
                              <Select value={person.relationship} onValueChange={(v) => updateAccompanyingPerson(idx, "relationship", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{RELATIONSHIP_TYPES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dietary & Special Needs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dietary Requirements</Label>
                        <Select value={formData.dietaryRequirements} onValueChange={(v) => updateField("dietaryRequirements", v)}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select if any" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian</SelectItem>
                            <SelectItem value="vegan">Vegan</SelectItem>
                            <SelectItem value="halal">Halal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Special Needs</Label>
                        <Input value={formData.specialNeeds} onChange={(e) => updateField("specialNeeds", e.target.value)} placeholder="Any special requirements" className="mt-1" />
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="flex items-start gap-3 pt-4 border-t">
                      <Checkbox id="terms" checked={formData.agreeTerms} onCheckedChange={(checked) => updateField("agreeTerms", checked as boolean)} />
                      <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        I agree to the <Link href="/terms-conditions" className="text-[#25406b] hover:underline" target="_blank">Terms</Link> and <Link href="/privacy-policy" className="text-[#25406b] hover:underline" target="_blank">Privacy Policy</Link>
                      </label>
                    </div>

                    <Button type="submit" className="w-full bg-[#25406b] hover:bg-[#1d3357] py-6 text-lg" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><GraduationCap className="w-5 h-5 mr-2" />Complete Faculty Registration</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}

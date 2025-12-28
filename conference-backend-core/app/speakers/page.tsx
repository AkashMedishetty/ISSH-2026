"use client"

import { motion } from "framer-motion"
import { Navigation } from "../../components/Navigation"
import { conferenceConfig } from "../../config/conference.config"
import { Award, Mail, Linkedin } from "lucide-react"

export default function SpeakersPage() {
  // Placeholder speakers - can be moved to config later
  const speakers = [
    {
      name: "Dr. Rajesh Kumar",
      title: "Chief of Neurosurgery",
      institution: "AIIMS, New Delhi",
      specialty: "Cerebrovascular Surgery",
      image: "/images/speakers/speaker1.jpg",
      bio: "Leading expert in cerebrovascular surgery with over 20 years of experience."
    },
    {
      name: "Dr. Priya Sharma",
      title: "Professor of Neurology",
      institution: "NIMHANS, Bangalore",
      specialty: "Stroke Management",
      image: "/images/speakers/speaker2.jpg",
      bio: "Renowned neurologist specializing in acute stroke care and rehabilitation."
    },
    {
      name: "Dr. Amit Patel",
      title: "Director, Neurointerventional",
      institution: "Apollo Hospitals, Mumbai",
      specialty: "Endovascular Therapy",
      image: "/images/speakers/speaker3.jpg",
      bio: "Pioneer in endovascular treatment of cerebrovascular diseases."
    },
    {
      name: "Dr. Sunita Reddy",
      title: "Head of Neurocritical Care",
      institution: "Yashoda Hospitals, Hyderabad",
      specialty: "Neurocritical Care",
      image: "/images/speakers/speaker4.jpg",
      bio: "Expert in managing critically ill neurovascular patients."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Featured Speakers
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn from leading experts in cerebrovascular medicine
            </p>
          </div>

          {/* Speakers Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {speakers.map((speaker, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Speaker Image Placeholder */}
                <div className="h-64 bg-gradient-to-br from-conference-primary to-conference-accent flex items-center justify-center">
                  <Award className="w-24 h-24 text-white opacity-50" />
                </div>

                {/* Speaker Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {speaker.name}
                  </h3>
                  <p className="text-conference-primary font-semibold mb-2">
                    {speaker.title}
                  </p>
                  <p className="text-gray-600 text-sm mb-3">
                    {speaker.institution}
                  </p>
                  <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 mb-4">
                    {speaker.specialty}
                  </div>
                  <p className="text-gray-700 text-sm mb-4">
                    {speaker.bio}
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex space-x-3">
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                      <Linkedin className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Want to be a Speaker?
            </h2>
            <p className="text-gray-600 mb-6">
              We're always looking for experts to share their knowledge. Submit your proposal today!
            </p>
            <button className="bg-conference-primary text-white px-8 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity">
              Submit Proposal
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

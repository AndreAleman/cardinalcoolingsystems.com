"use client"

import { useState, useRef } from "react"
import { ArrowRight } from "lucide-react"
import { captureEvent, identifyUser } from "@lib/util/posthog"

declare global {
  interface Window {
    dataLayer: any[]
  }
}

type FormData = {
  name: string
  lastName: string
  email: string
  phone: string
  message: string
  projectType: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    projectType: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      projectType: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!
        },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          projectType: formData.projectType
        })
      })

      if (response.ok) {
        // ✅ Track successful home page contact form submission
        if (typeof window !== 'undefined') {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: 'contact_form_submit',
            form_type: 'homepage_contact',
            user_email: formData.email,
            form_location: 'homepage',
            project_type: formData.projectType
          })
        }

        // PostHog: track the form conversion and identify the lead by email
        captureEvent('form_submitted', {
          form_type: 'homepage_contact',
          form_location: 'homepage',
          project_type: formData.projectType,
          email: formData.email,
        })
        identifyUser(formData.email, {
          email: formData.email,
          first_name: formData.name,
          last_name: formData.lastName,
          phone: formData.phone,
          lead_project_type: formData.projectType,
        })

        setSubmitStatus('success')
        setFormData({
          name: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
          projectType: ""
        })
        formRef.current?.reset()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="py-24 px-6 relative bg-blue-50">
      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-slate-900 font-medium tracking-tight mb-6">
            Initialize Project.
          </h2>
          <p className="text-slate-500 text-lg font-light">
            Discuss your cooling infrastructure requirements with our engineering team.
          </p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-sm text-green-800 text-sm">
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-800 text-sm">
            Sorry, there was an error sending your message. Please try again.
          </div>
        )}

        {/* Contact Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          
          {/* Row 1: Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                First Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="First Name"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400 rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400 rounded-sm"
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Work Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@company.com"
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400 rounded-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Phone <span className="text-slate-400 normal-case">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(555) 123-4567"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400 rounded-sm"
              />
            </div>
          </div>

          {/* Row 3: Project Type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              Project Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value="industrial"
                  checked={formData.projectType === "industrial"}
                  onChange={() => handleRadioChange("industrial")}
                  className="peer sr-only"
                />
                <div className="w-full border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 peer-checked:border-teal-500 peer-checked:text-teal-600 peer-checked:bg-teal-50 transition-all hover:bg-white rounded-sm">
                  Industrial
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value="data-center"
                  checked={formData.projectType === "data-center"}
                  onChange={() => handleRadioChange("data-center")}
                  className="peer sr-only"
                />
                <div className="w-full border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 peer-checked:border-red-500 peer-checked:text-red-600 peer-checked:bg-red-50 transition-all hover:bg-white rounded-sm">
                  Data Center
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="projectType"
                  value="food-sanitary"
                  checked={formData.projectType === "food-sanitary"}
                  onChange={() => handleRadioChange("food-sanitary")}
                  className="peer sr-only"
                />
                <div className="w-full border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 peer-checked:border-orange-500 peer-checked:text-orange-600 peer-checked:bg-orange-50 transition-all hover:bg-white rounded-sm">
                  Food / Sanitary
                </div>
              </label>
            </div>
          </div>

          {/* Row 4: Message/Specifications */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-xs font-medium text-slate-500 uppercase tracking-widest">
              Specifications
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Details regarding pressure, fittings, and estimated quantity..."
              required
              rows={6}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors placeholder-slate-400 resize-none rounded-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white font-medium py-4 px-8 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 rounded-sm shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Submit Request'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-wider">
              Cardinal Cooling Systems ensures NDA compliance.
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}

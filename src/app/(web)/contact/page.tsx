// app/contact/page.tsx
import { Metadata } from 'next'
import ContactSection from '@/components/ContactSection'

export const metadata: Metadata = {
  title: 'Contact Us - Puni POS',
  description: 'Get in touch with Puni POS team for support, questions, or business inquiries.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* <div className="bg-gradient-to-br from-indigo-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-gray-600">
            We're here to help. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </div> */}
      <ContactSection />
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600">mapunia.com@gmail.com</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600">+62 87862175374</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Hours</h3>
              <p className="text-gray-600">Mon-Fri: 9AM-6PM EST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// app/privacy/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Puni POS',
  description: 'Privacy policy for Puni POS - Modern Point of Sale System',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: October 4, 2025
        </p>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
        <p className="text-gray-600 mb-6">
          We collect information you provide directly to us, such as when you create an account, 
          use our services, or contact us for support. This may include your name, email address, 
          business information, and payment details.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. How We Use Your Information</h2>
        <p className="text-gray-600 mb-6">
          We use the information we collect to provide, maintain, and improve our services, 
          process transactions, send you technical notices and support messages, and communicate 
          with you about products, services, and events.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Security</h2>
        <p className="text-gray-600 mb-6">
          We implement appropriate technical and organizational security measures to protect 
          your personal information against unauthorized access, alteration, disclosure, or destruction.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Third-Party Services</h2>
        <p className="text-gray-600 mb-6">
          We do not sell, trade, or otherwise transfer your personal information to third parties 
          without your consent, except as described in this policy or as required by law.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
        <p className="text-gray-600 mb-6">
          You have the right to access, update, or delete your personal information. You may also 
          opt out of receiving promotional communications from us at any time.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
        <p className="text-gray-600">
          If you have any questions about this Privacy Policy, please contact us at 
          mapunia.com@gmail.com or through our contact form.
        </p>
      </div>
    </div>
  )
}
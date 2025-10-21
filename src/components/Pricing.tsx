// components/Pricing.tsx
'use client'

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Start free, upgrade when you need
          </p>
        </div>
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Plan</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-indigo-600">$0</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 100 products
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Basic inventory management
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Sales reports
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Email support
                </li>
              </ul>
              <a href="/register" className="btn-primary w-full">
                Get Started Free
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
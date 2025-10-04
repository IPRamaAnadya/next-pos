// components/BusinessFeatures.tsx
'use client'

interface Feature {
  title: string
  description: string
  icon: string
}

export default function BusinessFeatures() {
  const features: Feature[] = [
    {
      title: "Suitable For All Types Businesses",
      description: "From restaurants to retail stores, our POS adapts to your business needs",
      icon: "🏪"
    },
    {
      title: "Cost Effective With Affordable Price",
      description: "Get enterprise-level features without breaking the bank",
      icon: "💰"
    },
    {
      title: "Easy to Setup & No IT knowledge Need",
      description: "Start selling in minutes with our intuitive setup process",
      icon: "⚡"
    },
    {
      title: "Modern & Attractive User Dashboard",
      description: "Beautiful, responsive interface that your team will love to use",
      icon: "📊"
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Puni POS?
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to manage your business efficiently
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
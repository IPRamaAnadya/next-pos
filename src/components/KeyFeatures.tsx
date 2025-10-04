// components/KeyFeatures.tsx
'use client'

import Image from 'next/image'

interface KeyFeature {
  title: string
  description: string
  image: string
}

export default function KeyFeatures() {
  const keyFeatures: KeyFeature[] = [
    {
      title: "Inventory Management",
      description: "Track stock levels, manage suppliers, and get low-stock alerts in real-time",
      image: "https://images.unsplash.com/photo-1721937718756-3bfec49f42a2?q=80&w=737&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Sales & Payment Process",
      description: "Accept multiple payment methods, process refunds, and manage transactions seamlessly",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Report and Analysis",
      description: "Get detailed insights with comprehensive sales reports and analytics dashboard",
      image: "https://images.unsplash.com/photo-1560221328-12fe60f83ab8?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Multi Tenant",
      description: "Manage multiple stores or locations from a single dashboard with ease",
      image: "https://images.unsplash.com/photo-1575193506520-45ff0a377fb8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Key Features
          </h2>
          <p className="text-xl text-gray-600">
            Powerful tools to streamline your business operations
          </p>
        </div>
        <div className="space-y-20">
          {keyFeatures.map((feature, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}>
              <div className="flex-1">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={400}
                  height={300}
                  className="rounded-lg shadow-lg aspect-[4/3] object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
// components/UserFeatures.tsx
'use client'

interface UserType {
  name: string
  description: string
  icon: string
}

export default function UserFeatures() {
  const userTypes: UserType[] = [
    {
      name: "Restaurants",
      description: "Manage orders, track tables, and streamline kitchen operations",
      icon: "🍽️"
    },
    {
      name: "Laundry",
      description: "Track orders, manage pickup/delivery, and monitor cleaning status",
      icon: "👕"
    },
    {
      name: "Salon & Spa",
      description: "Book appointments, manage staff schedules, and track services",
      icon: "💅"
    },
    {
      name: "Retail Stores",
      description: "Manage inventory, process sales, and track customer data",
      icon: "🛍️"
    },
    {
      name: "Cafes",
      description: "Quick order processing, table management, and menu customization",
      icon: "☕"
    },
    {
      name: "And More",
      description: "Flexible system that adapts to any business type",
      icon: "✨"
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Perfect For Your Business
          </h2>
          <p className="text-xl text-gray-600">
            Trusted by various industries worldwide
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userTypes.map((user, index) => (
            <div key={index} className="p-6 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200">
              <div className="text-4xl mb-4">{user.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h3>
              <p className="text-gray-600">{user.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
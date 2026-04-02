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
      name: "Restoran",
      description: "Kelola pesanan, lacak meja, dan sederhanakan operasional dapur",
      icon: "🍽️"
    },
    {
      name: "Laundry",
      description: "Lacak pesanan, kelola pickup/delivery, dan monitor status pencucian",
      icon: "👕"
    },
    {
      name: "Salon & Spa",
      description: "Booking appointment, kelola jadwal staff, dan lacak layanan",
      icon: "💅"
    },
    {
      name: "Toko Retail",
      description: "Kelola inventori, proses penjualan, dan lacak data pelanggan",
      icon: "🛍️"
    },
    {
      name: "Kafe",
      description: "Proses pesanan cepat, kelola meja, dan kustomisasi menu",
      icon: "☕"
    },
    {
      name: "Dan Lainnya",
      description: "Sistem fleksibel yang dapat disesuaikan dengan berbagai jenis bisnis",
      icon: "✨"
    }
  ]

  return (
    <section className="py-20 md:py-32 bg-gray-50">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            Untuk semua jenis bisnis
          </h2>
          <p className="text-[19px] md:text-[21px] text-black/70">
            Dipercaya berbagai industri
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {userTypes.map((user, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 md:p-8">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">{user.icon}</div>
              <h3 className="text-[17px] md:text-[19px] font-semibold mb-2">{user.name}</h3>
              <p className="text-[13px] md:text-[15px] text-black/60 leading-relaxed">{user.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
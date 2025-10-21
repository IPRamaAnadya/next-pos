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
      title: "Cocok Untuk Semua Jenis Bisnis",
      description: "Dari restoran hingga toko ritel, POS kami beradaptasi dengan kebutuhan bisnis Anda",
      icon: "🏪"
    },
    {
      title: "Efektif Biaya dengan Harga Terjangkau",
      description: "Dapatkan fitur setara perusahaan tanpa menguras kantong",
      icon: "💰"
    },
    {
      title: "Mudah Diatur & Tidak Membutuhkan Pengetahuan IT",
      description: "Mulai berjualan dalam hitungan menit dengan proses pengaturan yang intuitif",
      icon: "⚡"
    },
    {
      title: "Dashboard Pengguna Modern & Menarik",
      description: "Antarmuka yang indah dan responsif yang akan disukai tim Anda",
      icon: "📊"
    }
  ]

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Kenapa Memilih Puni POS?
          </h2>
          <p className="text-xl text-gray-600">
            Semua yang Anda butuhkan untuk mengelola bisnis Anda dengan efisien
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
// components/BusinessFeatures.tsx
'use client'

import { Package, Heart, Sparkles, Rocket } from 'lucide-react'

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
}

export default function BusinessFeatures() {
  const features: Feature[] = [
    {
      title: "100% Gratis Selamanya",
      description: "Tidak ada biaya tersembunyi, tidak ada upsell. Akses penuh ke semua fitur tanpa batasan",
      icon: <Package className="w-7 h-7" />
    },
    {
      title: "Saling Membantu",
      description: "Donasi Anda membantu operasional dan mendukung UMKM yang membutuhkan",
      icon: <Heart className="w-7 h-7" />
    },
    {
      title: "Mudah Digunakan",
      description: "Antarmuka intuitif yang dapat digunakan siapa saja tanpa training khusus",
      icon: <Sparkles className="w-7 h-7" />
    },
    {
      title: "Fitur Lengkap",
      description: "Inventori, laporan, multi-user, notifikasi - semua yang Anda butuhkan",
      icon: <Rocket className="w-7 h-7" />
    }
  ]

  return (
    <section id="about" className="py-20 md:py-32 bg-white">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            Teknologi untuk semua.
          </h2>
          <p className="text-[19px] md:text-[21px] font-normal text-black/70 max-w-2xl mx-auto leading-relaxed">
            Setiap pelaku usaha berhak mendapatkan akses ke teknologi modern.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="group p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-black mb-4">{feature.icon}</div>
              <h3 className="text-[21px] font-semibold text-black mb-2">{feature.title}</h3>
              <p className="text-[17px] text-black/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
// components/KeyFeatures.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronUp } from 'lucide-react'

interface KeyFeature {
  id: string
  title: string
  description: string
  image: string
}

export default function KeyFeatures() {
  const keyFeatures: KeyFeature[] = [
    {
      id: "inventory",
      title: "Manajemen Inventaris",
      description: "Pantau stok secara real-time, kelola pemasok dengan mudah, dan dapatkan notifikasi otomatis saat stok menipis. Semua data inventori Anda tersinkronisasi di semua perangkat.",
      image: "https://images.unsplash.com/photo-1721937718756-3bfec49f42a2?q=80&w=737&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      id: "payment",
      title: "Penjualan & Pembayaran",
      description: "Terima berbagai metode pembayaran - tunai, transfer, QRIS, dan kartu. Proses transaksi cepat dengan antarmuka yang intuitif. Kelola pengembalian dan refund dengan mudah.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      id: "reports",
      title: "Laporan & Analisis",
      description: "Dapatkan wawasan mendalam tentang bisnis Anda dengan dashboard analitik yang komprehensif. Lihat tren penjualan, produk terlaris, dan performa toko dalam satu tampilan.",
      image: "https://images.unsplash.com/photo-1560221328-12fe60f83ab8?q=80&w=1174&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      id: "multitenant",
      title: "Multi Outlet",
      description: "Kelola beberapa lokasi toko dari satu dashboard terpusat. Monitor performa setiap outlet, transfer stok antar lokasi, dan sinkronkan data secara otomatis.",
      image: "https://images.unsplash.com/photo-1575193506520-45ff0a377fb8?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ]

  const [activeIndex, setActiveIndex] = useState(1)

  const toggleAccordion = (index: number) => {
    setActiveIndex(index)
  }

  return (
    <section id="features" className="relative py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-[980px] mx-auto px-6">
        {/* Header */}
        <header className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1]">
            Fitur lengkap untuk bisnis Anda
          </h2>
        </header>

        {/* Accordion Container */}
        <div className="relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left: Accordion List */}
            <div className="order-2 lg:order-1">
              <ul className="space-y-0">
                {keyFeatures.map((feature, index) => (
                  <li key={feature.id} className="border-b border-gray-200 last:border-b-0">
                    <div>
                      <button
                        onClick={() => toggleAccordion(index)}
                        className={`w-full text-left py-5 md:py-6 flex items-center justify-between group transition-colors ${
                          activeIndex === index ? 'text-black' : 'text-black/40 hover:text-black/60'
                        }`}
                        aria-expanded={activeIndex === index}
                      >
                        <span className="text-[19px] md:text-[24px] font-semibold pr-4">
                          {feature.title}
                        </span>
                        <ChevronUp
                          className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 transition-transform duration-300 ${
                            activeIndex === index ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      {/* Accordion Content */}
                      <div
                        className={`overflow-hidden transition-all duration-400 ease-in-out ${
                          activeIndex === index ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="pb-6">
                          <div className="lg:hidden mb-4">
                            <Image
                              src={feature.image}
                              alt={feature.title}
                              width={600}
                              height={800}
                              className="w-full rounded-2xl shadow-lg"
                            />
                          </div>
                          <p className="text-[15px] md:text-[17px] text-black/70 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Large Image (Desktop Only) */}
            <div className="order-1 lg:order-2 hidden lg:block relative">
              <div className="sticky top-24">
                {keyFeatures.map((feature, index) => (
                  <div
                    key={feature.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      activeIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={600}
                      height={800}
                      className="w-full rounded-2xl shadow-2xl"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

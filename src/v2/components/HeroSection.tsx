// components/HeroSection.tsx
'use client'

import Image from 'next/image'
import { ChevronRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative bg-black text-white pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black" />
      
      <div className="relative max-w-[980px] mx-auto px-6 text-center">
        <div className="mb-4">
          <span className="text-[14px] font-normal text-white/70 tracking-wide">
            Gratis selamanya. Untuk semua.
          </span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-[80px] font-semibold tracking-tighter leading-[1.05] mb-6">
          Sistem POS.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Untuk semua orang.
          </span>
        </h1>
        
        <p className="text-[19px] md:text-[21px] font-normal text-white/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          Kelola bisnis dengan mudah. Gratis selamanya.
          <br className="hidden md:block" />
          Mari saling membantu kembangkan UMKM Indonesia.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <a 
            href='https://apps.apple.com/id/app/puni-pos/id6753197343' 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[17px] rounded-full transition-all"
          >
            Download untuk iOS
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 hover:border-white/50 text-white text-[17px] rounded-full transition-all"
          >
            Download untuk Android
          </a>
        </div>

        {/* Product Image */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1647427017067-8f33ccbae493?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Dashboard Puni POS"
              width={1400}
              height={800}
              className="w-full"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
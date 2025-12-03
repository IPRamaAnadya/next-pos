// components/Pricing.tsx
'use client'

import { Check } from 'lucide-react'

export default function Pricing() {
  return (
    <section id="donation" className="py-20 md:py-32 bg-white">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            100% Gratis.
            <br />
            <span className="text-black/60">Selamanya.</span>
          </h2>
          <p className="text-[19px] md:text-[21px] font-normal text-black/70 max-w-2xl mx-auto leading-relaxed">
            Semua fitur. Tanpa biaya. Tanpa batasan.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 mb-12">
            {/* Free Forever Card */}
            <div className="bg-gray-50 rounded-3xl p-8 md:p-10">
                <div className="mb-8">
                  <h3 className="text-[28px] font-semibold mb-2">Gratis Selamanya</h3>
                  <p className="text-[17px] text-black/60">Tidak ada biaya tersembunyi</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06c] mt-0.5" strokeWidth={3} />
                    <span className="text-[17px] text-black/80">Produk & inventori tanpa batas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06c] mt-0.5" strokeWidth={3} />
                    <span className="text-[17px] text-black/80">Multi-user & multi-tenant</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06c] mt-0.5" strokeWidth={3} />
                    <span className="text-[17px] text-black/80">Laporan lengkap & analytics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06c] mt-0.5" strokeWidth={3} />
                    <span className="text-[17px] text-black/80">Notifikasi real-time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-[#06c] mt-0.5" strokeWidth={3} />
                    <span className="text-[17px] text-black/80">Update berkelanjutan</span>
                  </li>
                </ul>
                <a href="/register" className="block w-full text-center px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[17px] rounded-full transition-all">
                  Mulai Gratis
                </a>
            </div>

            {/* Donation Card */}
            <div className="bg-gray-50 rounded-3xl p-8 md:p-10">
                <div className="mb-8">
                  <h3 className="text-[28px] font-semibold mb-2">Donasi Sukarela</h3>
                  <p className="text-[17px] text-black/60">Membantu sesama UMKM</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-[17px] text-black/80">💻 Server & operasional platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[17px] text-black/80">✨ Pengembangan fitur baru</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[17px] text-black/80">❤️ Bantu UMKM yang membutuhkan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[17px] text-black/80">🎓 Edukasi & pelatihan gratis</span>
                  </li>
                </ul>
                <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200">
                  <p className="text-[14px] text-black/60 text-center">
                    <strong>Catatan:</strong> Semua fitur tetap 100% gratis tanpa donasi.
                  </p>
                </div>
                <a href="/donation" className="block w-full text-center px-6 py-3 border border-black/20 hover:border-black/40 text-black text-[17px] rounded-full transition-all">
                  Donasi Sekarang
                </a>
            </div>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center py-12">
            <div>
              <div className="text-[40px] font-semibold mb-1">1000+</div>
              <div className="text-[14px] text-black/60">Pengguna Aktif</div>
            </div>
            <div>
              <div className="text-[40px] font-semibold mb-1">100%</div>
              <div className="text-[14px] text-black/60">Gratis Selamanya</div>
            </div>
            <div>
              <div className="text-[40px] font-semibold mb-1">50+</div>
              <div className="text-[14px] text-black/60">UMKM Terbantu</div>
            </div>
            <div>
              <div className="text-[40px] font-semibold mb-1">24/7</div>
              <div className="text-[14px] text-black/60">Tersedia Kapan Saja</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
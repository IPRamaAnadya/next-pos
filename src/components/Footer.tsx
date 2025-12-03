// components/Footer.tsx
'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] text-black">
      <div className="max-w-[980px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12 mb-8 text-[12px]">
          <div>
            <h4 className="font-semibold mb-3">Produk</h4>
            <ul className="space-y-2">
              <li><Link href="#features" className="text-black/60 hover:text-black transition-colors">Fitur</Link></li>
              <li><Link href="#donation" className="text-black/60 hover:text-black transition-colors">Donasi</Link></li>
              <li><Link href="#about" className="text-black/60 hover:text-black transition-colors">Tentang</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Download</h4>
            <ul className="space-y-2">
              <li><a href="https://apps.apple.com/id/app/puni-pos/id6753197343" className="text-black/60 hover:text-black transition-colors">App Store</a></li>
              <li><a href="#" className="text-black/60 hover:text-black transition-colors">Google Play</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-black/60 hover:text-black transition-colors">Privasi</Link></li>
              <li><Link href="/bantuan" className="text-black/60 hover:text-black transition-colors">Bantuan</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-black/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-black/60">
            <p>
              © 2024 Puni POS. Dibuat dengan ❤️ oleh IP Rama untuk UMKM Indonesia.
            </p>
            <p>100% Gratis Selamanya</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
// components/Footer.tsx
'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">Puni POS</h3>
            <p className="text-gray-400">
              Sistem POS modern untuk semua jenis bisnis. Sederhana, terjangkau, dan bertenaga.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Produk</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#features" className="hover:text-white transition-colors duration-200">Fitur</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors duration-200">Harga</Link></li>
              <li><Link href="#reviews" className="hover:text-white transition-colors duration-200">Ulasan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Perusahaan</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/contact" className="hover:text-white transition-colors duration-200">Kontak</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors duration-200">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors duration-200">Syarat dan Ketentuan</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Hubungi Kami</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors duration-200">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors duration-200">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Puni POS. Hak cipta dilindungi.</p>
        </div>
      </div>
    </footer>
  )
}
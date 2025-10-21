// components/Navbar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

interface MenuItem {
  label: string
  href: string
}

interface NavbarProps {
  logo?: string
  appName?: string
  menus?: MenuItem[]
}

export default function Navbar({ 
  logo = '/images/logo.png',
  appName = 'Puni POS',
  menus = [
    { label: 'Fitur', href: '/#Fitur' },
    { label: 'Harga', href: '/#Harga' },
    { label: 'Ulasan', href: '/#Ulasan' },
    { label: 'Kontak', href: '/#Kontak' },
  ]
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-shadow-gray-800 flex items-center space-x-2">
              <img src={logo} alt={appName} className="h-8" />
              {/* {appName} */}
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menus.map((menu, index) => (
              <Link
                key={index}
                href={menu.href}
                className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
              >
                {menu.label}
              </Link>
            ))}
            <Link href="/privacy" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">
              Privasi
            </Link>
            <Link href="/bantuan" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200">
              Bantuan
            </Link>
            <Link href="/register" className="btn-primary  hover:text-indigo-600 transition-colors duration-200">
              Daftar
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-indigo-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {menus.map((menu, index) => (
                <Link
                  key={index}
                  href={menu.href}
                  className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {menu.label}
                </Link>
              ))}
              <Link href="/" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                Privasi
              </Link>
              <Link href="/" className="block px-3 py-2">
                <span className="btn-primary w-full text-center">Hubungi Kami</span>
              </Link>
              <Link href="/bantuan" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                Bantuan
              </Link>
              <Link href="/register" className="block px-3 py-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                Daftar
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
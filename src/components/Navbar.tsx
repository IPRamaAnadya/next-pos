// components/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
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
    { label: 'Fitur', href: '/#features' },
    { label: 'Donasi', href: '/#donation' },
    { label: 'Tentang', href: '/#about' },
  ]
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/70 backdrop-blur-2xl shadow-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-[980px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className={`text-[21px] font-semibold tracking-tight transition-colors ${
              scrolled ? 'text-black hover:text-gray-600' : 'text-white hover:text-white/80'
            }`}>
              {appName}
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menus.map((menu, index) => (
              <Link
                key={index}
                href={menu.href}
                className={`text-[12px] font-normal transition-colors tracking-wide ${
                  scrolled ? 'text-black/80 hover:text-black' : 'text-white/90 hover:text-white'
                }`}
              >
                {menu.label}
              </Link>
            ))}
            <Link 
              href="/register" 
              className="text-[12px] font-normal px-4 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full transition-all"
            >
              Mulai Gratis
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 focus:outline-none transition-colors ${
                scrolled ? 'text-black hover:text-gray-600' : 'text-white hover:text-white/80'
              }`}
              aria-label="Menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-6 pt-2">
            <div className="space-y-1">
              {menus.map((menu, index) => (
                <Link
                  key={index}
                  href={menu.href}
                  className="block px-3 py-2.5 text-[14px] text-black/80 hover:text-black transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {menu.label}
                </Link>
              ))}
              <Link href="/register" className="block pt-4" onClick={() => setIsOpen(false)}>
                <span className="block w-full text-center px-6 py-2.5 bg-[#0071e3] text-white text-[14px] rounded-full">Mulai Gratis</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
// components/ContactSection.tsx
'use client'

import { useState } from 'react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = '6287862175374';
    const text = `Formulir Kontak\nNama: ${formData.name}\nEmail: ${formData.email}\nPesan: ${formData.message}`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="contact" className="py-20 md:py-32 bg-white">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            Hubungi kami
          </h2>
          <p className="text-[19px] md:text-[21px] text-black/70">
            Ada pertanyaan? Kami siap membantu
          </p>
        </div>
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-[14px] font-medium mb-2">
                Nama
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[14px] font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-[14px] font-medium mb-2">
                Pesan
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[17px] focus:outline-none focus:ring-2 focus:ring-[#06c] focus:border-transparent transition-all resize-none"
                required
              />
            </div>
            <button type="submit" className="w-full px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[17px] rounded-full transition-all mt-6">
              Kirim Pesan
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
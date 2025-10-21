// components/QnA.tsx
'use client'

import { useState } from 'react'

interface FAQ {
  question: string
  answer: string
}

export default function QnA() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FAQ[] = [
    {
      question: "Apakah Puni POS benar-benar gratis?",
      answer: "Ya! Kami menawarkan paket gratis yang mencakup semua fitur dasar yang Anda butuhkan untuk memulai. Anda dapat meningkatkan ke paket premium saat bisnis Anda berkembang."
    },
    {
      question: "Apakah saya perlu pengetahuan teknis untuk mengatur Puni POS?",
      answer: "Tidak perlu pengetahuan teknis! Sistem kami dirancang agar mudah digunakan. Anda dapat mengatur semuanya hanya dalam beberapa menit dengan panduan langkah demi langkah kami."
    },
    {
      question: "Bisakah saya menggunakan Puni POS di beberapa perangkat?",
      answer: "Ya, Puni POS dapat digunakan di beberapa perangkat termasuk tablet dan smartphone. Anda dapat mengakses data Anda dari mana saja."
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xl text-gray-600">
            Semua yang perlu Anda ketahui tentang Puni POS
          </p>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <span className="text-indigo-600">
                  {openIndex === index ? '−' : '+'}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
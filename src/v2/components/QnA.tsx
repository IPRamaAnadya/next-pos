// components/QnA.tsx
'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

export default function QnA() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: FAQ[] = [
    {
      question: "Apakah Puni POS benar-benar gratis?",
      answer: "Ya, 100% gratis selamanya. Semua fitur tersedia tanpa biaya tersembunyi. Tidak ada upsell atau batasan waktu. Anda bisa menggunakan semua fitur profesional tanpa membayar sepeser pun."
    },
    {
      question: "Apakah saya perlu pengetahuan teknis?",
      answer: "Tidak perlu pengetahuan teknis sama sekali. Sistem kami dirancang sangat intuitif dan mudah digunakan. Anda dapat mengatur semuanya dalam beberapa menit dengan panduan yang jelas."
    },
    {
      question: "Bisakah digunakan di beberapa perangkat?",
      answer: "Ya, Puni POS dapat digunakan di smartphone, tablet, dan komputer. Data Anda tersinkronisasi secara otomatis di semua perangkat sehingga Anda dapat mengakses dari mana saja."
    },
    {
      question: "Bagaimana dengan keamanan data saya?",
      answer: "Data Anda diamankan dengan enkripsi tingkat enterprise. Kami menggunakan infrastruktur cloud yang andal dan backup otomatis untuk memastikan data Anda selalu aman."
    }
  ]

  return (
    <section className="py-20 md:py-32 bg-gray-50">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            Pertanyaan Umum
          </h2>
          <p className="text-[19px] md:text-[21px] text-black/70">
            Semua yang perlu Anda ketahui
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <button
                className="w-full py-6 text-left flex justify-between items-center group"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-[17px] md:text-[19px] font-semibold pr-8">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 text-black/40 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-[15px] md:text-[17px] text-black/70 leading-relaxed pb-6">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
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
      question: "Is Puni POS really free?",
      answer: "Yes! We offer a free plan that includes all basic features you need to get started. You can upgrade to premium plans as your business grows."
    },
    {
      question: "Do I need any technical knowledge to set up Puni POS?",
      answer: "No technical knowledge required! Our system is designed to be user-friendly. You can set up everything in just a few minutes with our step-by-step guide."
    },
    {
      question: "Can I use Puni POS on multiple devices?",
      answer: "Yes, Puni POS works on multiple devices including tablets and smartphones. You can access your data from anywhere."
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Puni POS
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
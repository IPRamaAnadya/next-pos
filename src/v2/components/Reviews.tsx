// components/Reviews.tsx
'use client'

import { Star } from 'lucide-react'

interface Review {
  name: string
  role: string
  company: string
  content: string
  rating: number
}

export default function Reviews() {
  const reviews: Review[] = [
    {
      name: "Tu Adi",
      role: "Pemilik Kafe",
      company: "Cafo Coffee",
      content: "Puni POS sangat membantu operasional kafe kami. Proses transaksi jadi lebih cepat dan laporan penjualan mudah dipantau.",
      rating: 5
    },
    {
      name: "Rama Anadya",
      role: "Manajer",
      company: "Toki Laundry",
      content: "Manajemen pelanggan dan pembayaran di Toki Laundry jadi lebih teratur berkat Puni POS. Sangat direkomendasikan untuk bisnis laundry.",
      rating: 5
    },
    {
      name: "Dek Ayu",
      role: "Pemilik",
      company: "Sedayu Laundry",
      content: "Fitur Puni POS memudahkan pencatatan transaksi dan stok. Pelanggan kami juga merasa puas dengan pelayanan yang lebih cepat.",
      rating: 5
    }
  ]

  return (
    <section id="reviews" className="py-20 md:py-32 bg-white">
      <div className="max-w-[980px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-[40px] md:text-[56px] font-semibold tracking-tight leading-[1.1] mb-4">
            Dipercaya ribuan UMKM
          </h2>
          <p className="text-[19px] md:text-[21px] text-black/70">
            Bergabunglah dengan komunitas yang saling membantu
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div key={index} className="bg-gray-50 rounded-3xl p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#06c] text-[#06c]" />
                ))}
              </div>
              <p className="text-[15px] md:text-[17px] text-black/80 leading-relaxed mb-8">"{review.content}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-black font-semibold text-sm">
                  {review.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-black">{review.name}</p>
                  <p className="text-[13px] text-black/60">{review.role}, {review.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
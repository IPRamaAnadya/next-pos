// components/Reviews.tsx
'use client'

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
    <section id="reviews" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of satisfied business owners
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <span key={i} className="text-orange-500">★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4 italic">"{review.content}"</p>
              <div>
                <p className="font-semibold text-gray-900">{review.name}</p>
                <p className="text-sm text-gray-500">{review.role}, {review.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
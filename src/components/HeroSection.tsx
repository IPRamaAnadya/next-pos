// components/HeroSection.tsx
'use client'

import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-indigo-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Modern POS System for{' '}
              <span className="text-indigo-600">Every Business</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamline your sales, manage inventory, and grow your business with Puni POS. 
              Easy to use, affordable, and packed with powerful features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="btn-primary flex items-center justify-center space-x-2">
                <Image 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/App_Store_%28iOS%29.svg/2048px-App_Store_%28iOS%29.svg.png" 
                  alt="App Store" 
                  width={24} 
                  height={24}
                />
                <span>Download on App Store</span>
              </button>
              <button className="btn-accent flex items-center justify-center space-x-2">
                <Image 
                  src="https://www.svgrepo.com/show/303178/google-play-store-logo.svg" 
                  alt="Google Play" 
                  width={24} 
                  height={24}
                />
                <span>Get it on Google Play</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <Image
              src="https://images.unsplash.com/photo-1647427017067-8f33ccbae493?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Puni POS Dashboard"
              width={600}
              height={400}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
// app/page.tsx
import { Metadata } from 'next'
import HeroSection from '@/components/HeroSection'
import BusinessFeatures from '@/components/BusinessFeatures'
import KeyFeatures from '@/components/KeyFeatures'
import UserFeatures from '@/components/UserFeatures'
import Pricing from '@/components/Pricing'
import Reviews from '@/components/Reviews'
import QnA from '@/components/QnA'
import ContactSection from '@/components/ContactSection'

export const metadata: Metadata = {
  title: 'Puni POS - Modern Point of Sale System',
  description: 'Modern POS system for all types of businesses. Easy setup, cost-effective, and feature-rich.',
}

export default function Home() {
  return (
    <>
      <HeroSection />
      <BusinessFeatures />
      <KeyFeatures />
      <UserFeatures />
      <Pricing />
      <Reviews />
      <QnA />
      <ContactSection />
    </>
  )
}
'use client';

import { motion } from 'framer-motion';
import { MapPin, Wifi, Users } from 'lucide-react';
import ViaHimalayaLogo from '@/components/ViaHimalayaLogo';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.via.himalaya';
// App Store listing isn't live yet — reuse the waitlist form link so interested users can still sign up.
const APP_STORE_URL = 'https://forms.gle/xuFRetvVHijtzcrd9';

function GooglePlayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
    </svg>
  );
}

export default function ComingSoonPage() {
  return (
    <div className="relative overflow-hidden bg-black min-h-screen">
      {/* Hero Section with Background */}
      <div
        className="w-full bg-cover bg-center bg-no-repeat relative hero-container"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/bg.jpg')`,
          height: '100dvh' // Dynamic viewport height for mobile, fallback to 100vh
        }}
      >
        {/* Header */}
        <header
          className="absolute top-0 left-0 right-0 z-10 flex justify-start items-center"
          style={{
            padding: 'max(env(safe-area-inset-top), 1rem) max(env(safe-area-inset-right), 1rem) 1rem max(env(safe-area-inset-left), 1rem)',
            paddingTop: 'max(env(safe-area-inset-top), 2vh)',
            paddingLeft: 'max(env(safe-area-inset-left), 4vw)',
            paddingRight: 'max(env(safe-area-inset-right), 4vw)'
          }}
        >
          <ViaHimalayaLogo size="small" showText={true} />
        </header>

        {/* Main Content - Constrained within safe viewport */}
        <main
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{
            paddingTop: 'max(env(safe-area-inset-top), 12vh)',
            paddingBottom: 'max(env(safe-area-inset-bottom), 12vh)',
            paddingLeft: 'max(env(safe-area-inset-left), 4vw)',
            paddingRight: 'max(env(safe-area-inset-right), 4vw)',
            minHeight: '0' // Allow flex shrinking
          }}
        >
          {/* Centerpiece Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-shrink-0"
            style={{ marginBottom: 'clamp(1rem, 3vh, 2rem)' }}
          >
            <ViaHimalayaLogo size="large" showText={false} animate={true} />
          </motion.div>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-white/90 leading-relaxed font-sans flex-shrink-0"
            style={{
              fontSize: 'clamp(0.9rem, 3vw, 1.5rem)',
              maxWidth: 'min(90vw, 50rem)',
              marginBottom: 'clamp(1.5rem, 4vh, 3rem)',
              lineHeight: '1.4'
            }}
          >
            High-precision, guide-verified offline trails for Himalayas most iconic treks.
          </motion.p>

          {/* Store Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 flex-shrink-0">
            {/* Google Play Button */}
            <motion.a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-300 font-medium font-sans flex items-center gap-2"
              style={{
                padding: 'clamp(0.75rem, 2vh, 1rem) clamp(1.25rem, 5vw, 2rem)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}
            >
              <GooglePlayIcon className="w-5 h-5 flex-shrink-0" />
              Get it on Google Play
            </motion.a>

            {/* App Store Button */}
            <motion.a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-300 font-medium font-sans flex items-center gap-2"
              style={{
                padding: 'clamp(0.75rem, 2vh, 1rem) clamp(1.25rem, 5vw, 2rem)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1rem)'
              }}
            >
              <AppleIcon className="w-5 h-5 flex-shrink-0" />
              <span className="flex flex-col items-start leading-tight">
                <span>App Store</span>
                <span className="text-white/60" style={{ fontSize: '0.7em' }}>Coming Soon</span>
              </span>
            </motion.a>
          </div>
        </main>
      </div>

      {/* Values Section */}
      <section className="relative z-10 bg-gradient-to-b from-black/80 to-black/90 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-sans">
              Built for the Indian Mountains
            </h2>
            <p className="text-base sm:text-lg text-white/70 max-w-2xl mx-auto font-sans px-4 sm:px-0">
              Every feature designed with the unique challenges of Himalayan trekking in mind.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Offline First */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-vh-green-dark/20 rounded-full flex items-center justify-center group-hover:bg-vh-green-dark/30 transition-colors">
                <Wifi className="w-8 h-8 text-vh-green-light" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-sans">Offline First</h3>
              <p className="text-white/70 leading-relaxed font-sans">
                Maps that work where signals don't. Download trails before you trek and navigate confidently in remote areas.
              </p>
            </motion.div>

            {/* Guide Verified */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-vh-green-dark/20 rounded-full flex items-center justify-center group-hover:bg-vh-green-dark/30 transition-colors">
                <MapPin className="w-8 h-8 text-vh-green-light" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-sans">Guide Verified</h3>
              <p className="text-white/70 leading-relaxed font-sans">
                No more "ghost trails"—every path is walked and verified by professional mountain guides and experienced trekkers.
              </p>
            </motion.div>

            {/* Community Driven */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-vh-green-dark/20 rounded-full flex items-center justify-center group-hover:bg-vh-green-dark/30 transition-colors">
                <Users className="w-8 h-8 text-vh-green-light" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-sans">Community Driven</h3>
              <p className="text-white/70 leading-relaxed font-sans">
                Built in India, for the Indian mountains. By trekkers, for trekkers who understand our unique terrain and challenges.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}

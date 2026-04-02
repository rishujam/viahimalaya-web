'use client';

import { motion } from 'framer-motion';
import { MapPin, Wifi, Users } from 'lucide-react';
import ViaHimalayaLogo from '@/components/ViaHimalayaLogo';

export default function ComingSoonPage() {
  const handleJoinWaitlist = () => {
    window.open('https://forms.gle/xuFRetvVHijtzcrd9', '_blank');
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section with Background */}
      <div
        className="w-full bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/bg.jpg')`,
          aspectRatio: '16/9'
        }}
      >
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-10 flex justify-start items-center p-4 sm:p-6 md:p-8">
          <ViaHimalayaLogo size="small" showText={true} />
        </header>

        {/* Main Content */}
        <main className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        {/* Centerpiece Logo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <ViaHimalayaLogo size="large" showText={false} animate={true} />
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight font-sans"
          style={{ fontWeight: 900 }}
        >
          COMING SOON
        </motion.h1>

        {/* Sub-heading */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8 max-w-4xl leading-relaxed -mt-2 sm:-mt-4 font-sans px-2"
        >
          High-precision, guide-verified offline trails for Himalayas most iconic treks.
        </motion.p>

        {/* Join Waitlist Button */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          onClick={handleJoinWaitlist}
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full hover:bg-white/20 transition-all duration-300 font-medium font-sans text-sm sm:text-base"
        >
          Join Waitlist
        </motion.button>

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

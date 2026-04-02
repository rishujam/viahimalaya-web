'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ViaHimalayaLogoProps {
  size?: 'small' | 'large';
  showText?: boolean;
  animate?: boolean;
}

export default function ViaHimalayaLogo({ 
  size = 'large', 
  showText = true, 
  animate = false 
}: ViaHimalayaLogoProps) {
  const logoSize = size === 'small' ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20';
  const textSize = size === 'small' ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl md:text-4xl';

  return (
    <motion.div 
      className="flex items-center gap-3"
      animate={animate ? {
        scale: [1, 1.05, 1]
      } : undefined}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      } : undefined}
    >
      {/* ViaHimalaya Logo */}
      <div className={`${logoSize} relative flex items-center justify-center`}>
        <Image
          src="/logo.svg"
          alt="ViaHimalaya Logo"
          fill
          className="object-contain"
          priority
          sizes={size === 'small' ? '(max-width: 640px) 24px, 32px' : '(max-width: 640px) 48px, (max-width: 768px) 64px, 80px'}
        />
      </div>
      
      {showText && (
        <span className={`${textSize} font-bold text-white tracking-wide font-sans`}>
          ViaHimalaya
        </span>
      )}
    </motion.div>
  );
}
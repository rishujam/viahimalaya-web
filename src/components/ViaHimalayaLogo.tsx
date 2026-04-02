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
  const logoSize = size === 'small' ? 'w-8 h-8' : 'w-20 h-20';
  const textSize = size === 'small' ? 'text-xl' : 'text-4xl';

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
          width={size === 'small' ? 32 : 80}
          height={size === 'small' ? 32 : 80}
          className="w-full h-full object-contain"
          priority
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
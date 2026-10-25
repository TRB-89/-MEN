import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'crimson';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  ...rest
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    // Subtle magnetic strength
    setPosition({ x: middleX * 0.22, y: middleY * 0.22 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-7 py-3 text-xs',
    lg: 'px-9 py-3.5 text-sm',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#F5F5F5] hover:bg-white text-[#050506] font-bold shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]',
    secondary:
      'bg-[#101013] hover:bg-[#19191D] text-[#E2E2E5] hover:text-white border border-[#E2E2E5]/15 hover:border-[#F02D46]/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)]',
    crimson:
      'bg-[#B10F29] hover:bg-[#F02D46] text-white border border-[#F02D46]/50 shadow-[0_4px_25px_rgba(177,15,41,0.5)] hover:shadow-[0_0_35px_rgba(240,45,70,0.6)]',
    ghost:
      'bg-transparent hover:bg-[#19191D]/50 text-[#919198] hover:text-[#E2E2E5] border border-transparent hover:border-[#E2E2E5]/10',
  }[variant];

  return (
    <motion.button
      ref={ref}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      onClick={onClick}
      className={`rounded-full font-technical tracking-wider uppercase transition-colors duration-200 select-none inline-flex items-center justify-center gap-2 active:scale-95 ${sizeClasses} ${variantClasses} ${className}`}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
};

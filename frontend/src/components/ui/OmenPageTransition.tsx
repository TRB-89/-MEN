import React from 'react';
import { motion } from 'framer-motion';

export interface OmenPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const OmenPageTransition: React.FC<OmenPageTransitionProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

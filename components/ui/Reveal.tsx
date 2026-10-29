import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { MOTION } from './tokens';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Fades content up once as it scrolls into view. Renders in place, without motion, when motion is reduced. */
export const Reveal: React.FC<RevealProps> = ({ children, className, delay = 0 }) => {
  const reduced = useReducedMotionPreference();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: MOTION.slow, ease: MOTION.ease, delay }}
    >
      {children}
    </motion.div>
  );
};

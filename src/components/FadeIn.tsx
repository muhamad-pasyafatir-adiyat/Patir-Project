import { motion } from 'framer-motion'
import { useMemo, type ElementType, type ReactNode } from 'react'

interface FadeInProps {
  as?: ElementType
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  x?: number
  y?: number
}

export function FadeIn({
  as = 'div',
  children,
  className,
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
}: FadeInProps) {
  const MotionComponent = useMemo(() => motion.create(as as never), [as])

  return (
    <MotionComponent
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{ delay, duration, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </MotionComponent>
  )
}

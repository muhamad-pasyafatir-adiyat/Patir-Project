import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MagnetProps {
  children: ReactNode
  padding?: number
  strength?: number
  activeTransition?: string
  inactiveTransition?: string
  className?: string
}

export function Magnet({
  children,
  padding = 150,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  className,
}: MagnetProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = useState('translate3d(0px, 0px, 0px)')
  const [transition, setTransition] = useState(inactiveTransition)

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const withinBounds =
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding

      if (!withinBounds) {
        setTransition(inactiveTransition)
        setTransform('translate3d(0px, 0px, 0px)')
        return
      }

      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (event.clientX - centerX) / strength
      const y = (event.clientY - centerY) / strength

      setTransition(activeTransition)
      setTransform(`translate3d(${x}px, ${y}px, 0px)`)
    }

    const handleLeave = () => {
      setTransition(inactiveTransition)
      setTransform('translate3d(0px, 0px, 0px)')
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseout', handleLeave)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseout', handleLeave)
    }
  }, [activeTransition, inactiveTransition, padding, strength])

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform, transition, willChange: 'transform' }}
    >
      {children}
    </div>
  )
}

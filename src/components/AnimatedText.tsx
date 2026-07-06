import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface AnimatedTextProps {
  text: string
  className?: string
}

function AnimatedCharacter({
  character,
  index,
  length,
  progress,
}: {
  character: string
  index: number
  length: number
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const start = index / length
  const end = Math.min(start + 0.35, 1)
  const opacity = useTransform(progress, [start, end], [0.2, 1])
  const displayChar = character === ' ' ? '\u00A0' : character

  return (
    <span className="relative inline-block align-top">
      <span className="invisible">{displayChar}</span>
      <motion.span className="absolute inset-0" style={{ opacity }}>
        {displayChar}
      </motion.span>
    </span>
  )
}

export function AnimatedText({ text, className }: AnimatedTextProps) {
  const ref = useRef<HTMLParagraphElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  return (
    <p ref={ref} className={className}>
      {text.split('').map((character, index) => (
        <AnimatedCharacter
          key={`${character}-${index}`}
          character={character}
          index={index}
          length={text.length}
          progress={scrollYProgress}
        />
      ))}
    </p>
  )
}

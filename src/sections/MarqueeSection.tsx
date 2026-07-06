import { useEffect, useMemo, useRef, useState } from 'react'
import { marqueeImages } from '../data/portfolio'

const rowOne = marqueeImages.slice(0, 11)
const rowTwo = marqueeImages.slice(11)

function triple<T>(items: readonly T[]) {
  return [...items, ...items, ...items]
}

export function MarqueeSection() {
  const ref = useRef<HTMLElement | null>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const sectionTop = ref.current.offsetTop
      const nextOffset = (window.scrollY - sectionTop + window.innerHeight) * 0.3
      setOffset(nextOffset)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const topRow = useMemo(() => triple(rowOne), [])
  const bottomRow = useMemo(() => triple(rowTwo), [])

  return (
    <section ref={ref} className="bg-[#0C0C0C] px-5 pb-10 pt-24 sm:px-8 sm:pt-32 md:px-10 md:pt-40">
      <div className="flex flex-col gap-3 overflow-hidden">
        <div
          className="flex w-max gap-3"
          style={{ transform: `translate3d(${offset - 200}px, 0, 0)`, willChange: 'transform' }}
        >
          {topRow.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt="Portfolio preview"
              loading="lazy"
              className="h-[270px] w-[420px] rounded-2xl object-cover"
            />
          ))}
        </div>

        <div
          className="flex w-max gap-3"
          style={{ transform: `translate3d(${-(offset - 200)}px, 0, 0)`, willChange: 'transform' }}
        >
          {bottomRow.map((src, index) => (
            <img
              key={`${src}-${index}`}
              src={src}
              alt="Portfolio preview"
              loading="lazy"
              className="h-[270px] w-[420px] rounded-2xl object-cover"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

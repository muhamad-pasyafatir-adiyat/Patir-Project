import { AnimatedText } from '../components/AnimatedText'
import { ContactButton } from '../components/ContactButton'
import { FadeIn } from '../components/FadeIn'
import { aboutText } from '../data/portfolio'

const decorations = [
  {
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png',
    alt: 'Moon icon',
    className: 'left-[1%] top-[4%] w-[120px] sm:left-[2%] sm:w-[160px] md:left-[4%] md:w-[210px]',
    delay: 0.1,
    x: -80,
  },
  {
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png',
    alt: '3D object',
    className: 'bottom-[8%] left-[3%] w-[100px] sm:left-[6%] sm:w-[140px] md:left-[10%] md:w-[180px]',
    delay: 0.25,
    x: -80,
  },
  {
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png',
    alt: 'Lego icon',
    className: 'right-[1%] top-[4%] w-[120px] sm:right-[2%] sm:w-[160px] md:right-[4%] md:w-[210px]',
    delay: 0.15,
    x: 80,
  },
  {
    src: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png',
    alt: '3D group',
    className: 'bottom-[8%] right-[3%] w-[130px] sm:right-[6%] sm:w-[170px] md:right-[10%] md:w-[220px]',
    delay: 0.3,
    x: 80,
  },
] as const

export function AboutSection() {
  return (
    <section id="about" className="relative flex min-h-screen items-center justify-center px-5 py-20 sm:px-8 md:px-10">
      {decorations.map((item) => (
        <FadeIn
          key={item.src}
          delay={item.delay}
          duration={0.9}
          x={item.x}
          y={0}
          className={`pointer-events-none absolute ${item.className}`}
        >
          <img src={item.src} alt={item.alt} className="h-auto w-full object-contain" loading="lazy" />
        </FadeIn>
      ))}

      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-10 text-center text-[#D7E2EA] sm:gap-14 md:gap-16">
        <FadeIn delay={0} y={40}>
          <h2 className="hero-heading text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight">
            About me
          </h2>
        </FadeIn>

        <div className="flex flex-col items-center gap-16 sm:gap-20 md:gap-24">
          <AnimatedText
            text={aboutText}
            className="max-w-[560px] text-[clamp(1rem,2vw,1.35rem)] font-medium leading-relaxed text-[#D7E2EA]"
          />
          <FadeIn delay={0.35} y={20}>
            <ContactButton id="contact" />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}

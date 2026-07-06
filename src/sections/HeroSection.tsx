import { FadeIn } from '../components/FadeIn'
import { Magnet } from '../components/Magnet'
import { ContactButton } from '../components/ContactButton'

const portraitUrl =
  'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png'

export function HeroSection() {
  return (
    <section id="top" className="relative flex h-screen flex-col overflow-x-clip px-5 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-8 md:px-10 md:pb-10">
      <FadeIn as="nav" delay={0} y={-20} className="z-20 flex items-center justify-between gap-4 text-[#D7E2EA]">
        {[
          { label: 'About', href: '#about' },
          { label: 'Price', href: '#services' },
          { label: 'Projects', href: '#projects' },
          { label: 'Contact', href: 'mailto:jack@portfolio.dev' },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="text-sm font-medium uppercase tracking-wider transition-opacity duration-200 hover:opacity-70 md:text-lg lg:text-[1.4rem]"
          >
            {item.label}
          </a>
        ))}
      </FadeIn>

      <div className="mt-6 overflow-hidden sm:mt-4 md:-mt-5">
        <FadeIn as="h1" delay={0.15} y={40} className="hero-heading relative z-20 w-full whitespace-nowrap text-[14vw] font-black uppercase leading-none tracking-tight sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]">
          Hi, i'm jack
        </FadeIn>
      </div>

      <FadeIn
        delay={0.6}
        y={30}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[280px] -translate-x-1/2 -translate-y-1/2 sm:bottom-0 sm:top-auto sm:w-[360px] sm:translate-y-0 md:w-[440px] lg:w-[520px]"
      >
        <Magnet
          padding={150}
          strength={3}
          activeTransition="transform 0.3s ease-out"
          inactiveTransition="transform 0.6s ease-in-out"
        >
          <img src={portraitUrl} alt="Jack portrait" className="block h-auto w-full select-none object-contain" />
        </Magnet>
      </FadeIn>

      <div className="relative z-20 mt-auto flex items-end justify-between gap-6">
        <FadeIn delay={0.35} y={20} className="max-w-[160px] text-[clamp(0.75rem,1.4vw,1.5rem)] font-light uppercase tracking-wide text-[#D7E2EA] sm:max-w-[220px] md:max-w-[260px]">
          <p className="leading-snug">
            a 3d creator driven by crafting striking and unforgettable projects
          </p>
        </FadeIn>

        <FadeIn delay={0.5} y={20}>
          <ContactButton />
        </FadeIn>
      </div>
    </section>
  )
}

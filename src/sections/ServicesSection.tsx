import { FadeIn } from '../components/FadeIn'
import { services } from '../data/portfolio'

export function ServicesSection() {
  return (
    <section
      id="services"
      className="rounded-t-[40px] bg-white px-5 py-20 text-[#0C0C0C] sm:rounded-t-[50px] sm:px-8 sm:py-24 md:rounded-t-[60px] md:px-10 md:py-32"
    >
      <FadeIn delay={0} y={40}>
        <h2 className="mb-16 text-center text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-28">
          Services
        </h2>
      </FadeIn>

      <div className="mx-auto max-w-5xl">
        {services.map((service, index) => (
          <FadeIn
            key={service.number}
            delay={index * 0.1}
            y={30}
            className="border-b border-[rgba(12,12,12,0.15)] py-8 first:border-t sm:py-10 md:py-12"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
              <p className="min-w-[96px] text-[clamp(3rem,10vw,140px)] font-black leading-none">
                {service.number}
              </p>
              <div className="space-y-3 md:space-y-4">
                <h3 className="text-[clamp(1rem,2.2vw,2.1rem)] font-medium uppercase">
                  {service.title}
                </h3>
                <p className="max-w-2xl text-[clamp(0.85rem,1.6vw,1.25rem)] font-light leading-relaxed opacity-60">
                  {service.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}

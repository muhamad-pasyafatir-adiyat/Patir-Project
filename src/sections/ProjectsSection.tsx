import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { FadeIn } from '../components/FadeIn'
import { LiveProjectButton } from '../components/LiveProjectButton'
import { projects } from '../data/portfolio'

function ProjectCard({
  index,
  totalCards,
  project,
}: {
  index: number
  totalCards: number
  project: (typeof projects)[number]
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const targetScale = 1 - (totalCards - 1 - index) * 0.03
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale])

  return (
    <div ref={ref} className="relative h-[85vh]">
      <motion.article
        style={{ scale, y: index * 28 }}
        className="sticky top-24 rounded-[40px] border-2 border-[#D7E2EA] bg-[#0C0C0C] p-4 text-[#D7E2EA] sm:rounded-[50px] sm:p-6 md:top-32 md:rounded-[60px] md:p-8"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
              <p className="text-[clamp(3rem,10vw,140px)] font-black leading-none">{project.number}</p>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-[#D7E2EA]/70 sm:text-base">
                  {project.category}
                </p>
                <h3 className="text-[clamp(1.25rem,3vw,3rem)] font-medium uppercase leading-tight">
                  {project.name}
                </h3>
              </div>
            </div>
            <LiveProjectButton />
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.4fr_0.6fr] md:gap-6">
            <div className="grid gap-4 md:gap-6">
              <img
                src={project.images[0]}
                alt={`${project.name} preview 1`}
                loading="lazy"
                className="h-[clamp(130px,16vw,230px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              />
              <img
                src={project.images[1]}
                alt={`${project.name} preview 2`}
                loading="lazy"
                className="h-[clamp(160px,22vw,340px)] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
              />
            </div>
            <img
              src={project.images[2]}
              alt={`${project.name} preview 3`}
              loading="lazy"
              className="h-full min-h-[340px] w-full rounded-[40px] object-cover sm:rounded-[50px] md:rounded-[60px]"
            />
          </div>
        </div>
      </motion.article>
    </div>
  )
}

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="relative z-10 -mt-10 rounded-t-[40px] bg-[#0C0C0C] px-5 py-20 sm:-mt-12 sm:rounded-t-[50px] sm:px-8 md:-mt-14 md:rounded-t-[60px] md:px-10 md:py-24"
    >
      <FadeIn delay={0} y={40}>
        <h2 className="hero-heading mb-16 text-center text-[clamp(3rem,12vw,160px)] font-black uppercase leading-none tracking-tight sm:mb-20 md:mb-24">
          Project
        </h2>
      </FadeIn>

      <div className="mx-auto max-w-6xl space-y-8">
        {projects.map((project, index) => (
          <ProjectCard key={project.number} index={index} totalCards={projects.length} project={project} />
        ))}
      </div>
    </section>
  )
}

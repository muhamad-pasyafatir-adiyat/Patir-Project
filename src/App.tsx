import { AboutSection } from './sections/AboutSection'
import { HeroSection } from './sections/HeroSection'
import { MarqueeSection } from './sections/MarqueeSection'
import { ProjectsSection } from './sections/ProjectsSection'
import { ServicesSection } from './sections/ServicesSection'

function App() {
  return (
    <main className="overflow-x-clip bg-[#0C0C0C]">
      <HeroSection />
      <MarqueeSection />
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
    </main>
  )
}

export default App

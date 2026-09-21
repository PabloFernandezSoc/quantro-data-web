import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ServicesTicker from './components/ServicesTicker'
import ServicesSection from './components/ServicesSection'
import FeaturedVideoSection from './components/FeaturedVideoSection'
import WorkflowSection from './components/WorkflowSection'
import TechStack from './components/TechStack'
import ProcessSection from './components/ProcessSection'
import EngagementSection from './components/EngagementSection'
import FAQSection from './components/FAQSection'
import BigCTA from './components/BigCTA'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'
import VisionPage from './VisionPage'
import SorpresaPage from './SorpresaPage'

export default function App() {
  // Router mínimo: /vision es la única ruta secundaria
  // (Vercel reescribe todo a index.html, así que el path llega intacto)
  if (window.location.pathname.startsWith('/vision')) {
    return <VisionPage />
  }

  // Ruta oculta: no está en el sitemap ni enlazada desde ningún lado
  if (window.location.pathname.startsWith('/sorpresaparamirmorcius')) {
    return <SorpresaPage />
  }

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      {/* Textura de grain cinematográfico sobre todo el sitio */}
      <div className="grain-overlay" aria-hidden="true" />

      <Navbar />
      <main>
        <Hero />
        <ServicesTicker />
        <ServicesSection />
        <FeaturedVideoSection />
        <WorkflowSection />
        <TechStack />
        <ProcessSection />
        <EngagementSection />
        <FAQSection />
        <BigCTA />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ServicesTicker from './components/ServicesTicker'
import ServicesSection from './components/ServicesSection'
import WorkflowSection from './components/WorkflowSection'
import TechStack from './components/TechStack'
import ProcessSection from './components/ProcessSection'
import EngagementSection from './components/EngagementSection'
import FAQSection from './components/FAQSection'
import BigCTA from './components/BigCTA'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      {/* Textura de grain cinematográfico sobre todo el sitio */}
      <div className="grain-overlay" aria-hidden="true" />

      <Navbar />
      <main>
        <Hero />
        <ServicesTicker />
        <ServicesSection />
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

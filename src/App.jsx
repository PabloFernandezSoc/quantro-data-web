import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ServicesSection from './components/ServicesSection'
import FunnelSection from './components/FunnelSection'
import WorkflowSection from './components/WorkflowSection'
import TechStack from './components/TechStack'
import ProcessSection from './components/ProcessSection'
import EngagementSection from './components/EngagementSection'
import FAQSection from './components/FAQSection'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <FunnelSection />
        <WorkflowSection />
        <TechStack />
        <ProcessSection />
        <EngagementSection />
        <FAQSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

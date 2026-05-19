import Navbar from './components/Navbar'
import Hero from './components/Hero'
import FunnelSection from './components/FunnelSection'
import TechStack from './components/TechStack'
import ProcessSection from './components/ProcessSection'
import ContactForm from './components/ContactForm'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-bg-deep)' }}>
      <Navbar />
      <main>
        <Hero />
        <FunnelSection />
        <TechStack />
        <ProcessSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}

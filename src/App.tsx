import Hero from './components/Hero';
import ValueProps from './components/ValueProps';
import HowItWorks from './components/HowItWorks';
import DemoReport from './components/DemoReport';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <ValueProps />
      <HowItWorks />
      <DemoReport />
      <CTA />
      <Footer />
    </div>
  );
}

export default App;

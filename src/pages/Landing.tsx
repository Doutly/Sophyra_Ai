import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';
import ValueProps from '../components/ValueProps';
import HowItWorks from '../components/HowItWorks';
import DemoReport from '../components/DemoReport';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartMockTest = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  const handleSignIn = () => {
    navigate('/auth?mode=signin');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Hero onStartMockTest={handleStartMockTest} onSignIn={handleSignIn} />
      <ValueProps />
      <HowItWorks />
      <DemoReport />
      <CTA onStartMockTest={handleStartMockTest} />
      <Footer />
    </div>
  );
}

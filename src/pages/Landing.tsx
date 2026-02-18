import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';
import ValueProps from '../components/ValueProps';
import HowItWorks from '../components/HowItWorks';
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
    <div className="min-h-screen bg-black">
      <Hero onStartMockTest={handleStartMockTest} onSignIn={handleSignIn} />
      <ValueProps />
      <HowItWorks />
      <CTA onStartMockTest={handleStartMockTest} />
      <Footer />
    </div>
  );
}

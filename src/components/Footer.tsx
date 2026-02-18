import { Linkedin, Twitter, Mail, ArrowRight } from 'lucide-react';

export default function Footer() {
  const links = {
    product: [
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Reports', href: '#reports' },
      { label: 'For Universities', href: '#' },
    ],
    company: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Blog', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Data Security', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  return (
    <footer className="bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

        <div className="py-20 grid md:grid-cols-2 lg:grid-cols-5 gap-14">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/lo.png" alt="Sophyra AI" className="w-11 h-11 relative z-10" />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
              </div>
              <span className="text-2xl font-bold text-white">Sophyra AI</span>
            </div>
            <p className="text-base text-white/45 leading-relaxed max-w-sm">
              Sophyra decides before the interviewer does. Practice with AI that thinks like a recruiter
              and get Big-Tech grade feedback on every session.
            </p>
            <div className="flex items-center space-x-3">
              {[
                { icon: Linkedin, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Mail, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-11 h-11 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center hover:bg-white/10 hover:border-white/15 transition-all"
                >
                  <Icon className="w-5 h-5 text-white/50" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6">Product</h4>
            <ul className="space-y-4">
              {links.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-base text-white/40 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4">
              {links.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-base text-white/40 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-6">Legal</h4>
            <ul className="space-y-4">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-base text-white/40 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/35">© 2025 Sophyra AI. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/25">Made with precision for your success</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/20" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

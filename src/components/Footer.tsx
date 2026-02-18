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
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src="/lo.png" alt="Sophyra AI" className="w-9 h-9 relative z-10" />
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md" />
              </div>
              <span className="text-xl font-bold text-white">Sophyra AI</span>
            </div>
            <p className="text-sm text-white/30 leading-relaxed max-w-sm">
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
                  className="w-9 h-9 bg-white/5 border border-white/5 rounded-lg flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-all"
                >
                  <Icon className="w-4 h-4 text-white/40" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/30 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-5">Company</h4>
            <ul className="space-y-3">
              {links.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/30 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-5">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-white/30 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/20">© 2025 Sophyra AI. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/15">Made with precision for your success</span>
              <ArrowRight className="w-3 h-3 text-white/10" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

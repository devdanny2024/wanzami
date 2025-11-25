import { Instagram, Twitter, Youtube, Facebook } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    Company: ['About Us', 'Careers', 'Press', 'Blog'],
    Support: ['Help Center', 'Contact', 'FAQs', 'Device Support'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'],
  };

  return (
    <footer className="bg-[#0b0b0c] border-t border-white/5 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white text-sm mb-4 tracking-wide">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <button className="text-gray-500 hover:text-white text-sm transition-colors">
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social links */}
          <div>
            <h3 className="text-white text-sm mb-4 tracking-wide">Connect</h3>
            <div className="flex gap-3">
              <button className="w-9 h-9 bg-white/5 hover:bg-[#fd7e14]/20 border border-white/10 hover:border-[#fd7e14] rounded-lg flex items-center justify-center transition-all group">
                <Instagram className="w-4 h-4 text-gray-500 group-hover:text-[#fd7e14] transition-colors" />
              </button>
              <button className="w-9 h-9 bg-white/5 hover:bg-[#fd7e14]/20 border border-white/10 hover:border-[#fd7e14] rounded-lg flex items-center justify-center transition-all group">
                <Twitter className="w-4 h-4 text-gray-500 group-hover:text-[#fd7e14] transition-colors" />
              </button>
              <button className="w-9 h-9 bg-white/5 hover:bg-[#fd7e14]/20 border border-white/10 hover:border-[#fd7e14] rounded-lg flex items-center justify-center transition-all group">
                <Youtube className="w-4 h-4 text-gray-500 group-hover:text-[#fd7e14] transition-colors" />
              </button>
              <button className="w-9 h-9 bg-white/5 hover:bg-[#fd7e14]/20 border border-white/10 hover:border-[#fd7e14] rounded-lg flex items-center justify-center transition-all group">
                <Facebook className="w-4 h-4 text-gray-500 group-hover:text-[#fd7e14] transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © 2024 Wanzami. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm">
            Made with <span className="text-[#fd7e14]">♥</span> in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
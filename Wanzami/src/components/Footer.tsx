import { Facebook, Instagram, Tiktok, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    Company: ['About Us', 'Careers', 'Press', 'Blog'],
    Support: ['Help Center', 'Contact', 'FAQs', 'Device Support'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Refund Policy'],
  };

  const socials = [
    { name: 'Instagram', href: 'https://www.instagram.com/wanzamientertainment?igsh=MXFlMmxmYWFtbXN3MA==', icon: Instagram },
    { name: 'Facebook', href: 'https://www.facebook.com/share/1AZQQfhusc/?mibextid=wwXIfr', icon: Facebook },
    { name: 'TikTok', href: 'https://www.tiktok.com/@wanzami.entertainm?_r=1&_t=ZS-928mNACGiyG', icon: Tiktok },
    { name: 'Twitter', href: 'https://x.com/wanzamitv?s=21', icon: Twitter },
    { name: 'YouTube', href: 'https://youtube.com/@wanzami?si=xZAiaaUjKCe_peJB', icon: Youtube },
  ];

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
                    {link === 'Contact' ? (
                      <a
                        href="/contact"
                        className="text-gray-500 hover:text-white text-sm transition-colors"
                      >
                        Contact
                      </a>
                    ) : (
                      <button className="text-gray-500 hover:text-white text-sm transition-colors">
                        {link}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social links */}
          <div>
            <h3 className="text-white text-sm mb-4 tracking-wide">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {socials.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="w-9 h-9 bg-white/5 hover:bg-[#fd7e14]/20 border border-white/10 hover:border-[#fd7e14] rounded-lg flex items-center justify-center transition-all group"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-[#fd7e14] transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">© 2026 Wanzami. All rights reserved.</p>
          <p className="text-gray-600 text-sm">
            Made with <span className="text-[#fd7e14]">♥</span> in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}

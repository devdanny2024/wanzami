import Image from 'next/image';
import { Facebook, Instagram, Music2, Twitter, Youtube } from 'lucide-react';
import wanzamiLogo from '../assets/logo.png';

export function Footer() {
  const footerLinks = {
    Support: [
      { label: 'Contact', href: '/contact' },
      { label: 'Terms of Use', href: '/policy#terms' },
      { label: 'Privacy Policy', href: '/policy#privacy' },
      { label: 'FAQ', href: '/policy#faq' },
    ],
    Browse: [
      { label: 'Movies', href: '/movies' },
      { label: 'Series', href: '/series' },
      { label: 'Live', href: '/live' },
      { label: 'Originals', href: '/originals' },
      { label: 'Blog', href: '/blog' },
    ],
  };

  const socials = [
    { name: 'Instagram', href: 'https://www.instagram.com/wanzamientertainment?igsh=MXFlMmxmYWFtbXN3MA==', icon: Instagram },
    { name: 'Facebook', href: 'https://www.facebook.com/share/1AZQQfhusc/?mibextid=wwXIfr', icon: Facebook },
    { name: 'TikTok', href: 'https://www.tiktok.com/@wanzami.entertainm?_r=1&_t=ZS-928mNACGiyG', icon: Music2 },
    { name: 'Twitter', href: 'https://x.com/wanzamitv?s=21', icon: Twitter },
    { name: 'YouTube', href: 'https://youtube.com/@wanzami?si=xZAiaaUjKCe_peJB', icon: Youtube },
  ];

  return (
    <footer className="bg-cs-ink border-t-[3px] border-cs-ink pt-14 pb-8">
      {/* End-credits strip */}
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-cs-paper/50 mb-12">
        End of call sheet — roll credits
      </p>
      <div className="container-page">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 mb-12">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <Image src={wanzamiLogo} alt="Wanzami" width={132} height={36} className="h-9 w-auto" />
            <p className="font-heading text-xl text-brand mt-5 leading-none tracking-wide">
              Stream the stories.<br />Feel the culture.
            </p>
            <p className="text-cs-paper/60 text-sm mt-3 max-w-xs">
              Premium African streaming — movies, series, live experiences and creators.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-cs-paper/70 hover:text-cs-paper text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Connect */}
          <div>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-brand mb-4">Connect</h3>
            <div className="flex flex-wrap gap-3">
              {socials.map(({ name, href, icon: Icon }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="w-10 h-10 bg-transparent border-[1.5px] border-cs-paper/25 hover:border-brand hover:bg-brand/10 flex items-center justify-center transition-all group"
                >
                  <Icon className="w-[18px] h-[18px] text-cs-paper/70 group-hover:text-brand transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-cs-paper/15 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-cs-paper/50">© {new Date().getFullYear()} Wanzami. All rights reserved.</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-cs-paper/50">
            Made with <span className="text-brand">♥</span> in Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}

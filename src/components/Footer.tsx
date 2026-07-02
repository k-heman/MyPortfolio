import './Footer.scss';

interface SocialItem {
  name: string;
  url: string;
  class: string;
}

interface NavItem {
  href: string;
  label: string;
}

interface FooterProps {
  footer: {
    name: string;
    tagline: string;
    description: string;
    social: SocialItem[];
    home: { text: string; url: string; ariaLabel: string };
    navigateText: string;
    elsewhereText: string;
    connectText: string;
    version: string;
    madeInPrefix: string;
    copyright: string;
    builtWith: { pretext: string; icon: string; posttext: string };
  };
  navItems: NavItem[];
}

function renderSocialIcon(name: string) {
  const size = 16;
  switch (name.toLowerCase()) {
    case 'github':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', display: 'inline-block' }}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer({ footer, navItems }: FooterProps) {
  const {
    name,
    tagline,
    social,
    navigateText,
    elsewhereText,
    version,
    copyright,
    builtWith,
  } = footer;

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#home" className="footer__logo-link">
              <span className="footer__logo-text">{name}</span>
            </a>
            <p className="footer__tagline">{tagline}</p>
          </div>

          <div className="footer__nav-group">
            <h4 className="footer__group-title">{navigateText}</h4>
            <ul className="footer__list">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="footer__link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__nav-group">
            <h4 className="footer__group-title">{elsewhereText}</h4>
            <ul className="footer__list">
              {social.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.url}
                    className="footer__link"
                    style={{ display: 'inline-flex', alignItems: 'center' }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {renderSocialIcon(item.name)}
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__meta">
            <span className="footer__version">{version}</span>
            <span className="footer__divider" aria-hidden="true">|</span>
            <span className="footer__copyright">{copyright}</span>
          </div>

          <div className="footer__credits">
            <span>
              {builtWith.pretext}
              <span className="footer__heart" aria-label="love">❤️</span>
              {builtWith.posttext.replace('Next.js', 'React + Vite')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

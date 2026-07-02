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

export default function Footer({ footer, navItems }: FooterProps) {
  const {
    name,
    tagline,
    social,
    navigateText,
    elsewhereText,
    connectText,
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
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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

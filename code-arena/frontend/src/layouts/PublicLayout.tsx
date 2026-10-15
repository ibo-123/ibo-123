// frontend/src/layouts/PublicLayout.tsx
import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import {
  Code2,
  Code,
  AtSign,
  Video,
  MessageCircle,
  ArrowUp,
  Mail,
  Trophy,
  Users,
  FileText,
  Shield,
  HelpCircle,
  BarChart3,
  Zap,
  Heart,
} from "lucide-react";
import { PublicNavbar } from "../components/navigation/PublicNavbar";
import "./PublicLayout.css";

const FOOTER_LINKS = {
  product: {
    title: "Product",
    links: [
      { to: "/tournaments", label: "Tournaments", icon: <Trophy size={14} /> },
      { to: "/tournaments", label: "Brackets", icon: <BarChart3 size={14} /> },
      { to: "/tournaments", label: "Standings", icon: <Users size={14} /> },
      { to: "/tournaments", label: "Live contests", icon: <Zap size={14} /> },
    ],
  },
  compete: {
    title: "Compete",
    links: [
      { to: "/register", label: "Register", icon: <Users size={14} /> },
      { to: "/login", label: "Sign in", icon: <Shield size={14} /> },
      { to: "/tournaments", label: "Rules", icon: <FileText size={14} /> },
      { to: "/tournaments", label: "FAQ", icon: <HelpCircle size={14} /> },
    ],
  },
  company: {
    title: "Company",
    links: [
      { to: "/", label: "About", icon: null },
      { to: "/", label: "Blog", icon: null },
      { to: "/", label: "Careers", icon: null },
      { to: "/", label: "Contact", icon: <Mail size={14} /> },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { to: "/", label: "Privacy", icon: null },
      { to: "/", label: "Terms", icon: null },
      { to: "/", label: "Cookies", icon: null },
      { to: "/", label: "Licenses", icon: null },
    ],
  },
} as const;

const SOCIALS = [
  { label: "GitHub", href: "https://github.com", icon: <Code size={16} /> },
  { label: "Twitter", href: "https://twitter.com", icon: <AtSign size={16} /> },
  { label: "Discord", href: "https://discord.com", icon: <MessageCircle size={16} /> },
  { label: "YouTube", href: "https://youtube.com", icon: <Video size={16} /> },
] as const;

export const PublicLayout = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="public-layout">
      {/* Skip link for keyboard users */}
      <a href="#public-main" className="public-skip-link">
        Skip to content
      </a>

      {/* Ambient background layers */}
      <div className="public-layout__grid" aria-hidden="true" />

      {/* Top accent line */}
      <div className="public-layout__accent" aria-hidden="true" />

      <PublicNavbar />

      <main id="public-main" className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          {/* ---- Top: brand + link columns ---- */}
          <div className="public-footer__top">
            <div className="public-footer__brand-col">
              <Link to="/" className="public-footer__brand">
                <span className="public-footer__brand-icon" aria-hidden="true">
                  <Code2 size={20} />
                </span>
                <span className="public-footer__brand-text">
                  Code<span className="public-footer__brand-accent">Arena</span>
                </span>
                <span className="public-footer__brand-version">v1.0</span>
              </Link>

              <p className="public-footer__tagline">
                The competitive programming arena where coders battle for the crown.
              </p>

              <div className="public-footer__status">
                <span className="public-footer__status-dot" aria-hidden="true" />
                <span>All systems operational</span>
              </div>

              <div className="public-footer__socials">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-footer__social"
                    aria-label={s.label}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([key, section]) => (
              <nav key={key} className="public-footer__col" aria-label={`${section.title} links`}>
                <h4 className="public-footer__col-title">{section.title}</h4>
                <ul className="public-footer__col-list">
                  {section.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="public-footer__link">
                        {l.icon}
                        <span>{l.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* ---- Newsletter ---- */}
          <form className="public-footer__newsletter" onSubmit={(e) => e.preventDefault()}>
            <div className="public-footer__newsletter-icon">
              <Mail size={18} />
            </div>
            <div className="public-footer__newsletter-text">
              <strong>Get tournament updates</strong>
              <span>New brackets, results, and prizes — straight to your inbox.</span>
            </div>
            <div className="public-footer__newsletter-input">
              <input type="email" placeholder="you@example.com" required />
              <button type="submit" className="public-footer__newsletter-btn">
                Subscribe
              </button>
            </div>
          </form>

          {/* ---- Bottom bar ---- */}
          <div className="public-footer__bottom">
            <p className="public-footer__copy">
              © {new Date().getFullYear()} CodeArena. All rights reserved.
            </p>
            <p className="public-footer__made">
              Made with <Heart size={12} /> for competitive coders
            </p>
            <nav className="public-footer__mini-nav" aria-label="Legal">
              <Link to="/">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link to="/">Terms</Link>
              <span aria-hidden="true">·</span>
              <Link to="/">Cookies</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      {showTop && (
        <button
          type="button"
          className="public-back-to-top"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default PublicLayout;

import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Layers,
  BellRing,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import "./Landing.css";

const Landing = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="brand-mark">GravySyncro</div>
        <nav className="nav-actions">
          <a href="#contact">{t("landing.nav.contact")}</a>
          <LanguageSelector />
          <Link to="/login" className="nav-cta">
            {t("landing.nav.getStarted")}
          </Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">{t("landing.hero.eyebrow")}</p>
          <h1>{t("landing.hero.title")}</h1>
          <p className="hero-copy">{t("landing.hero.description")}</p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary hero-btn">
              {t("landing.hero.primaryCta")} <ArrowRight size={18} />
            </Link>
            <a className="btn-ghost hero-btn" href="#contact">
              {t("landing.hero.secondaryCta")}
            </a>
          </div>
          <ul className="hero-points">
            <li>
              <CheckCircle2 size={16} /> {t("landing.hero.points.one")}
            </li>
            <li>
              <CheckCircle2 size={16} /> {t("landing.hero.points.two")}
            </li>
            <li>
              <CheckCircle2 size={16} /> {t("landing.hero.points.three")}
            </li>
          </ul>
        </div>
        <div className="hero-panel">
          <div className="panel-card">
            <h3>{t("landing.panel.title")}</h3>
            <div className="panel-list">
              <div>
                <ShieldCheck size={18} />
                <span>{t("landing.panel.items.security")}</span>
              </div>
              <div>
                <Layers size={18} />
                <span>{t("landing.panel.items.collaboration")}</span>
              </div>
              <div>
                <BellRing size={18} />
                <span>{t("landing.panel.items.notifications")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="explain-grid">
        <article className="explain-card">
          <h3>{t("landing.explain.app.title")}</h3>
          <p>{t("landing.explain.app.description")}</p>
        </article>
        <article className="explain-card">
          <h3>{t("landing.explain.admins.title")}</h3>
          <p>{t("landing.explain.admins.description")}</p>
        </article>
        <article className="explain-card">
          <h3>{t("landing.explain.users.title")}</h3>
          <p>{t("landing.explain.users.description")}</p>
        </article>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-intro">
          <p className="eyebrow">{t("landing.contact.eyebrow")}</p>
          <h2>{t("landing.contact.title")}</h2>
          <p>{t("landing.contact.description")}</p>
        </div>
        <div className="contact-cards">
          <a className="contact-card" href="mailto:info@gravy.africa">
            <Mail size={20} />
            <div>
              <h4>{t("landing.contact.cards.email.title")}</h4>
              <p>info@gravy.africa</p>
            </div>
          </a>
          <a className="contact-card" href="tel:+25761676947">
            <Phone size={20} />
            <div>
              <h4>{t("landing.contact.cards.phone.title")}</h4>
              <p>+257 616 769 47</p>
            </div>
          </a>
          <div className="contact-card">
            <MapPin size={20} />
            <div>
              <h4>{t("landing.contact.cards.location.title")}</h4>
              <p>{t("landing.contact.cards.location.value")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;

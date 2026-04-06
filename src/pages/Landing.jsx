import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Lock,
  Layers,
  BellRing,
  MessageSquareText,
  History,
  Gauge,
  UserRound,
  CreditCard,
  FolderKanban,
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

  useEffect(() => {
    const revealItems = globalThis.document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const handleMagneticMove = (event) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - rect.left - rect.width / 2;
    const offsetY = event.clientY - rect.top - rect.height / 2;

    button.style.setProperty("--mx", `${offsetX * 0.12}px`);
    button.style.setProperty("--my", `${offsetY * 0.16}px`);
  };

  const handleMagneticLeave = (event) => {
    const button = event.currentTarget;
    button.style.setProperty("--mx", "0px");
    button.style.setProperty("--my", "0px");
  };

  const featureCards = [
    {
      icon: Lock,
      title: t("landing.panel.items.security"),
      description: t("landing.explain.app.description"),
      className: "feature-card feature-large",
    },
    {
      icon: MessageSquareText,
      title: t("landing.features.cards.messaging.title"),
      description: t("landing.features.cards.messaging.description"),
      className: "feature-card",
    },
    {
      icon: History,
      title: t("landing.features.cards.versioning.title"),
      description: t("landing.features.cards.versioning.description"),
      className: "feature-card",
    },
    {
      icon: Gauge,
      title: t("landing.features.cards.admin.title"),
      description: t("landing.features.cards.admin.description"),
      className: "feature-card",
    },
    {
      icon: UserRound,
      title: t("landing.features.cards.profile.title"),
      description: t("landing.features.cards.profile.description"),
      className: "feature-card",
    },
    {
      icon: CreditCard,
      title: t("landing.features.cards.billing.title"),
      description: t("landing.features.cards.billing.description"),
      className: "feature-card",
    },
    {
      icon: FolderKanban,
      title: t("landing.features.cards.workspace.title"),
      description: t("landing.features.cards.workspace.description"),
      className: "feature-card",
    },
  ];

  const workflowSteps = [
    t("landing.workflow.steps.one"),
    t("landing.workflow.steps.two"),
    t("landing.workflow.steps.three"),
  ];

  const trustStats = [
    {
      value: t("landing.stats.items.one.value"),
      label: t("landing.stats.items.one.label"),
    },
    {
      value: t("landing.stats.items.two.value"),
      label: t("landing.stats.items.two.label"),
    },
    {
      value: t("landing.stats.items.three.value"),
      label: t("landing.stats.items.three.label"),
    },
  ];

  return (
    <div className="landing-page">
      <div className="noise-overlay" aria-hidden="true" />
      <header className="landing-nav">
        <div className="brand-mark">
          <span className="brand-dot" /> GravySyncro
        </div>
        <nav className="nav-actions">
          <a href="#features">{t("landing.nav.features")}</a>
          <a href="#contact">{t("landing.nav.contact")}</a>
          <LanguageSelector />
          <Link
            to="/login"
            className="nav-cta magnetic"
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            {t("landing.nav.getStarted")}
          </Link>
        </nav>
      </header>

      <section className="hero section-shell">
        <div className="hero-content reveal">
          <p className="eyebrow">{t("landing.hero.eyebrow")}</p>
          <h1>{t("landing.hero.title")}</h1>
          <p className="hero-copy">{t("landing.hero.description")}</p>
          <div className="hero-actions">
            <Link
              to="/login"
              className="btn-primary hero-btn magnetic cta-priority"
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
            >
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
        <div className="hero-panel reveal">
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
            <div className="panel-metrics">
              {trustStats.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="explain-grid section-shell">
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

      <section id="features" className="features-section section-shell">
        <div className="section-heading">
          <p className="eyebrow">{t("landing.features.eyebrow")}</p>
          <h2>{t("landing.features.title")}</h2>
          <p>{t("landing.features.description")}</p>
        </div>
        <div className="feature-grid bento-grid">
          {featureCards.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className={`${feature.className} reveal`}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="feature-icon-wrap">
                  <Icon size={20} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="workflow-section section-shell">
        <div className="section-heading">
          <p className="eyebrow">{t("landing.workflow.eyebrow")}</p>
          <h2>{t("landing.workflow.title")}</h2>
          <p>{t("landing.workflow.description")}</p>
        </div>
        <div className="workflow-steps">
          {workflowSteps.map((step, index) => (
            <article key={step} className="workflow-step reveal">
              <span className="step-number">0{index + 1}</span>
              <p>{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section section-shell reveal">
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

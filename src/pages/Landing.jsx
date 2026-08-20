import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  ShieldCheck,
  Layers,
  BellRing,
  Archive,
  RefreshCw,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
} from "lucide-react";
import LanguageSelector from "../components/LanguageSelector";
import CountryCodeSelect from "../components/CountryCodeSelect";
import api from "../config/api";
import { countryCodes } from "../data/countryCodes";
import "./Landing.css";

const Landing = () => {
  const { t } = useTranslation();

  const [contactForm, setContactForm] = useState({
    email: "",
    countryCode: "+257",
    phoneNumber: "",
    subject: "",
    message: "",
  });
  const [contactStatus, setContactStatus] = useState("idle"); // idle | sending | success | error
  const [contactError, setContactError] = useState("");

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setContactStatus("sending");
    setContactError("");

    try {
      await axios.post(api.endpoints.messages.publicContact(), contactForm);
      setContactStatus("success");
      setContactForm({ email: "", countryCode: "+257", phoneNumber: "", subject: "", message: "" });
    } catch (error) {
      console.error("Failed to send contact message:", error);
      const validationErrors = error?.response?.data?.errors;
      const serverMessage = validationErrors?.[0]?.message || error?.response?.data?.message;
      setContactError(serverMessage || "Something went wrong. Please try again.");
      setContactStatus("error");
    }
  };

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

  const handle3DMove = (event) => {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    card.style.setProperty("--rotateX", `${rotateX}deg`);
    card.style.setProperty("--rotateY", `${rotateY}deg`);
  };

  const handle3DLeave = (event) => {
    const card = event.currentTarget;
    card.style.setProperty("--rotateX", "0deg");
    card.style.setProperty("--rotateY", "0deg");
  };

  const featureCards = [
    {
      icon: Archive,
      title: t("landing.features.cards.archiving.title"),
      description: t("landing.features.cards.archiving.description"),
      className: "feature-card",
    },
    {
      icon: Layers,
      title: t("landing.features.cards.collaboration.title"),
      description: t("landing.features.cards.collaboration.description"),
      className: "feature-card",
    },
    {
      icon: RefreshCw,
      title: t("landing.features.cards.syncing.title"),
      description: t("landing.features.cards.syncing.description"),
      className: "feature-card",
    },
  ];

  const workflowSteps = [
    {
      title: t("landing.workflow.steps.one.title"),
      description: t("landing.workflow.steps.one.description"),
    },
    {
      title: t("landing.workflow.steps.two.title"),
      description: t("landing.workflow.steps.two.description"),
    },
    {
      title: t("landing.workflow.steps.three.title"),
      description: t("landing.workflow.steps.three.description"),
    },
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
        <div 
          className="brand-wrapper"
          onMouseMove={handle3DMove}
          onMouseLeave={handle3DLeave}
        >
          <div className="brand-mark">
            <span className="brand-dot" />
            <span className="brand-text">GravySyncro</span>
          </div>
        </div>
        <nav className="nav-actions">
          <a href="#features" className="nav-link">
            <span className="nav-link-text">{t("landing.nav.features")}</span>
            <span className="nav-link-mirror">{t("landing.nav.features")}</span>
          </a>
          <a href="#contact" className="nav-link">
            <span className="nav-link-text">{t("landing.nav.contact")}</span>
            <span className="nav-link-mirror">{t("landing.nav.contact")}</span>
          </a>
          <div className="nav-language-wrapper">
            <LanguageSelector />
          </div>
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
              to="/register"
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
            <article key={step.title} className="workflow-step reveal">
              <span className="step-number">0{index + 1}</span>
              <p>
                <strong>{step.title}</strong> {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta-section section-shell reveal">
        <div className="final-cta-inner">
          <h2>{t("landing.finalCta.title")}</h2>
          <Link
            to="/register"
            className="btn-primary final-cta-btn magnetic cta-priority"
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            {t("landing.finalCta.button")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section id="contact" className="contact-section section-shell reveal">
        <div className="contact-intro">
          <p className="eyebrow">{t("landing.contact.eyebrow")}</p>
          <h2>{t("landing.contact.title")}</h2>
          <p>{t("landing.contact.description")}</p>
        </div>

        <form className="contact-form" onSubmit={handleContactSubmit} noValidate>
          {contactStatus === "success" && (
            <div className="contact-form-banner contact-form-success">
              <CheckCircle2 size={16} />
              <span>{t("landing.contact.form.successMessage")}</span>
            </div>
          )}
          {contactStatus === "error" && (
            <div className="contact-form-banner contact-form-error">
              <AlertCircle size={16} />
              <span>{contactError}</span>
            </div>
          )}

          <div className="contact-form-row">
            <div className="contact-form-field">
              <label htmlFor="contact-email">{t("landing.contact.form.emailLabel")}</label>
              <div className="contact-input-wrap">
                <Mail
                  size={16}
                  className={`contact-input-icon ${contactForm.email ? "contact-input-icon-hidden" : ""}`}
                />
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  disabled={contactStatus === "sending"}
                />
              </div>
            </div>

            <div className="contact-form-field">
              <label htmlFor="contact-phone">{t("landing.contact.form.phoneLabel")}</label>
              <div className="contact-phone-wrap">
                <CountryCodeSelect
                  countries={countryCodes}
                  value={contactForm.countryCode}
                  onChange={(dial) => setContactForm((prev) => ({ ...prev, countryCode: dial }))}
                  disabled={contactStatus === "sending"}
                  label={t("landing.contact.form.countryCodeLabel")}
                />
                <div className="contact-input-wrap contact-phone-number">
                  <Phone
                    size={16}
                    className={`contact-input-icon ${contactForm.phoneNumber ? "contact-input-icon-hidden" : ""}`}
                  />
                  <input
                    id="contact-phone"
                    type="tel"
                    name="phoneNumber"
                    required
                    autoComplete="tel-national"
                    value={contactForm.phoneNumber}
                    onChange={handleContactChange}
                    disabled={contactStatus === "sending"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-field">
            <label htmlFor="contact-subject">{t("landing.contact.form.subjectLabel")}</label>
            <input
              id="contact-subject"
              type="text"
              name="subject"
              required
              placeholder={t("landing.contact.form.subjectPlaceholder")}
              value={contactForm.subject}
              onChange={handleContactChange}
              disabled={contactStatus === "sending"}
            />
          </div>

          <div className="contact-form-field">
            <label htmlFor="contact-message">{t("landing.contact.form.messageLabel")}</label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={4}
              placeholder={t("landing.contact.form.messagePlaceholder")}
              value={contactForm.message}
              onChange={handleContactChange}
              disabled={contactStatus === "sending"}
            />
          </div>

          <button
            type="submit"
            className="btn-primary contact-submit-btn magnetic"
            disabled={contactStatus === "sending"}
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
          >
            {contactStatus === "sending" ? (
              <>
                <Loader2 size={16} className="contact-spin" /> {t("landing.contact.form.sending")}
              </>
            ) : (
              <>
                {t("landing.contact.form.submit")} <Send size={16} />
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Landing;
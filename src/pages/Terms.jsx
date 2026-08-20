import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TermsContent from '../components/TermsContent';
import './Auth.css';
import './Terms.css';

const Terms = () => (
  <div className="auth-container">
    <Link to="/" className="auth-back-link">
      <ArrowLeft size={16} />
      Back to home
    </Link>
    <div className="noise-overlay" aria-hidden="true" />
    <div className="gradient-orb gradient-orb-1" />
    <div className="gradient-orb gradient-orb-2" />

    <div className="auth-card terms-page-card">
      <div className="auth-header">
        <h1 className="terms-page-title">Terms of Service</h1>
        <p className="auth-tagline">Please read these terms carefully before using GravySyncro.</p>
      </div>
      <div className="auth-form terms-page-body">
        <TermsContent />
        <Link to="/register" className="terms-page-back-link">← Back to registration</Link>
      </div>
    </div>
  </div>
);

export default Terms;

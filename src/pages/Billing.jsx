import React, { useState } from 'react';
import { Check, Zap, Shield, HardDrive } from 'lucide-react';
import './Billing.css';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    storage: '50 GB',
    price: 15,
    period: 'month',
    icon: HardDrive,
    color: 'var(--primary)',
    features: [
      '50 GB Cloud Storage',
      'Real-time Collaboration',
      'Version History (30 days)',
      'Up to 5 team members',
      'Email Support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    storage: '100 GB',
    price: 25,
    period: 'month',
    icon: Zap,
    color: '#8b5cf6',
    features: [
      '100 GB Cloud Storage',
      'Real-time Collaboration',
      'Version History (90 days)',
      'Up to 20 team members',
      'Priority Email Support',
      'Advanced Analytics',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    storage: '200 GB',
    price: 40,
    period: 'month',
    icon: Shield,
    color: '#0ea5e9',
    features: [
      '200 GB Cloud Storage',
      'Real-time Collaboration',
      'Unlimited Version History',
      'Unlimited team members',
      '24/7 Priority Support',
      'Advanced Analytics',
      'Custom Integrations',
    ],
    popular: false,
  },
];

const Billing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChoosePlan = (planId) => {
    setSelectedPlan(planId);
    setShowConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowConfirm(false);
    setSelectedPlan(null);
  };

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h1>Billing &amp; Plans</h1>
        <p className="subtitle">
          Choose the plan that fits your storage needs. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.id}
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && (
                <div className="popular-badge">Most Popular</div>
              )}

              <div className="plan-icon" style={{ background: `${plan.color}18`, color: plan.color }}>
                <Icon size={28} />
              </div>

              <h2 className="plan-name">{plan.name}</h2>
              <p className="plan-storage">{plan.storage} Storage</p>

              <div className="plan-price">
                <span className="price-dollar">$</span>
                <span className="price-amount">{plan.price}</span>
                <span className="price-period">/ {plan.period}</span>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, i) => (
                  <li key={i}>
                    <Check size={16} className="feature-check" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`plan-btn ${plan.popular ? 'plan-btn-popular' : ''}`}
                onClick={() => handleChoosePlan(plan.id)}
              >
                Get Started
              </button>
            </div>
          );
        })}
      </div>

      <div className="billing-note">
        <Shield size={16} />
        <span>All plans include SSL encryption, daily backups, and a 14-day free trial. No credit card required to start.</span>
      </div>

      {showConfirm && (
        <>
          <div className="modal-overlay" onClick={handleConfirmClose} />
          <div className="modal">
            <h3>🎉 Coming Soon!</h3>
            <p>
              Payment processing will be available shortly. We'll notify you when the{' '}
              <strong>{plans.find(p => p.id === selectedPlan)?.name}</strong> plan is ready to activate.
            </p>
            <button className="btn-primary" onClick={handleConfirmClose}>
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;

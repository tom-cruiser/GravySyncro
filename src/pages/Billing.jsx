import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Check, Zap, Shield, HardDrive, Loader2, Mail } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import api from '../config/api';
import { setAuthUser } from '../features/auth/authSlice';
import './Billing.css';

// Cosmetic details the backend doesn't need to know about (icon/color per plan id).
const PLAN_PRESENTATION = {
  starter: { icon: HardDrive, color: 'var(--primary)' },
  pro: { icon: Zap, color: '#8b5cf6' },
  business: { icon: Shield, color: '#0ea5e9' },
  growth: { icon: HardDrive, color: '#14b8a6' },
  scale: { icon: Shield, color: '#f59e0b' },
};

const GB_IN_BYTES = 1024 * 1024 * 1024;

const Billing = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  const [plans, setPlans] = useState([]);
  const [tenantStorage, setTenantStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentPlanGb = Number(tenantStorage?.storagePlanGb || user?.storagePlanGb || 0) || null;

  const loadBillingData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError('');

    try {
      const [plansResponse, profileResponse] = await Promise.all([
        axios.get(api.endpoints.users.subscriptionPlans(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(api.endpoints.users.profile(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // The annual enterprise tiers (Enterprise 1TB/2TB) are assigned
      // manually by an admin from the storage-management panel after an
      // enterprise client reaches out — see AdminUsers.jsx — not something
      // a user can self-serve here, since this page doesn't collect
      // payment or track annual billing periods.
      const monthlyPlans = (plansResponse?.data?.data?.plans || [])
        .filter((plan) => plan.billingCycle !== 'yearly');
      setPlans(monthlyPlans);
      setTenantStorage(profileResponse?.data?.data?.tenantStorage || null);
    } catch (error) {
      console.error('Failed to load billing data:', error);
      setLoadError('Could not load subscription plans. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Keep this page in sync if another teammate in the same tenant changes the plan.
  useEffect(() => {
    if (!token) return undefined;

    const socketBaseUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '').replace(/\/api\/v1\/?$/, '');
    const socket = io(socketBaseUrl || window.location.origin, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      socket.emit('authenticate', { token });
    });

    socket.on('tenant:storage-updated', (payload) => {
      setTenantStorage((prev) => ({
        ...prev,
        storagePlanGb: payload.storagePlanGb,
        storageLimit: payload.storageLimit,
        storageUsed: payload.storageUsed,
        storageUsedPercentage: payload.storageUsedPercentage,
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const handleChoosePlan = (plan) => {
    if (plan.storageGb === currentPlanGb) return;
    setSelectedPlan(plan);
    setActionError('');
    setShowConfirm(true);
  };

  const handleConfirmClose = () => {
    if (isSaving) return;
    setShowConfirm(false);
    setSelectedPlan(null);
    setActionError('');
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan) return;
    setIsSaving(true);
    setActionError('');

    try {
      const response = await axios.patch(
        api.endpoints.users.updateSubscriptionPlan(),
        { storagePlanGb: selectedPlan.storageGb },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedTenant = response?.data?.data?.tenant;
      if (updatedTenant) {
        setTenantStorage((prev) => ({ ...prev, ...updatedTenant }));
      }

      if (user) {
        dispatch(setAuthUser({
          ...user,
          storagePlanGb: selectedPlan.storageGb,
          storageLimit: updatedTenant?.storageLimit,
        }));
      }

      setSuccessMessage(`You're now on the ${selectedPlan.name} plan.`);
      setShowConfirm(false);
      setSelectedPlan(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to update subscription plan:', error);
      setActionError(
        error?.response?.data?.message || 'Could not switch plans. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const storageUsedGb = tenantStorage ? tenantStorage.storageUsed / GB_IN_BYTES : 0;
  const storageLimitGb = tenantStorage ? tenantStorage.storageLimit / GB_IN_BYTES : 0;

  return (
    <div className="billing-page">
      <div className="billing-header">
        <h1>Billing &amp; Plans</h1>
        <p className="subtitle">
          Choose the shared enterprise plan that fits your organization. Every member draws from the same storage pool.
        </p>
      </div>

      {successMessage && (
        <div className="billing-banner billing-banner-success">{successMessage}</div>
      )}
      {loadError && (
        <div className="billing-banner billing-banner-error">{loadError}</div>
      )}

      {!loading && tenantStorage && (
        <div className="current-plan-summary">
          <div>
            <span className="current-plan-label">Current usage</span>
            <strong>
              {storageUsedGb.toFixed(1)} GB of {storageLimitGb.toFixed(0)} GB used
            </strong>
          </div>
          <div className="current-plan-bar">
            <div
              className="current-plan-bar-fill"
              style={{ width: `${Math.min(tenantStorage.storageUsedPercentage || 0, 100)}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="billing-loading">
          <Loader2 className="spin" size={24} />
          <span>Loading plans…</span>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => {
            const presentation = PLAN_PRESENTATION[plan.id] || { icon: HardDrive, color: 'var(--primary)' };
            const Icon = presentation.icon;
            const isCurrent = plan.storageGb === currentPlanGb;

            return (
              <div
                key={plan.id}
                className={`plan-card ${plan.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {plan.popular && !isCurrent && (
                  <div className="popular-badge">Most Popular</div>
                )}
                {isCurrent && (
                  <div className="popular-badge current-badge">Current Plan</div>
                )}

                <div className="plan-icon" style={{ background: `${presentation.color}18`, color: presentation.color }}>
                  <Icon size={28} />
                </div>

                <h2 className="plan-name">{plan.name}</h2>
                <p className="plan-storage">{plan.storageGb} GB shared pool</p>

                {plan.priceUsdPerMonth > 0 && (
                  <div className="plan-price">
                    <span className="price-dollar">$</span>
                    <span className="price-amount">{plan.priceUsdPerMonth}</span>
                    <span className="price-period">/ month</span>
                  </div>
                )}

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
                  onClick={() => handleChoosePlan(plan)}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : 'Switch to this plan'}
                </button>
              </div>
            );
          })}

          {/* Not a real, selectable storage plan — just a CTA for anyone who
              needs more than the largest tier above. */}
          <div className="plan-card plan-card-contact">
            <div className="plan-icon" style={{ background: 'var(--primary)18', color: 'var(--primary)' }}>
              <Mail size={28} />
            </div>

            <h2 className="plan-name">Enterprise</h2>
            <p className="plan-storage">Need more than 1 TB?</p>

            <ul className="plan-features">
              <li><Check size={16} className="feature-check" />Custom storage &amp; team size</li>
              <li><Check size={16} className="feature-check" />Dedicated onboarding &amp; support</li>
              <li><Check size={16} className="feature-check" />Custom contract &amp; invoicing</li>
            </ul>

            <Link to="/support" className="plan-btn">
              Contact Us
            </Link>
          </div>
        </div>
      )}

      <div className="billing-note">
        <Shield size={16} />
        <span>Switching plans updates the shared storage pool for everyone in your organization immediately.</span>
      </div>

      {showConfirm && selectedPlan && (
        <>
          <div className="modal-overlay" onClick={handleConfirmClose} />
          <div className="modal">
            <h3>Switch to {selectedPlan.name}?</h3>
            <p>
              This changes your organization's shared storage pool to{' '}
              <strong>{selectedPlan.storageGb} GB</strong> for every team member, effective immediately.
            </p>
            {actionError && <p className="modal-error">{actionError}</p>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={handleConfirmClose} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleConfirmChange} disabled={isSaving}>
                {isSaving ? 'Switching…' : 'Confirm Switch'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Billing;

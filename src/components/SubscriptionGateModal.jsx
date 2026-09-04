import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Lock, X } from 'lucide-react';
import { hideSubscriptionGate } from '../features/subscriptionGate/subscriptionGateSlice';
import './SubscriptionGateModal.css';

// App-wide paywall modal. Opened by the axios interceptor (config/axiosSetup.js)
// whenever a request comes back 402 from the backend's `requireActiveSubscription`
// gate, so a trial-expired user gets one clear explanation and a path forward —
// wherever they hit the wall (document/audio/video upload, etc.) — instead of a
// generic error toast that just says the request failed.
const SubscriptionGateModal = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOpen, message } = useSelector((state) => state.subscriptionGate);

  if (!isOpen) return null;

  const close = () => dispatch(hideSubscriptionGate());

  const goToBilling = () => {
    close();
    navigate('/billing');
  };

  const goToSupport = () => {
    close();
    navigate('/support', { state: { activeTab: 'contact' } });
  };

  return (
    <>
      <div className="subscription-gate-overlay" onClick={close} />
      <div className="subscription-gate-modal" role="dialog" aria-modal="true" aria-label="Trial expired">
        <div className="subscription-gate-header">
          <div className="subscription-gate-icon">
            <Lock size={20} />
          </div>
          <button
            type="button"
            className="subscription-gate-close"
            onClick={close}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="subscription-gate-body">
          <h3>Your trial has ended</h3>
          <p>{message || 'Your trial has expired. Subscribe to a plan or contact an admin to restore access.'}</p>
        </div>
        <div className="subscription-gate-footer">
          <button type="button" className="subscription-gate-secondary" onClick={goToSupport}>
            Contact an admin
          </button>
          <button type="button" className="subscription-gate-primary" onClick={goToBilling}>
            View plans
          </button>
        </div>
      </div>
    </>
  );
};

export default SubscriptionGateModal;

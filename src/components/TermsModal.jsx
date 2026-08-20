import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import TermsContent from './TermsContent';
import '../pages/Terms.css';
import './TermsModal.css';

// Opened from the registration form so agreeing to the Terms doesn't
// mean losing your in-progress signup — closing it returns you right
// back to the form.
const TermsModal = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="terms-modal-overlay" onClick={onClose} />
      <div className="terms-modal" role="dialog" aria-modal="true" aria-label="Terms of Service">
        <div className="terms-modal-header">
          <h3>Terms of Service</h3>
          <button
            type="button"
            className="terms-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="terms-modal-body">
          <TermsContent />
        </div>
        <div className="terms-modal-footer">
          <button type="button" className="terms-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default TermsModal;

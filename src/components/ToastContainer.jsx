import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { dismissToast } from '../features/notifications/notificationsSlice';
import './ToastContainer.css';

const ToastContainer = () => {
  const dispatch = useDispatch();
  const { toasts } = useSelector(state => state.notifications);

  useEffect(() => {
    if (!toasts.length) return undefined;

    const timers = toasts.map((toast) =>
      setTimeout(() => dispatch(dismissToast(toast.id)), 4500)
    );

    return () => timers.forEach(clearTimeout);
  }, [dispatch, toasts]);

  const iconForType = (type) => {
    if (type === 'success') return <CheckCircle size={18} />;
    if (type === 'error') return <AlertCircle size={18} />;
    return <Info size={18} />;
  };

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type || 'info'}`}>
          <div className="toast-icon">{iconForType(toast.type)}</div>
          <div className="toast-message">{toast.message}</div>
          <button
            className="toast-close"
            onClick={() => dispatch(dismissToast(toast.id))}
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;

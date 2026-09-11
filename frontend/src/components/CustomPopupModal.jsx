import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import './CustomPopupModal.css';

// Global override setup
if (typeof window !== 'undefined' && !window.__customAlertInitialized) {
  window.__customAlertInitialized = true;
  window.alert = function (message) {
    if (message === undefined || message === null) return;
    const messageStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
    window.dispatchEvent(
      new CustomEvent('app-custom-alert', {
        detail: { message: messageStr }
      })
    );
  };
}

const CustomPopupModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: ''
  });

  useEffect(() => {
    const handleCustomAlert = (event) => {
      if (event.detail && event.detail.message) {
        setModalState({
          isOpen: true,
          message: event.detail.message
        });
      }
    };

    window.addEventListener('app-custom-alert', handleCustomAlert);
    return () => {
      window.removeEventListener('app-custom-alert', handleCustomAlert);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalState.isOpen && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) {
        e.preventDefault();
        closeModal();
      }
    };
    if (modalState.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState.isOpen]);

  const closeModal = () => {
    setModalState({ isOpen: false, message: '' });
  };

  if (!modalState.isOpen) return null;

  const msgLower = modalState.message.toLowerCase();
  
  let type = 'info';
  let title = 'System Notification';
  let icon = <Info size={28} className="modal-icon icon-info" />;

  if (
    msgLower.includes('success') ||
    msgLower.includes('confirmed') ||
    msgLower.includes('updated') ||
    msgLower.includes('saved') ||
    msgLower.includes('completed') ||
    msgLower.includes('submitted')
  ) {
    type = 'success';
    title = 'Success!';
    icon = <CheckCircle2 size={28} className="modal-icon icon-success" />;
  } else if (
    msgLower.includes('failed') ||
    msgLower.includes('error') ||
    msgLower.includes('incorrect') ||
    msgLower.includes('invalid') ||
    msgLower.includes('required') ||
    msgLower.includes('mandatory') ||
    msgLower.includes('match') ||
    msgLower.includes('blocked')
  ) {
    type = 'error';
    title = 'Attention Required';
    icon = <AlertCircle size={28} className="modal-icon icon-error" />;
  }

  return (
    <div className="custom-popup-overlay" onClick={closeModal}>
      <div className={`custom-popup-modal type-${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="custom-popup-close" onClick={closeModal} aria-label="Close">
          <X size={18} />
        </button>

        <div className="custom-popup-header">
          <div className={`custom-popup-icon-badge badge-${type}`}>
            {icon}
          </div>
          <h3>{title}</h3>
        </div>

        <div className="custom-popup-body">
          <p>{modalState.message}</p>
        </div>

        <div className="custom-popup-actions">
          <button className={`custom-popup-btn btn-${type}`} onClick={closeModal}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPopupModal;

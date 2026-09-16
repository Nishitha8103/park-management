import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, Info, X } from 'lucide-react';
import './CustomPopupModal.css';

// Global override & helper setup
if (typeof window !== 'undefined') {
  if (!window.__customAlertInitialized) {
    window.__customAlertInitialized = true;
    window.alert = function (message) {
      if (message === undefined || message === null) return;
      const messageStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
      window.dispatchEvent(
        new CustomEvent('app-custom-alert', {
          detail: { message: messageStr, isConfirm: false }
        })
      );
    };

    // Custom confirm helper
    window.customConfirm = function (message) {
      return new Promise((resolve) => {
        const messageStr = typeof message === 'object' ? JSON.stringify(message) : String(message);
        window.dispatchEvent(
          new CustomEvent('app-custom-alert', {
            detail: { message: messageStr, isConfirm: true, resolve }
          })
        );
      });
    };
  }
}

const CustomPopupModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    isConfirm: false,
    resolve: null
  });

  useEffect(() => {
    const handleCustomAlert = (event) => {
      if (event.detail && event.detail.message) {
        setModalState({
          isOpen: true,
          message: event.detail.message,
          isConfirm: !!event.detail.isConfirm,
          resolve: event.detail.resolve || null
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
      if (modalState.isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleConfirmOk();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleConfirmCancel();
        }
      }
    };
    if (modalState.isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalState.isOpen, modalState.resolve]);

  const handleConfirmOk = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState({ isOpen: false, message: '', isConfirm: false, resolve: null });
  };

  const handleConfirmCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState({ isOpen: false, message: '', isConfirm: false, resolve: null });
  };

  if (!modalState.isOpen) return null;

  const msgLower = modalState.message.toLowerCase();
  
  let type = 'info';
  let title = 'System Notification';
  let icon = <Info size={28} className="modal-icon icon-info" />;

  if (modalState.isConfirm) {
    type = 'confirm';
    title = 'Please Confirm';
    icon = <HelpCircle size={28} className="modal-icon icon-confirm" />;
  } else if (
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
    <div className="custom-popup-overlay" onClick={handleConfirmCancel}>
      <div className={`custom-popup-modal type-${type}`} onClick={(e) => e.stopPropagation()}>
        <button className="custom-popup-close" onClick={handleConfirmCancel} aria-label="Close">
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
          {modalState.isConfirm ? (
            <div className="custom-popup-btn-group">
              <button className="custom-popup-btn btn-cancel" onClick={handleConfirmCancel}>
                Cancel
              </button>
              <button className="custom-popup-btn btn-confirm" onClick={handleConfirmOk}>
                Confirm
              </button>
            </div>
          ) : (
            <button className={`custom-popup-btn btn-${type}`} onClick={handleConfirmOk}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomPopupModal;

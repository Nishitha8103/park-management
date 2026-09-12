import { useState, useEffect } from 'react';
import { KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, RefreshCw, X } from 'lucide-react';
import './ForgotPasswordModal.css';

export default function ForgotPasswordModal({ isOpen, onClose, onPasswordResetSuccess }) {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset, 3: Success
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!emailOrUsername.trim()) {
      return setErrorMsg('Please enter your registered email or username.');
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: emailOrUsername.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        setStep(2);
        setResendTimer(60);
      } else {
        setErrorMsg(data.message || 'Could not find account. Please check details.');
      }
    } catch (err) {
      console.error('Request OTP error:', err);
      setErrorMsg('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim() || otp.trim().length !== 6) {
      return setErrorMsg('Please enter the 6-digit verification code.');
    }
    if (!newPassword) {
      return setErrorMsg('Please enter a new password.');
    }
    if (newPassword.length < 6) {
      return setErrorMsg('Password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setErrorMsg('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStep(3);
        if (onPasswordResetSuccess) {
          onPasswordResetSuccess(emailOrUsername);
        }
      } else {
        setErrorMsg(data.message || 'Failed to reset password. Please verify the code.');
      }
    } catch (err) {
      console.error('Reset Password error:', err);
      setErrorMsg('Failed to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="forgot-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="forgot-modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {step === 1 && (
          <div>
            <div className="forgot-modal-header">
              <div className="forgot-modal-icon">
                <KeyRound size={28} />
              </div>
              <h3>Reset Password</h3>
              <p>Enter your registered Email Address or Username to receive a 6-digit verification code.</p>
            </div>

            {errorMsg && <div className="forgot-alert-error">{errorMsg}</div>}

            <form onSubmit={handleRequestOtp} className="forgot-form">
              <div className="forgot-input-group">
                <label>Email Address or Username</label>
                <div className="forgot-input-wrapper">
                  <Mail size={18} className="forgot-input-icon" />
                  <input
                    type="text"
                    className="forgot-input"
                    placeholder="e.g. yourname@gmail.com or CON004"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="forgot-btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="forgot-spinner" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <span>Send Verification Code</span>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <button className="forgot-btn-back" onClick={() => setStep(1)} type="button">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div className="forgot-modal-header">
              <div className="forgot-modal-icon">
                <Lock size={28} />
              </div>
              <h3>Enter Verification Code</h3>
              <p>{successMsg || 'Enter the 6-digit OTP code sent to your email.'}</p>
            </div>

            {errorMsg && <div className="forgot-alert-error">{errorMsg}</div>}

            <form onSubmit={handleResetPassword} className="forgot-form">
              <div className="forgot-input-group">
                <label>6-Digit Verification Code (OTP)</label>
                <input
                  type="text"
                  maxLength={6}
                  className="forgot-input forgot-otp-input"
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <div className="forgot-input-group">
                <label>New Password</label>
                <div className="forgot-input-wrapper">
                  <Lock size={18} className="forgot-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="forgot-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="forgot-input-group">
                <label>Confirm New Password</label>
                <div className="forgot-input-wrapper">
                  <Lock size={18} className="forgot-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="forgot-input"
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="forgot-resend-row">
                {resendTimer > 0 ? (
                  <span>Resend code in <strong>{resendTimer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    className="forgot-resend-btn"
                    onClick={handleRequestOtp}
                    disabled={isLoading}
                  >
                    Resend Code
                  </button>
                )}
              </div>

              <button type="submit" className="forgot-btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="forgot-spinner" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <span>Set New Password</span>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="forgot-success-view">
            <div className="forgot-success-icon">
              <CheckCircle2 size={56} />
            </div>
            <h3>Password Reset Successful!</h3>
            <p>Your password has been securely updated. You can now log in with your new credentials.</p>
            <button type="button" className="forgot-btn-primary" onClick={onClose}>
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

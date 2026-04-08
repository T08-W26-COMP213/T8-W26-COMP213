import { useEffect } from "react";
import "./ConfirmationBanner.css";

export default function ConfirmationBanner({
  message,
  type,
  onClose = () => {},
  autoCloseDuration = 4000
}) {
  useEffect(() => {
    if (message && autoCloseDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [message, autoCloseDuration, onClose]);

  if (!message) return null;

  return (
    <div className={`confirmation-banner ${type}`}>
      <div className="banner-content">
        <div className="banner-icon">
          {type === "success" ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          )}
        </div>
        <p className="banner-message">{message}</p>
      </div>
      <button className="banner-close" onClick={onClose} aria-label="Close banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
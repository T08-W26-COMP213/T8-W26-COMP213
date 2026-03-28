import { useEffect, useState } from "react";

/**
 * ConfirmationBanner component (User Story 4)
 *
 * Displays a styled confirmation banner after a successful form submission.
 * The banner auto-dismisses after a configurable duration and includes
 * a manual close button. Supports success and error message types.
 *
 * @param {string} message - The message text to display in the banner.
 * @param {string} type - The type of message: "success" or "error".
 * @param {function} onClose - Callback invoked when the banner is dismissed.
 * @param {number} duration - Auto-dismiss duration in milliseconds (default: 4000).
 */
function ConfirmationBanner({ message, type = "success", onClose, duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setExiting(false);

    const dismissTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 400);
    }, duration);

    return () => clearTimeout(dismissTimer);
  }, [message, duration, onClose]);

  if (!visible || !message) return null;

  const bannerClass = `confirmation-banner ${type} ${exiting ? "exit" : "enter"}`;

  return (
    <div className={bannerClass} role="alert" aria-live="polite">
      <div className="confirmation-banner-content">
        <span className="confirmation-banner-icon">
          {type === "success" ? "\u2714" : "\u2716"}
        </span>
        <span className="confirmation-banner-text">{message}</span>
      </div>
      <button
        className="confirmation-banner-close"
        onClick={() => {
          setExiting(true);
          setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
          }, 400);
        }}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
}

export default ConfirmationBanner;

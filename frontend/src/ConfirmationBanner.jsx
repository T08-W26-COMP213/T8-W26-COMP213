import React from "react";

function ConfirmationBanner({ message, type }) {
  if (!message) return null;

  return (
    <div className={`confirmation-banner ${type}`}>
      {message}
    </div>
  );
}

export default ConfirmationBanner;
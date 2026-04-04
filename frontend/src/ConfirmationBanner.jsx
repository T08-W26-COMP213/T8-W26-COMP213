function ConfirmationBanner({ message, type }) {
  if (!message) return null;

  return (
    <div className={`status-message ${type}`}>
      {message}
    </div>
  );
}

export default ConfirmationBanner;
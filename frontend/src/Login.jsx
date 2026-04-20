import { useState } from "react";
import "./Login.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login({ onLogin }) {
  const [authView, setAuthView] = useState("signin");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const isSignUp = authView === "signup";
  const isSetPassword = authView === "set-password";
  const isForgotPassword = authView === "forgot-password";
  const isSignIn = authView === "signin";

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error || success) resetMessages();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!formData.username.trim()) {
          setError("Full name is required");
          setLoading(false);
          return;
        }
        if (!formData.role) {
          setError("Please select a role");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: formData.role
          })
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.message || "Registration failed");
          setLoading(false);
          return;
        }
        onLogin(data.user);
      } else if (isSignIn) {
        const normalizedEmail = formData.email.trim().toLowerCase();
        if (!normalizedEmail) {
          setError("Email is required");
          setLoading(false);
          return;
        }

        if (!formData.password) {
          const checkResponse = await fetch(`${API_BASE_URL}/api/auth/check-password-setup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail })
          });
          const checkData = await checkResponse.json();
          if (checkResponse.ok && checkData.requiresPasswordSetup) {
            setPendingEmail(normalizedEmail);
            setFormData((prev) => ({ ...prev, email: normalizedEmail, password: "", confirmPassword: "" }));
            setAuthView("set-password");
            setSuccess("This account has no password yet. Please create one.");
            setLoading(false);
            return;
          }
          setError(checkData.message || "Password is required");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: formData.password
          })
        });
        const data = await response.json();

        if (response.status === 428 && data.code === "PASSWORD_SETUP_REQUIRED") {
          setPendingEmail(normalizedEmail);
          setFormData((prev) => ({ ...prev, email: normalizedEmail, password: "", confirmPassword: "" }));
          setAuthView("set-password");
          setSuccess("This account has no password yet. Please create one.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setError(data.message || "Login failed");
          setLoading(false);
          return;
        }

        onLogin(data.user);
      } else {
        const normalizedEmail = (pendingEmail || formData.email).trim().toLowerCase();
        if (!normalizedEmail) {
          setError("Email is required");
          setLoading(false);
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const endpoint = isSetPassword ? "/api/auth/set-password" : "/api/auth/forgot-password";
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: normalizedEmail,
            password: formData.password,
            confirmPassword: formData.confirmPassword
          })
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.message || "Failed to save password");
          setLoading(false);
          return;
        }

        setPendingEmail(normalizedEmail);
        setFormData((prev) => ({ ...prev, email: normalizedEmail, password: "", confirmPassword: "" }));
        setAuthView("signin");
        setSuccess(data.message || "Password updated successfully. You can now sign in.");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setAuthView(isSignUp ? "signin" : "signup");
    setPendingEmail("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetMessages();
    setFormData({ username: "", email: "", password: "", confirmPassword: "", role: "" });
  };

  const openForgotPassword = () => {
    setAuthView("forgot-password");
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetMessages();
    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  const returnToSignIn = () => {
    setAuthView("signin");
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetMessages();
    setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  const pageTitle = isSignUp
    ? "Create your account"
    : isSetPassword
    ? "Set your password"
    : isForgotPassword
    ? "Reset password"
    : "Sign in";

  const subtitle = isSignUp
    ? "Enter your details below. You will choose your role for access to the right tools."
    : isSetPassword
    ? "This account was added by an administrator. Create your password to activate sign in."
    : isForgotPassword
    ? "Enter your email and set a new password."
    : "Use the email and password provided by your administrator.";

  return (
    <div className="login-page">
      <div className="login-split">
        <aside className="login-hero" aria-hidden="true">
          <div className="login-hero-pattern" />
          <div className="login-hero-content">
            <div className="login-hero-brand">
              <div className="login-hero-logo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="login-hero-name">StockGuard</span>
            </div>
            <h2 className="login-hero-headline">
              {isSignUp ? "Join your team on StockGuard." : "Sign in with confidence."}
            </h2>
            <p className="login-hero-lead">
              {isSignUp
                ? "Create an account to log usage, review risk alerts, and keep inventory under control."
                : "Hospital inventory and risk tracking - log usage, watch stock health, and catch shortages early."}
            </p>
            <ul className="login-hero-list">
              <li>Role-based access for staff, admins, and leadership</li>
              <li>Real-time alerts and usage history</li>
              <li>Built for clarity, not clutter</li>
            </ul>
          </div>
        </aside>

        <main className="login-form-panel">
          <div className="login-card">
            <div className="login-card-header">
              <p className="login-card-kicker">{isSignUp ? "Get started" : "Welcome back"}</p>
              <h1 className="login-title">{pageTitle}</h1>
              <p className="login-subtitle">{subtitle}</p>
            </div>

            {error && <div className="login-error" role="alert">{error}</div>}
            {success && !error && <div className="login-success" role="status">{success}</div>}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {isSignUp && (
                <div className="login-field">
                  <label htmlFor="username">Full name</label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="e.g. Jordan Lee"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="login-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@hospital.org"
                  value={pendingEmail || formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  inputMode="email"
                  readOnly={isSetPassword && Boolean(pendingEmail)}
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">{isForgotPassword ? "New Password" : "Password"}</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={isSignIn ? "Leave blank if account has no password yet" : "At least 6 characters"}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {(isSetPassword || isForgotPassword) && (
                <div className="login-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-wrapper">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                    >
                      {showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isSignUp && (
                <div className="login-field">
                  <label htmlFor="role">Your role</label>
                  <select id="role" name="role" value={formData.role} onChange={handleChange}>
                    <option value="">Select a role</option>
                    <optgroup label="Technical">
                      <option value="System Administrator">System Administrator</option>
                    </optgroup>
                    <optgroup label="Operational">
                      <option value="Operational Staff">Operational Staff</option>
                    </optgroup>
                    <optgroup label="Strategic">
                      <option value="Business Owner">Business Owner</option>
                      <option value="Stock Analyst">Stock Analyst</option>
                    </optgroup>
                  </select>
                </div>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? isSignUp
                    ? "Creating account..."
                    : isSetPassword
                    ? "Saving password..."
                    : isForgotPassword
                    ? "Resetting password..."
                    : "Signing in..."
                  : isSignUp
                  ? "Create account"
                  : isSetPassword
                  ? "Save Password"
                  : isForgotPassword
                  ? "Reset Password"
                  : "Sign in"}
              </button>
            </form>

            {isSignIn && (
              <div className="login-inline-actions">
                <button type="button" className="login-toggle-link" onClick={openForgotPassword}>
                  Forgot password?
                </button>
              </div>
            )}

            {(isSetPassword || isForgotPassword) && (
              <div className="login-inline-actions">
                <button type="button" className="login-toggle-link" onClick={returnToSignIn}>
                  Back to sign in
                </button>
              </div>
            )}

            {(isSignIn || isSignUp) && (
              <p className="login-toggle-text">
                {isSignUp ? "Already have an account? " : "New to StockGuard? "}
                <button type="button" className="login-toggle-link" onClick={switchMode}>
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;

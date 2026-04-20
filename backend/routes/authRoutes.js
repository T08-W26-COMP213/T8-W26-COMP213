const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * Normalizes user-provided emails for case-insensitive lookups.
 * @param {unknown} value
 * @returns {string}
 */
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

/**
 * Prevents sensitive fields from being returned to clients.
 * @param {import("../models/User")} user
 * @returns {{_id: unknown, username: string, email: string, role: string, status: string}}
 */
const sanitizeUserForClient = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status
});

/**
 * Creates a new account with an initial password.
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new User({
      username: username.trim(),
      email: normalizedEmail,
      password,
      hasPassword: true,
      role: role || "Operational Staff",
      status: "Active"
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
      user: sanitizeUserForClient(savedUser)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to register user", error: error.message });
  }
});

/**
 * Checks whether an account needs first-time password setup.
 */
router.post("/check-password-setup", async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact administrator." });
    }

    const requiresPasswordSetup = !user.password || user.hasPassword === false;
    return res.json({
      requiresPasswordSetup,
      message: requiresPasswordSetup
        ? "This account needs a password before you can sign in."
        : "Password is already set for this account."
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to check account password setup", error: error.message });
  }
});

/**
 * Sets an initial password for admin-created accounts.
 */
router.post("/set-password", async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact administrator." });
    }

    user.password = password;
    user.hasPassword = true;
    const savedUser = await user.save();

    return res.json({
      message: "Password set successfully. You can now sign in.",
      user: sanitizeUserForClient(savedUser)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to set password", error: error.message });
  }
});

/**
 * Resets an existing password for an active account.
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact administrator." });
    }

    user.password = password;
    user.hasPassword = true;
    await user.save();

    return res.json({ message: "Password reset successfully. You can now sign in." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
});

/**
 * Authenticates an account and returns profile metadata for the UI.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact administrator." });
    }

    if (!user.password || user.hasPassword === false) {
      return res.status(428).json({
        message: "This account does not have a password yet. Please set one first.",
        code: "PASSWORD_SETUP_REQUIRED"
      });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let resolvedRole = user.role;
    if (resolvedRole === "Strategic Role") {
      await User.collection.updateOne({ _id: user._id }, { $set: { role: "Business Owner" } });
      resolvedRole = "Business Owner";
    }

    res.json({
      message: "Login successful",
      user: {
        ...sanitizeUserForClient(user),
        role: resolvedRole
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

module.exports = router;

const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

/**
 * Returns all users sorted by most recently created.
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message
    });
  }
});

/**
 * Returns one user by MongoDB ObjectId.
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message
    });
  }
});

/**
 * Creates a user profile without an initial password.
 */
router.post("/", async (req, res) => {
  try {
    const { username, email, role, status } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({
        message: "Username is required"
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: null,
      hasPassword: false,
      role,
      status
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: savedUser
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create user",
      error: error.message
    });
  }
});

/**
 * Updates selected user fields by id.
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (username !== undefined) {
      if (!String(username).trim()) {
        return res.status(400).json({
          message: "Username cannot be empty"
        });
      }
      user.username = String(username).trim();
    }

    if (email !== undefined) {
      if (!String(email).trim()) {
        return res.status(400).json({
          message: "Email cannot be empty"
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: id }
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already exists"
        });
      }

      user.email = normalizedEmail;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (status !== undefined) {
      user.status = status;
    }

    const updatedUser = await user.save();

    res.json({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update user",
      error: error.message
    });
  }
});

/**
 * Deletes a user account by id.
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID"
      });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      message: "User deleted successfully",
      user: deletedUser
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message
    });
  }
});

module.exports = router;

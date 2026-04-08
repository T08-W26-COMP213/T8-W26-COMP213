const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true
    },
    role: {
      type: String,
      required: true,
      enum: ["System Administrator", "Operational Staff", "Business Owner"],
      default: "Operational Staff"
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
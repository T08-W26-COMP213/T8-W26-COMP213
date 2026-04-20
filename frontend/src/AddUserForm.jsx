import React, { useState } from "react";
import ConfirmationBanner from "./ConfirmationBanner";

function AddUserForm({ onUserAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          status: "Active"
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to add user.");
        setMessageType("error");
        return;
      }

      setMessage(data.message || "User added successfully.");
      setMessageType("success");

      setFormData({
        name: "",
        email: "",
        role: ""
      });

      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      setMessage("Server error while adding user.");
      setMessageType("error");
    }
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  return (
    <section className="panel glass-panel add-user-panel">
      <div className="panel-header">
        <h2>Add User</h2>
        <span className="panel-tag">System Administrator</span>
      </div>

      <form className="add-user-form" onSubmit={handleSubmit}>
        <div className="add-user-grid">
          <label>
            Full Name
            <input
              type="text"
              name="name"
              placeholder="Enter name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Select Role
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Choose role</option>
              <optgroup label="Technical Role">
                <option value="System Administrator">System Administrator</option>
              </optgroup>
              <optgroup label="Operational Role">
                <option value="Operational Staff">Operational Staff</option>
              </optgroup>
              <optgroup label="Strategic Role">
                <option value="Business Owner">Business Owner</option>
                <option value="Stock Analyst">Stock Analyst</option>
              </optgroup>
            </select>
          </label>
        </div>

        <div className="add-user-actions">
          <button type="submit">Add User</button>
        </div>
      </form>

      <ConfirmationBanner
        message={message}
        type={messageType}
        onClose={clearMessage}
        autoCloseDuration={2000}
      />
    </section>
  );
}

export default AddUserForm;
import React, { useState } from "react";

function AddUserForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User Added:", formData);
  };

  return (
  <div style={{ margin: "30px", textAlign: "center" }}>
    <h2>Add User</h2>

    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Enter Name"
        value={formData.name}
        onChange={handleChange}
        required
        style={{ marginRight: "10px", padding: "5px" }}
      />

      <input
        type="email"
        name="email"
        placeholder="Enter Email"
        value={formData.email}
        onChange={handleChange}
        required
        style={{ marginRight: "10px", padding: "5px" }}
      />

      <select
        name="role"
        value={formData.role}
        onChange={handleChange}
        required
        style={{ marginRight: "10px", padding: "5px" }}
      >
        <option value="">Select Role</option>
        <option value="Operational Staff">Operational Staff</option>
        <option value="Business Owner">Business Owner</option>
        <option value="Stock Analyst">Stock Analyst</option>
        <option value="System Admin">System Admin</option>
      </select>

      <button type="submit">Add User</button>
    </form>
  </div>
);
}

export default AddUserForm;
import React, { useEffect, useState } from "react";
import ConfirmationBanner from "./ConfirmationBanner";
import AddUserForm from "./AddUserForm";

const normalizeRoleLabel = (role) => (role === "Strategic Role" ? "Business Owner" : role);

function UserAccountManagementLayout() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "", status: "" });

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to fetch users.");
      setUsers(data);
    } catch (error) {
      setMessage(error.message || "Failed to load users.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId, username) => {
    const confirmed = window.confirm(`Are you sure you want to delete ${username}?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to delete user.");

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      setMessage(data.message || "User deleted successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Failed to delete user.");
      setMessageType("error");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditForm({
      username: user.username,
      email: user.email,
      role: normalizeRoleLabel(user.role),
      status: user.status
    });
    setMessage("");
    setMessageType("");
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: "", email: "", role: "", status: "" });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (userId) => {
    if (!editForm.username.trim()) {
      setMessage("Username cannot be empty.");
      setMessageType("error");
      return;
    }
    if (!editForm.email.trim()) {
      setMessage("Email cannot be empty.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editForm.username.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          status: editForm.status
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update user.");

      setUsers((prevUsers) =>
        prevUsers.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
      );
      setMessage(data.message || "User updated successfully.");
      setMessageType("success");
      setEditingUser(null);
      setEditForm({ username: "", email: "", role: "", status: "" });
    } catch (error) {
      setMessage(error.message || "Failed to update user.");
      setMessageType("error");
    }
  };

  return (
    <section className="panel glass-panel user-management-panel">
      <div className="panel-header">
        <h2>User Account Management</h2>
        <span className="panel-tag">Admin</span>
      </div>

      <ConfirmationBanner message={message} type={messageType} />

      <div className="user-management-grid">
        <AddUserForm onUserAdded={fetchUsers} />

        <div className="user-table-card">
          <div className="dashboard-section-header">
            <h3>User Accounts</h3>
          </div>

          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5">No user accounts found.</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      {editingUser === user._id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              name="username"
                              value={editForm.username}
                              onChange={handleEditChange}
                              className="edit-inline-input"
                            />
                          </td>
                          <td>
                            <input
                              type="email"
                              name="email"
                              value={editForm.email}
                              onChange={handleEditChange}
                              className="edit-inline-input"
                            />
                          </td>
                          <td>
                            <select
                              name="role"
                              value={editForm.role}
                              onChange={handleEditChange}
                              className="edit-inline-select"
                            >
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
                          </td>
                          <td>
                            <select
                              name="status"
                              value={editForm.status}
                              onChange={handleEditChange}
                              className="edit-inline-select"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button
                                type="button"
                                className="save-user-btn"
                                onClick={() => handleSaveEdit(user._id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="cancel-edit-btn"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{user.username}</td>
                          <td>{user.email}</td>
                          <td>{normalizeRoleLabel(user.role)}</td>
                          <td>
                            <span className={`status-badge ${user.status === "Active" ? "status-active" : "status-inactive"}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                              <button
                                type="button"
                                className="edit-user-btn"
                                onClick={() => handleEditClick(user)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="delete-user-btn"
                                onClick={() => handleDeleteUser(user._id, user.username)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UserAccountManagementLayout;

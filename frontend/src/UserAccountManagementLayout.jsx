import React, { useEffect, useState } from "react";
import ConfirmationBanner from "./ConfirmationBanner";

function UserAccountManagementLayout() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users.");
      }

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
    const confirmed = window.confirm(
      `Are you sure you want to delete ${username}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user.");
      }

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      setMessage(data.message || "User deleted successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Failed to delete user.");
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
        <div className="user-table-card">
          <div className="dashboard-section-header">
            <h3>User Accounts</h3>
          </div>

          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
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
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.status}</td>
                      <td>
                        <button
                          type="button"
                          className="delete-user-btn"
                          onClick={() => handleDeleteUser(user._id, user.username)}
                        >
                          Delete
                        </button>
                      </td>
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
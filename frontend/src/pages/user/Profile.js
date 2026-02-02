import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      navigate("/login");
      return;
    }
    fetchUserDetails(userData.id);
  }, []);

  const fetchUserDetails = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/users/${userId}`);
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
    } catch (err) {
      console.log("Error fetching user:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await axios.put(
        `http://localhost:8000/api/users/${user.id}`,
        formData
      );
      setUser(res.data);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem("user", JSON.stringify({ ...userData, ...res.data }));
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await axios.put(`http://localhost:8000/api/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setMessage("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to change password");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <>
        <ClientNavbar />
        <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
      </>
    );
  }

  return (
    <>
      <ClientNavbar />
      <div
        style={{
          padding: 24,
          background: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ marginBottom: 24 }}>My Profile</h1>

          {message && (
            <div
              style={{
                padding: 12,
                background: "#d1fae5",
                color: "#065f46",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: 12,
                background: "#fee2e2",
                color: "#991b1b",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {/* Profile Information */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ margin: 0 }}>Profile Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: "8px 16px",
                  background: isEditing ? "#6b7280" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {!isEditing ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: "#6b7280" }}>
                    Name
                  </label>
                  <div style={{ fontSize: 16, marginTop: 4 }}>
                    {user?.name || "N/A"}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: "#6b7280" }}>
                    Email
                  </label>
                  <div style={{ fontSize: 16, marginTop: 4 }}>
                    {user?.email || "N/A"}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: "#6b7280" }}>
                    Phone
                  </label>
                  <div style={{ fontSize: 16, marginTop: 4 }}>
                    {user?.phone || "N/A"}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, color: "#6b7280" }}>
                    Address
                  </label>
                  <div style={{ fontSize: 16, marginTop: 4 }}>
                    {user?.address || "N/A"}
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 600, color: "#6b7280" }}>
                    Role
                  </label>
                  <div style={{ fontSize: 16, marginTop: 4 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        background: user?.role === "admin" ? "#dbeafe" : "#d1fae5",
                        color: user?.role === "admin" ? "#1e40af" : "#065f46",
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {user?.role || "customer"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 15,
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 15,
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 15,
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 15,
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: "12px 24px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </button>
              </form>
            )}
          </div>

          {/* Change Password */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              marginBottom: 24,
            }}
          >
            <h2 style={{ marginBottom: 24 }}>Change Password</h2>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 15,
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 15,
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 15,
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Logout Button */}
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginBottom: 16 }}>Account Actions</h2>
            <button
              onClick={handleLogout}
              style={{
                padding: "12px 24px",
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

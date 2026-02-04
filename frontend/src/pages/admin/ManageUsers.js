import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/users");
      setUsers(res.data);
    } catch (err) {
      console.log("Error fetching users:", err);
    }
  };

  const deleteUser = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:8000/api/users/${id}`);
      setMsg(res.data.msg);
      fetchUsers();
    } catch (err) {
      setMsg("Error deleting user");
    }
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name || "", email: user.email || "" });
    setMsg("");
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({ name: "", email: "" });
  };

  const saveEdit = async (id) => {
    try {
      const res = await axios.put(`http://localhost:8000/api/users/${id}`, {
        name: editForm.name,
        email: editForm.email,
      });
      setMsg("User updated successfully");
      setEditingUserId(null);
      setEditForm({ name: "", email: "" });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...res.data } : u)));
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error updating user");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Manage Users</h1>

      {msg && <p style={{ color: "#10b981", marginBottom: "10px" }}>{msg}</p>}

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Email</th>
            <th style={th}>Role</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={td}>{u.id}</td>
              <td style={td}>
                {editingUserId === u.id ? (
                  <input
                    style={input}
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                ) : (
                  u.name
                )}
              </td>
              <td style={td}>
                {editingUserId === u.id ? (
                  <input
                    style={input}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                ) : (
                  u.email
                )}
              </td>
              <td style={td}>{u.role}</td>
              <td style={td}>
                {u.role !== "admin" && (
                  editingUserId === u.id ? (
                    <>
                      <button style={saveBtn} onClick={() => saveEdit(u.id)}>
                        Save
                      </button>
                      <button style={cancelBtn} onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button style={editBtn} onClick={() => startEdit(u)}>
                      Edit
                    </button>
                  )
                )}
                <button style={delBtn} onClick={() => deleteUser(u.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle = {
  width: "100%",
  background: "#fff",
  borderCollapse: "collapse",
  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
};

const th = {
  padding: "12px",
  background: "#e5e7eb",
  textAlign: "left",
};

const td = {
  padding: "12px",
  borderTop: "1px solid #e5e7eb",
};

const input = {
  padding: "6px 8px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  width: "100%",
  boxSizing: "border-box",
};

const editBtn = {
  padding: "6px 12px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px",
};

const saveBtn = {
  padding: "6px 12px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px",
};

const cancelBtn = {
  padding: "6px 12px",
  background: "#6b7280",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  marginRight: "8px",
};

const delBtn = {
  padding: "6px 12px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ManageCategory() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.log("Error fetching categories:", err);
    }
  };

  const addCategory = async () => {
    if (!newCategory) return;

    try {
      const res = await axios.post("http://localhost:8000/api/categories", {
        cname: newCategory,
        description: "",
      });
      setMsg(res.data.msg);
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      setMsg("Error adding category");
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:8000/api/categories/${id}`);
      setMsg(res.data.msg);
      fetchCategories();
    } catch (err) {
      setMsg("Error deleting category");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Manage Category</h1>

      {msg && <p style={{ color: "#10b981", marginBottom: "10px" }}>{msg}</p>}

      {/* Add Category */}
      <div style={{ marginBottom: "20px" }}>
        <input
          style={input}
          placeholder="New Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button style={addBtn} onClick={addCategory}>
          Add
        </button>
      </div>

      {/* Category Table */}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Category Name</th>
            <th style={th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.id}>
              <td style={td}>{c.id}</td>
              <td style={td}>{c.cname || c.name}</td>
              <td style={td}>
                <button style={delBtn} onClick={() => deleteCategory(c.id)}>
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

const input = {
  padding: "8px",
  marginRight: "8px",
};

const addBtn = {
  padding: "8px 14px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

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

const delBtn = {
  padding: "6px 12px",
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

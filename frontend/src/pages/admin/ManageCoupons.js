import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ManageCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState("");
  
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order_value: "",
    max_discount: "",
    usage_limit: "",
    expiry_date: ""
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/coupons");
      setCoupons(res.data);
    } catch (err) {
      console.log("Error fetching coupons:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!formData.code || !formData.discount_value) {
      setMsg("Code and discount value are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/coupons", formData);
      setMsg(res.data.msg);
      
      if (res.data.msg === "Coupon created successfully") {
        setFormData({
          code: "",
          discount_type: "percentage",
          discount_value: "",
          min_order_value: "",
          max_discount: "",
          usage_limit: "",
          expiry_date: ""
        });
        setShowForm(false);
        fetchCoupons();
      }
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error creating coupon");
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.put(`http://localhost:8000/api/coupons/${id}`, {
        is_active: !currentStatus
      });
      fetchCoupons();
    } catch (err) {
      console.log("Error updating coupon:", err);
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    
    try {
      await axios.delete(`http://localhost:8000/api/coupons/${id}`);
      setMsg("Coupon deleted successfully");
      fetchCoupons();
    } catch (err) {
      setMsg("Error deleting coupon");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Manage Coupons</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            background: "#10b981",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showForm ? "Cancel" : "+ Add Coupon"}
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: 12,
            background: msg.includes("success") ? "#d1fae5" : "#fee2e2",
            color: msg.includes("success") ? "#065f46" : "#991b1b",
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          {msg}
        </div>
      )}

      {showForm && (
        <div
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginBottom: 24,
          }}
        >
          <h2 style={{ marginTop: 0 }}>Create New Coupon</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Discount Type *
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Discount Value * {formData.discount_type === "percentage" ? "(%)" : "(₹)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === "percentage" ? "e.g., 20" : "e.g., 100"}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.min_order_value}
                  onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                  placeholder="e.g., 500"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                />
              </div>

              {formData.discount_type === "percentage" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                    Maximum Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="e.g., 500"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Usage Limit
                </label>
                <input
                  type="number"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="e.g., 100 (leave empty for unlimited)"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 500 }}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: 20,
                padding: "10px 24px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Create Coupon
            </button>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Code</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Type</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Discount</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Min Order</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Usage</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Expiry</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Status</th>
              <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                  No coupons created yet
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: 12, fontWeight: 600, color: "#10b981" }}>
                    {coupon.code}
                  </td>
                  <td style={{ padding: 12 }}>
                    {coupon.discount_type === "percentage" ? "Percentage" : "Flat"}
                  </td>
                  <td style={{ padding: 12 }}>
                    {coupon.discount_type === "percentage" 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount && ` (max ₹${coupon.max_discount})`}
                  </td>
                  <td style={{ padding: 12 }}>
                    {coupon.min_order_value > 0 ? `₹${coupon.min_order_value}` : "None"}
                  </td>
                  <td style={{ padding: 12 }}>
                    {coupon.used_count}
                    {coupon.usage_limit ? ` / ${coupon.usage_limit}` : " / ∞"}
                  </td>
                  <td style={{ padding: 12 }}>
                    {coupon.expiry_date 
                      ? new Date(coupon.expiry_date).toLocaleDateString()
                      : "No expiry"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 600,
                        background: coupon.is_active ? "#d1fae5" : "#fee2e2",
                        color: coupon.is_active ? "#065f46" : "#991b1b",
                      }}
                    >
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      style={{
                        padding: "6px 12px",
                        background: coupon.is_active ? "#fbbf24" : "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        marginRight: 8,
                        fontSize: 12,
                      }}
                    >
                      {coupon.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
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
  );
}

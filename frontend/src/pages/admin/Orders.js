import React, { useState, useEffect } from "react";
import axios from "axios";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const fetchAllOrders = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/orders");
      console.log("All orders fetched:", res.data);
      setOrders(res.data);
    } catch (err) {
      console.log("Error fetching orders:", err);
      setMsg("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      setMsg("");
      const res = await axios.put(
        `http://localhost:8000/api/orders/${orderId}/status`,
        { status: newStatus }
      );

      if (res.data.msg) {
        setMsg(`Order ${orderId} status updated to ${newStatus}`);
        fetchAllOrders();
      }
    } catch (err) {
      console.log("Error updating status:", err);
      setMsg("Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return { bg: "#d1fae5", color: "#065f46" };
      case "Dispatched":
        return { bg: "#dbeafe", color: "#1e40af" };
      case "Approved":
        return { bg: "#fef3c7", color: "#92400e" };
      case "Pending":
        return { bg: "#fee2e2", color: "#991b1b" };
      default:
        return { bg: "#f3f4f6", color: "#374151" };
    }
  };

  const exportToCSV = () => {
    if (orders.length === 0) {
      setMsg("No orders to export");
      return;
    }

    // CSV Headers
    const headers = [
      "Order ID",
      "User ID",
      "Date",
      "Items",
      "Total Amount",
      "Status",
      "Payment Method",
      "Shipping Address"
    ];

    // Convert orders to CSV rows
    const rows = orders.map(order => {
      const items = order.items 
        ? order.items.map(item => `${item.description} (x${item.quantity})`).join("; ")
        : "N/A";
      
      return [
        order.order_id || "N/A",
        order.user_id || "N/A",
        order.date ? new Date(order.date).toLocaleDateString() : "N/A",
        items,
        order.net_total || 0,
        order.status || "N/A",
        order.payment_method || "N/A",
        order.shipping_address || "N/A"
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or newline
          const cellStr = String(cell).replace(/"/g, '""');
          return cellStr.includes(',') || cellStr.includes('\n') 
            ? `"${cellStr}"` 
            : cellStr;
        }).join(",")
      )
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMsg("Orders exported successfully!");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>Manage Orders</h1>
        <button
          onClick={exportToCSV}
          style={{
            padding: "10px 20px",
            background: "#10b981",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseOver={(e) => e.target.style.background = "#059669"}
          onMouseOut={(e) => e.target.style.background = "#10b981"}
        >
          📥 Export CSV
        </button>
      </div>

      {msg && (
        <div
          style={{
            padding: 12,
            marginBottom: 16,
            background: msg.includes("Failed") ? "#fee2e2" : "#d1fae5",
            color: msg.includes("Failed") ? "#991b1b" : "#065f46",
            borderRadius: 8,
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: 40,
            borderRadius: 10,
            textAlign: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          <p style={{ color: "#6b7280" }}>No orders placed yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {orders.map((o) => {
            const statusColors = getStatusColor(o.status);
            const isExpanded = expandedOrder === o.order_id;

            return (
              <div
                key={o.order_id}
                style={{
                  background: "#fff",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: 20,
                    alignItems: "center",
                    marginBottom: isExpanded ? 16 : 0,
                    paddingBottom: isExpanded ? 16 : 0,
                    borderBottom: isExpanded ? "2px solid #f3f4f6" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {o.order_id}
                    </div>
                    <div
                      style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}
                    >
                      {new Date(o.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Customer
                    </div>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}
                    >
                      User #{o.user_id}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>Amount</div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#10b981",
                        marginTop: 2,
                      }}
                    >
                      ₹{Number(o.net_total).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 600,
                        background: statusColors.bg,
                        color: statusColors.color,
                      }}
                    >
                      {o.status}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.order_id, e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                    </select>

                    <button
                      onClick={() =>
                        setExpandedOrder(isExpanded ? null : o.order_id)
                      }
                      style={{
                        padding: "8px 12px",
                        background: "#f3f4f6",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: 16 }}>
                    {o.shipping_address && (
                      <div
                        style={{
                          marginBottom: 16,
                          padding: 12,
                          background: "#f9fafb",
                          borderRadius: 8,
                        }}
                      >
                        <strong style={{ fontSize: 14 }}>
                          Shipping Address:
                        </strong>
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 14,
                            color: "#374151",
                          }}
                        >
                          {o.shipping_address}
                        </p>
                      </div>
                    )}

                    {o.payment_method && (
                      <div style={{ marginBottom: 16, fontSize: 14 }}>
                        <strong>Payment Method:</strong> {o.payment_method}
                      </div>
                    )}

                    {o.items && o.items.length > 0 && (
                      <div>
                        <strong
                          style={{
                            display: "block",
                            marginBottom: 12,
                            fontSize: 14,
                          }}
                        >
                          Order Items:
                        </strong>
                        <table
                          style={{ width: "100%", borderCollapse: "collapse" }}
                        >
                          <thead>
                            <tr style={{ background: "#f9fafb" }}>
                              <th
                                style={{
                                  padding: 10,
                                  textAlign: "left",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Product
                              </th>
                              <th
                                style={{
                                  padding: 10,
                                  textAlign: "center",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Quantity
                              </th>
                              <th
                                style={{
                                  padding: 10,
                                  textAlign: "right",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Price
                              </th>
                              <th
                                style={{
                                  padding: 10,
                                  textAlign: "right",
                                  fontSize: 13,
                                  fontWeight: 600,
                                }}
                              >
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map((item, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: "1px solid #f3f4f6",
                                }}
                              >
                                <td style={{ padding: 10, fontSize: 14 }}>
                                  {item.description}
                                </td>
                                <td
                                  style={{
                                    padding: 10,
                                    textAlign: "center",
                                    fontSize: 14,
                                  }}
                                >
                                  {item.quantity || 1}
                                </td>
                                <td
                                  style={{
                                    padding: 10,
                                    textAlign: "right",
                                    fontSize: 14,
                                  }}
                                >
                                  ₹{Number(item.price).toFixed(2)}
                                </td>
                                <td
                                  style={{
                                    padding: 10,
                                    textAlign: "right",
                                    fontSize: 14,
                                    fontWeight: 600,
                                  }}
                                >
                                  ₹
                                  {(
                                    Number(item.price) * (item.quantity || 1)
                                  ).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

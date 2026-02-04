import React, { useEffect, useState } from "react";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";
import Breadcrumbs from "../../components/Breadcrumbs";

// Order Timeline Component
const OrderTimeline = ({ status }) => {
  if (status === "Cancelled") {
    return (
      <div style={{ padding: "20px 0" }}>
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            color: "#991b1b",
            borderRadius: 8,
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Order Cancelled
        </div>
      </div>
    );
  }
  const stages = ["Pending", "Approved", "Dispatched", "Delivered"];
  const currentIndex = stages.indexOf(status);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        {/* Progress Line */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "5%",
            right: "5%",
            height: 4,
            background: "#e5e7eb",
            borderRadius: 2,
            zIndex: 0,
          }}
        >
          <div
            style={{
              height: "100%",
              background: "#10b981",
              borderRadius: 2,
              width: `${(currentIndex / (stages.length - 1)) * 100}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        {/* Stage Dots */}
        {stages.map((stage, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={stage}
              style={{
                flex: 1,
                textAlign: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: isCompleted ? "#10b981" : "#e5e7eb",
                  border: isCurrent ? "4px solid #6ee7b7" : "none",
                  margin: "0 auto 8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  transition: "all 0.3s ease",
                }}
              >
                {isCompleted ? "✓" : index + 1}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 600 : 400,
                  color: isCompleted ? "#10b981" : "#6b7280",
                }}
              >
                {stage}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const userDataStr = localStorage.getItem("user");
      console.log("Raw user data from localStorage:", userDataStr);
      
      const userData = JSON.parse(userDataStr);
      console.log("Parsed user data:", userData);
      console.log("User data from localStorage:", userData);
      
      if (!userData || !userData.id) {
        console.log("No user data or user ID found");
        setLoading(false);
        return;
      }

      console.log("Fetching orders for user ID:", userData.id, "Type:", typeof userData.id);
      const res = await axios.get(`http://localhost:8000/api/orders/${userData.id}`);
              <Breadcrumbs items={[{ label: "Orders" }]} />
      console.log("Orders API Response:", res.data);
      console.log("Orders fetched:", res.data);
      setOrders(res.data);
    } catch (err) {
      console.log("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 style={{ marginBottom: 20 }}>My Orders</h1>

        {loading ? (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 10,
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: 40,
              borderRadius: 10,
              textAlign: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            }}
          >
            <p style={{ color: "#6b7280", marginBottom: 16 }}>
              You have not placed any orders yet.
            </p>
            <button
              onClick={() => (window.location.href = "/shop")}
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
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.order_id}
              style={{
                background: "#fff",
                padding: 24,
                borderRadius: 12,
                marginBottom: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom: "2px solid #f3f4f6",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                    Order #{o.order_id}
                  </p>
                  <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
                    {new Date(o.date).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    ₹{Number(o.net_total).toFixed(2)}
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 6,
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      background:
                        o.status === "Delivered"
                          ? "#d1fae5"
                          : o.status === "Dispatched"
                          ? "#dbeafe"
                          : o.status === "Approved"
                          ? "#fef3c7"
                          : o.status === "Cancelled"
                          ? "#f3f4f6"
                          : "#fee2e2",
                      color:
                        o.status === "Delivered"
                          ? "#065f46"
                          : o.status === "Dispatched"
                          ? "#1e40af"
                          : o.status === "Approved"
                          ? "#92400e"
                          : o.status === "Cancelled"
                          ? "#6b7280"
                          : "#991b1b",
                    }}
                  >
                    {o.status}
                  </span>
                </div>
              </div>

              {/* Order Timeline */}
              <OrderTimeline status={o.status} />

              {o.shipping_address && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: "#f9fafb",
                    borderRadius: 8,
                    fontSize: 14,
                  }}
                >
                  <strong>Shipping Address:</strong>
                  <p style={{ margin: "6px 0 0", color: "#374151" }}>
                    {o.shipping_address}
                  </p>
                </div>
              )}

              {o.payment_method && (
                <div style={{ marginBottom: 16, fontSize: 14 }}>
                  <strong>Payment:</strong> {o.payment_method}
                </div>
              )}

              {o.items && o.items.length > 0 && (
                <div>
                  <strong style={{ display: "block", marginBottom: 8 }}>
                    Items:
                  </strong>
                  {o.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom:
                          idx < o.items.length - 1 ? "1px solid #f3f4f6" : "none",
                        fontSize: 14,
                      }}
                    >
                      <span>
                        {item.description} × {item.quantity || 1}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        ₹{(Number(item.price) * (item.quantity || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}

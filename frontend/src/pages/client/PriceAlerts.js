import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";
import Breadcrumbs from "../../components/Breadcrumbs";
import { toast } from "react-toastify";

export default function PriceAlerts() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      navigate("/login");
      return;
    }
    setUserId(userData.id);
    fetchAlerts(userData.id);
  }, []);

  const fetchAlerts = async (uid) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/price-alerts/${uid}`);
      setAlerts(res.data);
    } catch (err) {
      console.log("Error fetching price alerts:", err);
      toast.error("Failed to load price alerts");
    } finally {
      setLoading(false);
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm("Remove this price alert?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/price-alerts/${alertId}`);
      setAlerts(alerts.filter((a) => a.id !== alertId));
      toast.success("Price alert removed");
    } catch (err) {
      console.log("Error deleting alert:", err);
      toast.error("Failed to remove alert");
    }
  };

  const checkPriceDrops = async () => {
    try {
      const res = await axios.post("http://localhost:8000/api/price-alerts/check");
      if (res.data.triggered.length > 0) {
        toast.success(`${res.data.triggered.length} price drop(s) detected!`);
        fetchAlerts(userId);
      } else {
        toast.info("No price drops at the moment");
      }
    } catch (err) {
      console.log("Error checking price drops:", err);
      toast.error("Failed to check prices");
    }
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

      <div style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}>
        <Breadcrumbs items={[{ label: "Price Alerts" }]} />
        
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: 24 
          }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Price Alerts</h1>
            <button 
              onClick={checkPriceDrops}
              className="btn-primary btn-md"
            >
              🔔 Check Prices Now
            </button>
          </div>

          {alerts.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: 60,
                borderRadius: 12,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
              <h3 style={{ color: "#6b7280", marginBottom: 12 }}>No Price Alerts</h3>
              <p style={{ color: "#9ca3af", marginBottom: 24 }}>
                Set price alerts on products to get notified when prices drop
              </p>
              <button
                onClick={() => navigate("/shop")}
                className="btn-primary btn-md"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {alerts.map((alert) => {
                const priceDropped = alert.product_price <= alert.target_price;
                const percentageDrop = ((alert.current_price - alert.product_price) / alert.current_price * 100).toFixed(1);

                return (
                  <div
                    key={alert.id}
                    style={{
                      background: "#fff",
                      padding: 20,
                      borderRadius: 12,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      display: "grid",
                      gridTemplateColumns: "80px 1fr auto",
                      gap: 20,
                      alignItems: "center",
                      border: priceDropped ? "2px solid #10b981" : "1px solid #e5e7eb",
                      position: "relative",
                      overflow: "hidden"
                    }}
                  >
                    {priceDropped && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          background: "#10b981",
                          color: "#fff",
                          padding: "4px 12px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderBottomLeftRadius: 8,
                        }}
                      >
                        🎉 Price Dropped!
                      </div>
                    )}

                    {/* Product Image */}
                    <div
                      onClick={() => navigate(`/product/${alert.product_id}`)}
                      style={{
                        cursor: "pointer",
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        overflow: "hidden",
                        background: "#f3f4f6",
                      }}
                    >
                      {alert.image ? (
                        <img
                          src={`http://localhost:8000${alert.image}`}
                          alt={alert.pname}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                          }}
                        >
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Alert Info */}
                    <div>
                      <h3
                        onClick={() => navigate(`/product/${alert.product_id}`)}
                        style={{
                          margin: "0 0 8px",
                          fontSize: 18,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "#111827",
                        }}
                        className="hover:text-primary transition-colors"
                      >
                        {alert.pname}
                      </h3>

                      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                            Current Price
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: priceDropped ? "#10b981" : "#111827" }}>
                            ₹{alert.product_price}
                          </div>
                        </div>

                        <div style={{ fontSize: 20, color: "#d1d5db" }}>→</div>

                        <div>
                          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                            Target Price
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
                            ₹{alert.target_price}
                          </div>
                        </div>

                        {priceDropped && (
                          <div
                            style={{
                              padding: "4px 10px",
                              background: "#d1fae5",
                              color: "#065f46",
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {percentageDrop > 0 ? `${percentageDrop}% off` : 'Target reached!'}
                          </div>
                        )}

                        {alert.notified && (
                          <div
                            style={{
                              padding: "4px 10px",
                              background: "#e0e7ff",
                              color: "#3730a3",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            ✓ Notified
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
                        Created: {new Date(alert.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => navigate(`/product/${alert.product_id}`)}
                        className="btn-primary btn-sm"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        View Product
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="btn-outline-danger btn-sm"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Remove Alert
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

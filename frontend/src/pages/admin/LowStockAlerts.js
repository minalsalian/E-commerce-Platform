import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LowStockAlerts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [threshold, setThreshold] = useState(10);
  const [updatingStock, setUpdatingStock] = useState(null);
  const placeholderImage = "/images/placeholder.svg";
  const resolveImage = (image) => {
    const normalized = String(image || "").trim().toLowerCase();
    if (!image || normalized === "null" || normalized === "undefined") {
      return placeholderImage;
    }
    if (image.startsWith("http")) return image;
    if (image.startsWith("/images/")) return image;
    if (image.startsWith("images/")) return `/${image}`;
    if (image.startsWith("uploads/")) return `http://localhost:8000/${image}`;
    if (image.startsWith("/")) return `http://localhost:8000${image}`;
    return `http://localhost:8000/uploads/${image}`;
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, [threshold]);

  const fetchLowStockProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/low-stock", {
        params: { threshold },
      });
      setProducts(res.data);
      setMsg(
        res.data.length === 0
          ? `No products with stock below ${threshold} units`
          : `Found ${res.data.length} product(s) with low stock`
      );
    } catch (err) {
      console.log("Error fetching low stock products:", err);
      setMsg("Failed to fetch low stock products");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId, newStock) => {
    if (newStock === "" || newStock === null) {
      setMsg("Please enter a stock quantity");
      return;
    }

    setUpdatingStock(productId);
    try {
      const res = await axios.put(
        `http://localhost:8000/api/products/${productId}/stock`,
        { stock: parseInt(newStock) }
      );
      setMsg(res.data.msg);
      fetchLowStockProducts();
    } catch (err) {
      console.log("Error updating stock:", err);
      setMsg("Failed to update stock");
    } finally {
      setUpdatingStock(null);
    }
  };

  const getStockColor = (stock) => {
    if (stock === 0) return { color: "#dc2626", label: "OUT OF STOCK" };
    if (stock <= 5) return { color: "#ea580c", label: "CRITICAL" };
    if (stock <= threshold) return { color: "#eab308", label: "LOW" };
    return { color: "#10b981", label: "OK" };
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ marginBottom: "20px" }}>📦 Low Stock Alerts</h1>

        <div
          style={{
            display: "flex",
            gap: "15px",
            alignItems: "center",
            marginBottom: "20px",
            padding: "15px",
            background: "#f3f4f6",
            borderRadius: "8px",
          }}
        >
          <label style={{ fontWeight: "500" }}>Stock Threshold:</label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              width: "80px",
            }}
            min="1"
          />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            Show products with stock ≤ {threshold} units
          </span>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            background: msg.includes("Failed") ? "#fee2e2" : "#d1fae5",
            color: msg.includes("Failed") ? "#991b1b" : "#065f46",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", fontSize: "16px", color: "#6b7280" }}>
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            background: "#f9fafb",
            borderRadius: "8px",
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          ✓ All products have sufficient stock
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "20px",
          }}
        >
          {products.map((product) => {
            const stockInfo = getStockColor(product.stock);
            return (
              <div
                key={product.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  overflow: "hidden",
                  background: "white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Product Image */}
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={resolveImage(product.image)}
                    alt={product.pname}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>

                {/* Stock Alert Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: stockInfo.color,
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                >
                  {stockInfo.label}
                </div>

                {/* Product Details */}
                <div style={{ padding: "16px" }}>
                  <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: "600" }}>
                    {product.pname}
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: "13px",
                      color: "#6b7280",
                      lineHeight: "1.4",
                    }}
                  >
                    {product.description || "No description"}
                  </p>

                  {/* Price and Stock Display */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
                      ₹{product.price}
                    </span>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: stockInfo.color,
                      }}
                    >
                      Stock: {product.stock}
                    </div>
                  </div>

                  {/* Stock Update */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "500",
                        marginBottom: "6px",
                        color: "#374151",
                      }}
                    >
                      Update Stock:
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="number"
                        defaultValue={product.stock}
                        id={`stock-${product.id}`}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                        }}
                        min="0"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`stock-${product.id}`);
                          updateStock(product.id, input.value);
                        }}
                        disabled={updatingStock === product.id}
                        style={{
                          padding: "8px 16px",
                          background: updatingStock === product.id ? "#9ca3af" : "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: updatingStock === product.id ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          fontWeight: "500",
                        }}
                      >
                        {updatingStock === product.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        const input = document.getElementById(`stock-${product.id}`);
                        input.value = Math.max(0, parseInt(input.value || 0) - 1);
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      -1
                    </button>
                    <button
                      onClick={() => {
                        const input = document.getElementById(`stock-${product.id}`);
                        input.value = parseInt(input.value || 0) + 1;
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      +1
                    </button>
                    <button
                      onClick={() => {
                        const input = document.getElementById(`stock-${product.id}`);
                        input.value = parseInt(input.value || 0) + 10;
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        background: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

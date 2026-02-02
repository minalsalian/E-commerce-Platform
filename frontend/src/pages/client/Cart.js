import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClientNavbar from "../../components/ClientNavbar";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function Cart() {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();
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
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
    if (data.length > 0) {
      refreshCartImages(data);
    }
  }, []);

  const refreshCartImages = async (items) => {
    try {
      const ids = Array.from(new Set(items.map((i) => i.id)));
      const responses = await Promise.all(
        ids.map((id) =>
          axios
            .get(`http://localhost:8000/api/products/${id}`)
            .then((res) => ({ id, image: res.data?.image }))
            .catch(() => null)
        )
      );
      const imageMap = responses.reduce((acc, entry) => {
        if (entry && entry.image) acc[entry.id] = entry.image;
        return acc;
      }, {});
      const updated = items.map((item) =>
        imageMap[item.id] ? { ...item, image: imageMap[item.id] } : item
      );
      setCart(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
    } catch (err) {
      console.log("Error refreshing cart images:", err);
    }
  };

  const increaseQty = (id, variantId) => {
    const updated = cart.map((c) => {
      if (variantId) {
        return c.id === id && c.variant_id === variantId ? { ...c, qty: c.qty + 1 } : c;
      }
      return c.id === id && !c.variant_id ? { ...c, qty: c.qty + 1 } : c;
    });
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const decreaseQty = (id, variantId) => {
    const updated = cart.map((c) => {
      if (variantId) {
        return c.id === id && c.variant_id === variantId && c.qty > 1 ? { ...c, qty: c.qty - 1 } : c;
      }
      return c.id === id && !c.variant_id && c.qty > 1 ? { ...c, qty: c.qty - 1 } : c;
    });
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const removeItem = (id, variantId) => {
    const updated = cart.filter((c) => {
      if (variantId) {
        return !(c.id === id && c.variant_id === variantId);
      }
      return !(c.id === id && !c.variant_id);
    });
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  const clearCart = () => {
    if (window.confirm("Are you sure you want to clear the cart?")) {
      setCart([]);
      localStorage.removeItem("cart");
    }
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

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
        <Breadcrumbs items={[{ label: "Shop", to: "/shop" }, { label: "Cart" }]} />
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
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
            <h1 style={{ margin: 0 }}>Shopping Cart ({cart.length})</h1>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="btn-danger btn-sm"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: 60,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
              <h3 style={{ marginBottom: 8 }}>Your cart is empty</h3>
              <p style={{ color: "#6b7280", marginBottom: 20 }}>
                Start adding products to your cart
              </p>
              <button
                onClick={() => navigate("/shop")}
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
                Continue Shopping
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 24,
              }}
            >
              {/* Cart Items */}
              <div>
                {cart.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: "#fff",
                      padding: 20,
                      borderRadius: 12,
                      marginBottom: 16,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                      display: "flex",
                      gap: 20,
                    }}
                  >
                    {/* Product Image */}
                    <div
                      onClick={() => navigate(`/product/${c.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {c.image ? (
                        <img
                          src={resolveImage(c.image)}
                          alt={c.pname}
                          style={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "1px solid #e5e7eb",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = placeholderImage;
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 120,
                            height: 120,
                            background: "#f3f4f6",
                            borderRadius: 8,
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

                    {/* Product Details */}
                    <div style={{ flex: 1 }}>
                      <h3
                        onClick={() => navigate(`/product/${c.id}`)}
                        style={{
                          margin: "0 0 8px",
                          cursor: "pointer",
                          color: "#111827",
                        }}
                      >
                        {c.pname}
                      </h3>
                      {/* Show variant info if available */}
                      {(c.variant_size || c.variant_color) && (
                        <div
                          style={{
                            color: "#6b7280",
                            fontSize: 13,
                            marginBottom: 8,
                            fontWeight: 500,
                          }}
                        >
                          {c.variant_size && <span>Size: {c.variant_size}</span>}
                          {c.variant_size && c.variant_color && <span> | </span>}
                          {c.variant_color && <span>Color: {c.variant_color}</span>}
                        </div>
                      )}
                      <div
                        style={{
                          color: "#6b7280",
                          fontSize: 14,
                          marginBottom: 16,
                        }}
                      >
                        {c.description
                          ? c.description.substring(0, 60) + "..."
                          : ""}
                      </div>
                      <div
                        className="text-xl font-bold text-success"
                      >
                        ₹{c.price}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <button
                        onClick={() => removeItem(c.id, c.variant_id)}
                        className="text-danger text-2xl cursor-pointer p-1 hover:scale-110 transition-transform"
                        title="Remove item"
                      >
                        ×
                      </button>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <button
                            onClick={() => decreaseQty(c.id, c.variant_id)}
                            style={{
                              width: 32,
                              height: 32,
                              background: "#f3f4f6",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 18,
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: 40,
                              textAlign: "center",
                              fontWeight: 600,
                              fontSize: 16,
                            }}
                          >
                            {c.qty}
                          </span>
                          <button
                            onClick={() => increaseQty(c.id, c.variant_id)}
                            style={{
                              width: 32,
                              height: 32,
                              background: "#f3f4f6",
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 18,
                            }}
                          >
                            +
                          </button>
                        </div>

                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 18,
                            textAlign: "right",
                          }}
                        >
                          ₹{(c.price * c.qty).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <div
                  style={{
                    background: "#fff",
                    padding: 24,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    position: "sticky",
                    top: 24,
                  }}
                >
                  <h2 style={{ marginBottom: 20 }}>Order Summary</h2>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      fontSize: 15,
                    }}
                  >
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>₹{total.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      fontSize: 15,
                      color: "#6b7280",
                    }}
                  >
                    <span>Delivery Fee</span>
                    <span>
                      {total >= 500 ? (
                        <span style={{ color: "#10b981", fontWeight: 600 }}>
                          FREE
                        </span>
                      ) : (
                        "₹40"
                      )}
                    </span>
                  </div>

                  <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 24,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    <span>Total</span>
                    <span className="text-success">
                      ₹{(total >= 500 ? total : total + 40).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate("/checkout")}
                    className="btn-success w-full mb-3"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => navigate("/shop")}
                    className="btn-outline-success w-full"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

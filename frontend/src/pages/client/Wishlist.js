import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";
import { StarRating } from "../../components/StarRating";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function Wishlist() {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      navigate("/login");
      return;
    }
    fetchWishlist(userData.id);
  }, []);

            <Breadcrumbs items={[{ label: "Shop", to: "/shop" }, { label: "Wishlist" }]} />
  const fetchWishlist = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/wishlist/${userId}`);
      setWishlistItems(res.data);
    } catch (err) {
      console.log("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId, productName) => {
    try {
      await axios.delete(`http://localhost:8000/api/wishlist/${wishlistId}`);
      setWishlistItems(wishlistItems.filter((item) => item.id !== wishlistId));
      setMessage(`${productName} removed from wishlist`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.log("Error removing from wishlist:", err);
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((p) => p.id === product.product_id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ 
        id: product.product_id,
        pname: product.pname,
        price: product.price,
        image: product.image,
        description: product.description,
        qty: 1 
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setMessage(`${product.pname} added to cart`);
    setTimeout(() => setMessage(""), 3000);
  };

  const moveToCart = async (product) => {
    addToCart(product);
    await removeFromWishlist(product.id, product.pname);
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
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ marginBottom: 24 }}>My Wishlist ({wishlistItems.length})</h1>

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

          {wishlistItems.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: 60,
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>💝</div>
              <h3 style={{ marginBottom: 8 }}>Your wishlist is empty</h3>
              <p style={{ color: "#6b7280", marginBottom: 20 }}>
                Save items you love for later!
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
                Start Shopping
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 20,
              }}
            >
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    position: "relative",
                  }}
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id, item.pname)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      cursor: "pointer",
                      fontSize: 20,
                      color: "#ef4444",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                    title="Remove from wishlist"
                  >
                    ×
                  </button>

                  {/* Product Image */}
                  <div
                    onClick={() => navigate(`/product/${item.product_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.image ? (
                      <img
                        src={resolveImage(item.image)}
                        alt={item.pname}
                        style={{
                          width: "100%",
                          height: 240,
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: 240,
                          background: "#f3f4f6",
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
                  <div style={{ padding: 16 }}>
                    <h3
                      onClick={() => navigate(`/product/${item.product_id}`)}
                      style={{
                        margin: "0 0 8px",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      {item.pname}
                    </h3>

                    {item.description && (
                      <p
                        style={{
                          color: "#6b7280",
                          fontSize: 13,
                          marginBottom: 12,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.description.substring(0, 60)}...
                      </p>
                    )}

                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#10b981",
                        marginBottom: 12,
                      }}
                    >
                      ₹{item.price}
                    </div>

                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 12,
                        marginBottom: 16,
                      }}
                    >
                      Added on{" "}
                      {new Date(item.date_added).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => moveToCart(item)}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => navigate(`/product/${item.product_id}`)}
                        style={{
                          padding: "10px 16px",
                          background: "#fff",
                          color: "#2563eb",
                          border: "2px solid #2563eb",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);
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
    const recentlyViewed = loadRecentlyViewed();
    if (recentlyViewed.length > 0) {
      refreshRecentlyViewedImages(recentlyViewed);
    }
  }, []);

  const loadRecentlyViewed = () => {
    try {
      const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      setProducts(recentlyViewed);
      return recentlyViewed;
    } catch (err) {
      console.log("Error loading recently viewed:", err);
      return [];
    }
  };

  const refreshRecentlyViewedImages = async (items) => {
    try {
      const updated = await Promise.all(
        items.map(async (item) => {
          try {
            const res = await axios.get(`http://localhost:8000/api/products/${item.id}`);
            return { ...item, image: res.data?.image || item.image };
          } catch {
            return item;
          }
        })
      );
      setProducts(updated);
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    } catch (err) {
      console.log("Error refreshing recently viewed images:", err);
    }
  };

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ marginBottom: 16, fontSize: 20, fontWeight: 600 }}>
        👁️ Recently Viewed
      </h2>
      
      <div
        style={{
          display: "flex",
          gap: 16,
          overflowX: "auto",
          paddingBottom: 16,
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => navigate(`/product/${product.id}`)}
            style={{
              minWidth: 180,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Product Image */}
            <div
              style={{
                width: "100%",
                height: 140,
                background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {product.image ? (
                <img
                  src={resolveImage(product.image)}
                  alt={product.pname}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              ) : (
                <span style={{ fontSize: 40 }}>📦</span>
              )}
            </div>

            {/* Product Info */}
            <div style={{ padding: 12 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={product.pname}
              >
                {product.pname}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>
                ₹{product.price}
              </div>
              {product.category && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#6b7280",
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {product.category}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

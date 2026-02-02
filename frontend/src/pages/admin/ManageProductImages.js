import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ManageProductImages() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [productImages, setProductImages] = useState([]);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductImages();
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/products");
      const list = res.data?.products || res.data || [];
      setProducts(list);
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  const fetchProductImages = async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/products/${selectedProduct}/images`
      );
      setProductImages(res.data);
    } catch (err) {
      console.log("Error fetching product images:", err);
    }
  };

  const handleFileChange = (e) => {
    setAdditionalImages(Array.from(e.target.files));
  };

  const uploadImages = async () => {
    if (!selectedProduct) {
      setMsg("Please select a product");
      return;
    }

    if (additionalImages.length === 0) {
      setMsg("Please select images to upload");
      return;
    }

    setLoading(true);
    setMsg("");

    const formData = new FormData();
    additionalImages.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const res = await axios.post(
        `http://localhost:8000/api/products/${selectedProduct}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setMsg(res.data.msg);
      setAdditionalImages([]);
      fetchProductImages();
    } catch (err) {
      setMsg("Error uploading images");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/product-images/${imageId}`);
      setMsg("Image deleted successfully");
      fetchProductImages();
    } catch (err) {
      setMsg("Error deleting image");
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 20 }}>Manage Product Images</h1>

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

      {/* Product Selector */}
      <div
        style={{
          background: "#fff",
          padding: 24,
          borderRadius: 10,
          marginBottom: 24,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Select Product</h3>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 6,
            fontSize: 14,
          }}
        >
          <option value="">-- Choose a product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.pname} - ₹{p.price}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          {/* Upload New Images */}
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 10,
              marginBottom: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Add Images</h3>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              style={{
                marginBottom: 16,
                padding: 8,
                border: "1px solid #d1d5db",
                borderRadius: 6,
                width: "100%",
              }}
            />

            {additionalImages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
                  Selected: {additionalImages.length} image(s)
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {additionalImages.map((file, index) => (
                    <div
                      key={index}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "2px solid #e5e7eb",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={uploadImages}
              disabled={loading || additionalImages.length === 0}
              style={{
                padding: "10px 20px",
                background:
                  loading || additionalImages.length === 0
                    ? "#9ca3af"
                    : "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor:
                  loading || additionalImages.length === 0
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
              }}
            >
              {loading ? "Uploading..." : "Upload Images"}
            </button>
          </div>

          {/* Current Images */}
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Current Images ({productImages.length})
            </h3>

            {productImages.length === 0 ? (
              <p style={{ color: "#6b7280" }}>No additional images uploaded yet</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: 16,
                }}
              >
                {productImages.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      position: "relative",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "2px solid #e5e7eb",
                    }}
                  >
                    <img
                      src={`http://localhost:8000${img.image_url}`}
                      alt={`Product ${img.id}`}
                      style={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                      }}
                    />
                    <button
                      onClick={() => deleteImage(img.id)}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                      title="Delete image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

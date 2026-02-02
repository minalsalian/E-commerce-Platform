import React, { useState, useEffect } from "react";
import axios from "axios";
import VariantManager from "../../components/VariantManager";

export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pname, setPname] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [categoryid, setCategoryid] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [msg, setMsg] = useState("");
  const [expandedVariants, setExpandedVariants] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/products");
      const list = res.data?.products || res.data || [];
      setProducts(list);
    } catch (err) {
      console.log("Error fetching products:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/categories");
      setCategories(res.data);
    } catch (err) {
      console.log("Error fetching categories:", err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://localhost:8000/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.image;
    } catch (err) {
      console.log("Image upload error:", err);
      setMsg("Image upload failed");
      return null;
    }
  };

  const addProduct = async () => {
    if (!pname || !price || !categoryid) {
      setMsg("Please fill all required fields");
      return;
    }

    let imageUrl = "/images/placeholder.svg";
    if (image) {
      imageUrl = await uploadImage(image);
      if (!imageUrl) return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/products", {
        pname,
        description,
        price: Number(price),
        image: imageUrl,
        categoryid: Number(categoryid),
        stock: Number(stock) || 0,
        status: 1,
        userid: localStorage.getItem("userId") || 1,
        pricetype: "Rs",
      });

      setMsg(res.data.msg);
      setPname("");
      setDescription("");
      setPrice("");
      setStock("");
      setCategoryid("");
      setImage(null);
      setImagePreview("");
      fetchProducts();
    } catch (err) {
      setMsg("Error adding product");
      console.log("Error:", err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/api/products/${id}`);
      setMsg("Product deleted");
      fetchProducts();
    } catch (err) {
      setMsg("Error deleting product");
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Manage Products</h1>

      {msg && <p style={{ color: "#10b981", marginBottom: "10px" }}>{msg}</p>}

      <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <h3>Add New Product</h3>
        
        <input
          style={input}
          placeholder="Product Name *"
          value={pname}
          onChange={(e) => setPname(e.target.value)}
        />
        <input
          style={input}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          style={input}
          type="number"
          placeholder="Price *"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          style={input}
          type="number"
          placeholder="Stock Quantity"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          min="0"
        />
        <select
          style={input}
          value={categoryid}
          onChange={(e) => setCategoryid(e.target.value)}
        >
          <option value="">Select Category *</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name || cat.cname}
            </option>
          ))}
        </select>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ padding: "8px", border: "1px solid #d1d5db", borderRadius: 6, width: "100%" }}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{ marginTop: 10, maxWidth: 150, borderRadius: 6 }}
            />
          )}
        </div>

        <button style={addBtn} onClick={addProduct}>
          Add Product
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={th}>ID</th>
            <th style={th}>Image</th>
            <th style={th}>Name</th>
            <th style={th}>Price (₹)</th>
            <th style={th}>Stock</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <React.Fragment key={p.id}>
              <tr>
                <td style={td}>{p.id}</td>
                <td style={td}>
                  {p.image && (
                    <img
                      src={`http://localhost:8000${p.image}`}
                      alt={p.pname}
                      style={{ width: 40, height: 40, borderRadius: 4 }}
                    />
                  )}
                </td>
                <td style={td}>{p.pname}</td>
                <td style={td}>{p.price}</td>
                <td style={{
                  ...td,
                  fontWeight: p.stock <= 5 ? 'bold' : 'normal',
                  color: p.stock === 0 ? '#dc2626' : p.stock <= 5 ? '#ea580c' : p.stock <= 10 ? '#eab308' : '#10b981'
                }}>
                  {p.stock || 0}
                </td>
                <td style={td}>
                  <button
                    style={{...variantBtn, marginRight: 8}}
                    onClick={() => setExpandedVariants(expandedVariants === p.id ? null : p.id)}
                  >
                    {expandedVariants === p.id ? 'Hide' : 'Variants'}
                  </button>
                  <button
                    style={delBtn}
                    onClick={() => deleteProduct(p.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
              {expandedVariants === p.id && (
                <tr>
                  <td colSpan="6" style={{ padding: 0, border: 'none' }}>
                    <VariantManager productId={p.id} onClose={() => setExpandedVariants(null)} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: 12,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const addBtn = {
  width: "100%",
  padding: "10px 14px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 600,
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
  borderRadius: 4,
  cursor: "pointer",
};

const variantBtn = {
  padding: "6px 12px",
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClientNavbar from "../../components/ClientNavbar";
import { StarRating } from "../../components/StarRating";
import RecentlyViewed from "../../components/RecentlyViewed";
import Breadcrumbs from "../../components/Breadcrumbs";
import HeroBanner from "../../components/HeroBanner";
import AnnouncementBar from "../../components/AnnouncementBar";
import FlashDeals from "../../components/FlashDeals";
import Pagination from "../../components/Pagination";
import { getProductBadges } from "../../utils/badgeHelper";
import { toast } from "react-toastify";

export default function Shop() {
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productRatings, setProductRatings] = useState({});
  const [wishlistItems, setWishlistItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [sortBy, setSortBy] = useState("default");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlist();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchProducts();
  }, [selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (minPrice > 0) params.append("minPrice", minPrice);
      if (maxPrice < 100000) params.append("maxPrice", maxPrice);
      params.append("page", currentPage);
      params.append("limit", itemsPerPage);

      const res = await axios.get(`http://localhost:8000/api/products?${params}`);
      console.log("Products fetched:", res.data);
      
      // Handle pagination response
      if (res.data.products) {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setTotalProducts(res.data.total);
        
        // Fetch ratings for all products
        res.data.products.forEach(product => {
          fetchProductRating(product.id);
        });
      } else {
        // Fallback for old API format
        setProducts(res.data);
        res.data.forEach(product => {
          fetchProductRating(product.id);
        });
      }
    } catch (err) {
      console.log("Error fetching products:", err);
      // Fallback to localStorage
      const data = JSON.parse(localStorage.getItem("products")) || [];
      setProducts(data);
    }
  };

  // Sort products based on selected sort option
  const getSortedProducts = () => {
    const sorted = [...products];
    
    switch(sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name-asc":
        return sorted.sort((a, b) => (a.pname || a.name || "").localeCompare(b.pname || b.name || ""));
      case "name-desc":
        return sorted.sort((a, b) => (b.pname || b.name || "").localeCompare(a.pname || a.name || ""));
      case "rating-high":
        return sorted.sort((a, b) => {
          const ratingA = productRatings[a.id]?.average || 0;
          const ratingB = productRatings[b.id]?.average || 0;
          return ratingB - ratingA;
        });
      default:
        return sorted;
    }
  };

  const fetchProductRating = async (productId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${productId}/rating`);
      setProductRatings(prev => ({
        ...prev,
        [productId]: {
          average: res.data.average_rating || 0,
          count: res.data.review_count || 0
        }
      }));
    } catch (err) {
      console.log(`Error fetching rating for product ${productId}:`, err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/categories");
      setCategories(["All", ...res.data.map(c => c.cname || c.name)]);
    } catch (err) {
      console.log("Error fetching categories:", err);
      setCategories(["All"]);
    }
  };

  const fetchWishlist = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        const res = await axios.get(`http://localhost:8000/api/wishlist/${userData.id}`);
        setWishlistItems(res.data.map(item => item.product_id));
      }
    } catch (err) {
      console.log("Error fetching wishlist:", err);
    }
  };

  const toggleWishlist = async (productId, e) => {
    e.stopPropagation();
    
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      toast.info("Please login to add items to wishlist");
      return;
    }

    const isInWishlist = wishlistItems.includes(productId);

    if (isInWishlist) {
      // Remove from wishlist
      try {
        const res = await axios.get(`http://localhost:8000/api/wishlist/${userData.id}/${productId}`);
        if (res.data.wishlistId) {
          await axios.delete(`http://localhost:8000/api/wishlist/${res.data.wishlistId}`);
          setWishlistItems(wishlistItems.filter(id => id !== productId));
        }
      } catch (err) {
        console.log("Error removing from wishlist:", err);
      }
    } else {
      // Add to wishlist
      try {
        await axios.post("http://localhost:8000/api/wishlist", {
          user_id: userData.id,
          product_id: productId
        });
        setWishlistItems([...wishlistItems, productId]);
      } catch (err) {
        console.log("Error adding to wishlist:", err);
      }
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find((p) => p.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success("Added to cart");
  };

  const openQuickView = (product, e) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const maxProductPrice = products.length > 0 
    ? Math.max(...products.map(p => p.price || 0)) 
    : 100000;

  return (
    <>
      {/* Announcement Bar */}
      <AnnouncementBar />
      
      <ClientNavbar />

      {/* Hero Banner */}
      <HeroBanner />

      <div style={{ padding: 24, background: "#f9fafb", minHeight: "100vh" }}>
        <Breadcrumbs items={[{ label: "Shop" }]} />

        {/* Flash Deals Section */}
        <FlashDeals />

        {/* Recently Viewed Products */}
        <RecentlyViewed />

        {/* Filters Section */}
        <div style={{ background: "#fff", padding: 16, borderRadius: 8, marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Category Filter */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Category</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: selectedCategory === cat ? "2px solid #2563eb" : "1px solid #e5e7eb",
                    background: selectedCategory === cat ? "#dbeafe" : "#fff",
                    color: selectedCategory === cat ? "#1e40af" : "#111827",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: selectedCategory === cat ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Price Range</label>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Min: ₹{minPrice}</label>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice))}
                  style={{ width: 150 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Max: ₹{maxPrice}</label>
                <input
                  type="range"
                  min="0"
                  max={maxProductPrice}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice))}
                  style={{ width: 150 }}
                />
              </div>
              <button
                onClick={() => {
                  setMinPrice(0);
                  setMaxPrice(maxProductPrice);
                }}
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
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Sort & Results Bar */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 16 
        }}>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts} products
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 14,
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <option value="default">Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="rating-high">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="product-grid">
          {getSortedProducts().length === 0 && (
            <div className="product-empty-state">
              <p className="text-lg font-semibold">No products match your filters</p>
              <p className="text-sm mt-2">Try adjusting your filters or browsing all products</p>
            </div>
          )}

          {getSortedProducts().map((p) => (
            <div
              key={p.id}
              className="product-card group"
              onClick={() => navigate(`/product/${p.id}`)}
            >
              {/* Image Container */}
              <div className="product-image-wrapper">
                <img
                  src={resolveImage(p.image)}
                  alt={p.pname}
                  className="product-image"
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                  }}
                />

                {/* Product Badges */}
                {(() => {
                  const badges = getProductBadges(p, productRatings[p.id]);
                  if (badges.length > 0) {
                    return (
                      <div className="product-badges-container">
                        {badges.map((badge, idx) => (
                          <div key={idx} className={`product-badge ${badge.type}`} title={badge.label}>
                            {badge.icon} {badge.label}
                          </div>
                        ))}
                      </div>
                    );
                  }
                })()}

                {/* Out of Stock Overlay */}
                {(p.stock || 0) === 0 && (
                  <div className="product-out-of-stock">
                    <span>OUT OF STOCK</span>
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(p.id, e);
                  }}
                  className={`product-wishlist-btn ${wishlistItems.includes(p.id) ? 'active' : ''}`}
                  title={wishlistItems.includes(p.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {wishlistItems.includes(p.id) ? "❤️" : "🤍"}
                </button>

                {/* Quick View Button */}
                <button
                  onClick={(e) => openQuickView(p, e)}
                  className="product-quick-view-btn"
                  title="Quick view"
                >
                  Quick View
                </button>
              </div>

              {/* Product Info */}
              <div className="product-info">
                {/* Category */}
                <p className="product-category">{p.category}</p>

                {/* Title */}
                <h3 className="product-title">{p.pname || p.name}</h3>

                {/* Rating */}
                {productRatings[p.id] && (
                  <div className="product-rating">
                    <StarRating 
                      rating={productRatings[p.id].average} 
                      size={16}
                      showCount={true}
                      reviewCount={productRatings[p.id].count}
                    />
                  </div>
                )}

                {/* Price */}
                <div className="product-price-section">
                  <span className="product-price">₹{p.price}</span>
                  <span className={`product-stock-badge ${
                    (p.stock || 0) === 0 ? 'out-of-stock' : 
                    (p.stock || 0) < 5 ? 'low-stock' : 'in-stock'
                  }`}>
                    {(p.stock || 0) === 0 ? 'Out' : `${p.stock} left`}
                  </span>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                  disabled={(p.stock || 0) === 0}
                  className="product-add-cart w-full"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {quickViewProduct && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeQuickView}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full sm:w-4/5 md:w-3/4 lg:w-1/2 max-h-screen overflow-y-auto modal-open"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{quickViewProduct.pname || quickViewProduct.name}</h3>
                  <p className="text-sm text-gray-500">{quickViewProduct.category}</p>
                </div>
                <button onClick={closeQuickView} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <img
                    src={resolveImage(quickViewProduct.image)}
                    alt={quickViewProduct.pname}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = placeholderImage;
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">₹{quickViewProduct.price}</span>
                    <span className={`product-stock-badge ${
                      (quickViewProduct.stock || 0) === 0 ? 'out-of-stock' :
                      (quickViewProduct.stock || 0) < 5 ? 'low-stock' : 'in-stock'
                    }`}>
                      {(quickViewProduct.stock || 0) === 0 ? 'Out' : `${quickViewProduct.stock} left`}
                    </span>
                  </div>

                  {quickViewProduct.description && (
                    <p className="text-gray-600 text-sm">{quickViewProduct.description}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      className="btn-primary btn-md"
                      onClick={() => {
                        addToCart(quickViewProduct);
                        closeQuickView();
                      }}
                      disabled={(quickViewProduct.stock || 0) === 0}
                    >
                      Add to Cart
                    </button>
                    <button
                      className="btn-outline-primary btn-md"
                      onClick={() => navigate(`/product/${quickViewProduct.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

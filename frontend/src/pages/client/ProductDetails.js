import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";
import { StarRating, StarRatingInput } from "../../components/StarRating";
import RecentlyViewed from "../../components/RecentlyViewed";
import ImageGallery from "../../components/ImageGallery";
import VariantSelector from "../../components/VariantSelector";
import Breadcrumbs from "../../components/Breadcrumbs";
import RelatedProducts from "../../components/RelatedProducts";
import { toast } from "react-toastify";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistId, setWishlistId] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(null);
  const [displayStock, setDisplayStock] = useState(null);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchRating();
    checkWishlist();
    fetchProductImages();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${id}`);
      setProduct(res.data);
      
      // Track recently viewed products
      if (res.data) {
        addToRecentlyViewed(res.data);
      }
      
      // Fetch related products from same category
      if (res.data.categoryid) {
        fetchRelatedProducts(res.data.categoryid);
      }
    } catch (err) {
      console.log("Error fetching product:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToRecentlyViewed = (product) => {
    try {
      // Get existing recently viewed products
      const recentlyViewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      
      // Remove if already exists (to avoid duplicates)
      const filtered = recentlyViewed.filter(p => p.id !== product.id);
      
      // Add current product to the beginning
      const updated = [
        {
          id: product.id,
          pname: product.pname,
          price: product.price,
          image: product.image,
          category: product.category
        },
        ...filtered
      ].slice(0, 10); // Keep only last 10 products
      
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
    } catch (err) {
      console.log("Error saving to recently viewed:", err);
    }
  };

  const fetchRelatedProducts = async (categoryId) => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/products?categoryId=${categoryId}&limit=4`
      );
      setRelatedProducts(res.data.filter((p) => p.id !== Number(id)));
    } catch (err) {
      console.log("Error fetching related products:", err);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${id}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.log("Error fetching reviews:", err);
    }
  };

  const fetchRating = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${id}/rating`);
      setAverageRating(res.data.average_rating || 0);
      setReviewCount(res.data.review_count || 0);
    } catch (err) {
      console.log("Error fetching rating:", err);
    }
  };

  const fetchProductImages = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${id}/images`);
      setProductImages(res.data.map(img => img.image_url));
    } catch (err) {
      console.log("Error fetching product images:", err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMessage("");
    setReviewError("");

    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      setReviewError("Please login to submit a review");
      return;
    }

    if (userRating === 0) {
      setReviewError("Please select a rating");
      return;
    }

    try {
      await axios.post(`http://localhost:8000/api/products/${id}/reviews`, {
        user_id: userData.id,
        rating: userRating,
        review_text: reviewText,
      });
      setReviewMessage("Review submitted successfully!");
      setUserRating(0);
      setReviewText("");
      fetchReviews();
      fetchRating();
    } catch (err) {
      setReviewError(err.response?.data?.msg || "Failed to submit review");
    }
  };

  const checkWishlist = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) {
        const res = await axios.get(`http://localhost:8000/api/wishlist/${userData.id}/${id}`);
        setIsInWishlist(res.data.inWishlist);
        setWishlistId(res.data.wishlistId);
      }
    } catch (err) {
      console.log("Error checking wishlist:", err);
    }
  };

  const toggleWishlist = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      toast.info("Please login to add items to wishlist");
      return;
    }

    if (isInWishlist) {
      // Remove from wishlist
      try {
        await axios.delete(`http://localhost:8000/api/wishlist/${wishlistId}`);
        setIsInWishlist(false);
        setWishlistId(null);
      } catch (err) {
        console.log("Error removing from wishlist:", err);
      }
    } else {
      // Add to wishlist
      try {
        const res = await axios.post("http://localhost:8000/api/wishlist", {
          user_id: userData.id,
          product_id: id
        });
        setIsInWishlist(true);
        setWishlistId(res.data.id);
      } catch (err) {
        console.log("Error adding to wishlist:", err);
      }
    }
  };

  const addToCart = () => {
    // If product has variants, a variant must be selected
    if (selectedVariant === null && displayStock !== null) {
      toast.info("Please select a product variant");
      return;
    }

    const availableStock = selectedVariant ? selectedVariant.stock : (product.stock || 0);
    const price = selectedVariant ? selectedVariant.price : product.price;
    
    // Check if product is in stock
    if (availableStock === 0) {
      toast.error("This product is out of stock");
      return;
    }

    // Check if requested quantity exceeds available stock
    if (quantity > availableStock) {
      toast.warning(`Only ${availableStock} item(s) available in stock`);
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    // For variants, check for both product ID and variant ID
    const cartItemKey = selectedVariant 
      ? `${product.id}_variant_${selectedVariant.id}`
      : product.id;
    
    const existing = cart.find((p) => {
      if (selectedVariant) {
        return p.id === product.id && p.variant_id === selectedVariant.id;
      }
      return p.id === product.id && !p.variant_id;
    });

    if (existing) {
      const totalQty = existing.qty + quantity;
      if (totalQty > availableStock) {
        toast.warning(`Only ${availableStock} item(s) available. You have ${existing.qty} in cart.`);
        return;
      }
      existing.qty = totalQty;
    } else {
      const cartItem = { 
        ...product, 
        qty: quantity,
        price: price
      };
      if (selectedVariant) {
        cartItem.variant_id = selectedVariant.id;
        cartItem.variant_size = selectedVariant.size;
        cartItem.variant_color = selectedVariant.color;
      }
      cart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    setDisplayPrice(variant.price);
    setDisplayStock(variant.stock);
    setQuantity(1); // Reset quantity when variant changes
  };

  const handleVariantClear = () => {
    setSelectedVariant(null);
    setDisplayPrice(null);
    setDisplayStock(null);
  };

  const createPriceAlert = async () => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      toast.info("Please login to set price alerts");
      return;
    }

    const target = parseFloat(targetPrice);
    const currentPrice = displayPrice !== null ? displayPrice : product.price;

    if (!targetPrice || isNaN(target)) {
      toast.error("Please enter a valid price");
      return;
    }

    if (target >= currentPrice) {
      toast.warning("Target price should be less than current price");
      return;
    }

    try {
      await axios.post("http://localhost:8000/api/price-alerts", {
        user_id: userData.id,
        product_id: id,
        target_price: target,
        current_price: currentPrice
      });
      toast.success("Price alert created! We'll notify you when price drops");
      setShowPriceAlertModal(false);
      setTargetPrice("");
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error(err.response.data.msg);
      } else {
        toast.error("Failed to create price alert");
      }
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

  if (!product) {
    return (
      <>
        <ClientNavbar />
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "#fff",
            margin: "40px auto",
            maxWidth: 600,
            borderRadius: 12,
          }}
        >
          <h3>Product not found</h3>
          <button
            onClick={() => navigate("/shop")}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Back to Shop
          </button>
        </div>
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
        <Breadcrumbs
          items={[
            { label: "Shop", to: "/shop" },
            { label: product?.pname || "Product" }
          ]}
        />
        {/* Main Product Section */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            background: "#fff",
            borderRadius: 12,
            padding: 32,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
            }}
          >
            {/* Product Image Gallery */}
            <div>
              <ImageGallery 
                images={
                  productImages.length > 0 
                    ? productImages 
                    : product.image 
                    ? [product.image] 
                    : []
                }
                productName={product.pname}
              />
            </div>

            {/* Product Info */}
            <div>
              <h1 style={{ margin: "0 0 12px", fontSize: 32 }}>
                {product.pname}
              </h1>

              {/* Average Rating */}
              <div style={{ marginBottom: 16 }}>
                <StarRating 
                  rating={averageRating} 
                  size={24} 
                  showCount={true}
                  reviewCount={reviewCount}
                />
              </div>

              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: "#10b981",
                  marginBottom: 24,
                }}
              >
                ₹{displayPrice !== null ? displayPrice : product.price}
              </div>

              {product.description && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Description</h3>
                  <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                    {product.description}
                  </p>
                </div>
              )}

              <div
                style={{
                  padding: 16,
                  background: "#f9fafb",
                  borderRadius: 8,
                  marginBottom: 24,
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: "#10b981" }}>In Stock</span>
                </div>
                <div>
                  <strong>Category:</strong> {product.category || "General"}
                </div>
              </div>

              {/* Stock Status */}
              <div style={{ marginBottom: 24, padding: 12, background: (displayStock !== null ? displayStock : product.stock || 0) > 0 ? "#d1fae5" : "#fee2e2", borderRadius: 8 }}>
                <p style={{ margin: 0, fontWeight: 600, color: (displayStock !== null ? displayStock : product.stock || 0) > 0 ? "#065f46" : "#991b1b" }}>
                  {(displayStock !== null ? displayStock : product.stock || 0) > 0 ? (
                    <>✓ {displayStock !== null ? displayStock : product.stock} item(s) in stock</>
                  ) : (
                    <>✕ Out of Stock</>
                  )}
                </p>
              </div>

              {/* Variant Selector */}
              <VariantSelector 
                productId={product.id}
                onVariantSelect={handleVariantSelect}
                onVariantClear={handleVariantClear}
              />

              {/* Quantity Selector */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Quantity:
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={(displayStock !== null ? displayStock : product.stock || 0) === 0}
                    style={{
                      padding: "8px 16px",
                      fontSize: 18,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      cursor: (displayStock !== null ? displayStock : product.stock || 0) === 0 ? "not-allowed" : "pointer",
                      opacity: (displayStock !== null ? displayStock : product.stock || 0) === 0 ? 0.5 : 1,
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      padding: "8px 24px",
                      fontSize: 18,
                      fontWeight: 600,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(quantity + 1, displayStock !== null ? displayStock : product.stock || 0))}
                    disabled={(displayStock !== null ? displayStock : product.stock || 0) === 0 || quantity >= (displayStock !== null ? displayStock : product.stock || 0)}
                    style={{
                      padding: "8px 16px",
                      fontSize: 18,
                      background: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      cursor: (displayStock !== null ? displayStock : product.stock || 0) === 0 || quantity >= (displayStock !== null ? displayStock : product.stock || 0) ? "not-allowed" : "pointer",
                      opacity: (displayStock !== null ? displayStock : product.stock || 0) === 0 || quantity >= (displayStock !== null ? displayStock : product.stock || 0) ? 0.5 : 1,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <button
                  onClick={toggleWishlist}
                  style={{
                    padding: "16px",
                    background: isInWishlist ? "#fee2e2" : "#fff",
                    color: isInWishlist ? "#ef4444" : "#6b7280",
                    border: `2px solid ${isInWishlist ? "#ef4444" : "#d1d5db"}`,
                    borderRadius: 8,
                    fontSize: 24,
                    cursor: "pointer",
                  }}
                  title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                  {isInWishlist ? "❤️" : "🤍"}
                </button>
                <button
                  onClick={addToCart}
                  disabled={(displayStock !== null ? displayStock : product.stock || 0) === 0}
                  style={{
                    flex: 1,
                    padding: "16px",
                    background: (displayStock !== null ? displayStock : product.stock || 0) === 0 ? "#d1d5db" : "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: (displayStock !== null ? displayStock : product.stock || 0) === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {(product.stock || 0) === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  onClick={() => navigate("/cart")}
                  style={{
                    padding: "16px 24px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Go to Cart
                </button>
              </div>

              {/* Price Alert Button */}
              <button
                onClick={() => setShowPriceAlertModal(true)}
                className="btn-outline-primary w-full"
                style={{ marginTop: 8 }}
              >
                🔔 Set Price Alert
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div style={{ maxWidth: 1200, margin: "0 auto 32px" }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 32,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ marginBottom: 24 }}>Customer Reviews</h2>

            {/* Add Review Form */}
            <div
              style={{
                padding: 24,
                background: "#f9fafb",
                borderRadius: 8,
                marginBottom: 32,
              }}
            >
              <h3 style={{ marginBottom: 16 }}>Write a Review</h3>
              
              {reviewMessage && (
                <div
                  style={{
                    padding: 12,
                    background: "#d1fae5",
                    color: "#065f46",
                    borderRadius: 6,
                    marginBottom: 16,
                  }}
                >
                  {reviewMessage}
                </div>
              )}

              {reviewError && (
                <div
                  style={{
                    padding: 12,
                    background: "#fee2e2",
                    color: "#991b1b",
                    borderRadius: 6,
                    marginBottom: 16,
                  }}
                >
                  {reviewError}
                </div>
              )}

              <form onSubmit={submitReview}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Your Rating:
                  </label>
                  <StarRatingInput
                    rating={userRating}
                    onRatingChange={setUserRating}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontWeight: 600,
                    }}
                  >
                    Your Review:
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 15,
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="submit"
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
                  Submit Review
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div>
              {reviews.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center", padding: 40 }}>
                  No reviews yet. Be the first to review this product!
                </p>
              ) : (
                reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      padding: 20,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>
                          {review.user_name || "Anonymous"}
                        </div>
                        <StarRating rating={review.rating} size={18} />
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 14 }}>
                        {new Date(review.date).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    {review.review_text && (
                      <p style={{ color: "#374151", margin: 0, lineHeight: 1.6 }}>
                        {review.review_text}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <h2 style={{ marginBottom: 20 }}>Related Products</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                gap: 20,
              }}
            >
              {relatedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = "translateY(-4px)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  {p.image && (
                    <img
                      src={`http://localhost:8000${p.image}`}
                      alt={p.pname}
                      style={{
                        width: "100%",
                        height: 200,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ padding: 16 }}>
                    <h4 style={{ margin: "0 0 8px" }}>{p.pname}</h4>
                    <p style={{ margin: 0, fontWeight: 600, color: "#10b981" }}>
                      ₹{p.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        <div style={{ marginTop: 40 }}>
          <RecentlyViewed />
        </div>

        {/* Related Products */}
        {product && (
          <div style={{ marginTop: 40 }}>
            <RelatedProducts productId={product.id} productName={product.pname} />
          </div>
        )}
      </div>

      {/* Price Alert Modal */}
      {showPriceAlertModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPriceAlertModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 modal-open"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Set Price Alert</h3>
              <button
                onClick={() => setShowPriceAlertModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Get notified when the price drops below your target
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{displayPrice !== null ? displayPrice : product?.price}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Price (₹)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder={`Less than ₹${displayPrice !== null ? displayPrice : product?.price}`}
                className="w-full"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                We'll notify you when price drops to or below this amount
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPriceAlertModal(false)}
                className="btn-outline-primary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={createPriceAlert}
                className="btn-primary flex-1"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

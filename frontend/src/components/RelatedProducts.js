import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { StarRating } from './StarRating';
import { getProductBadges } from '../utils/badgeHelper';
import { toast } from 'react-toastify';

export default function RelatedProducts({ productId, productName }) {
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
  const [loading, setLoading] = useState(true);
  const [productRatings, setProductRatings] = useState({});
  const [scrollPosition, setScrollPosition] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    fetchRelatedProducts();
    fetchWishlist();
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/products/${productId}/related?limit=6`);
      setProducts(res.data || []);
      
      // Fetch ratings for related products
      (res.data || []).forEach(product => {
        fetchProductRating(product.id);
      });
    } catch (err) {
      console.log("Error fetching related products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductRating = async (id) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${id}/rating`);
      setProductRatings(prev => ({
        ...prev,
        [id]: {
          rating: res.data.average_rating || 0,
          reviewCount: res.data.review_count || 0
        }
      }));
    } catch (err) {
      console.log(`Error fetching rating for product ${id}:`, err);
    }
  };

  const fetchWishlist = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const res = await axios.get(`http://localhost:8000/api/wishlist/${userId}`);
      setWishlistItems(res.data.map(item => item.product_id) || []);
    } catch (err) {
      console.log('Error fetching wishlist:', err);
    }
  };

  const toggleWishlist = (productId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.info('Please login to add items to wishlist');
      return;
    }

    if (wishlistItems.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const addToWishlist = async (id) => {
    const userId = localStorage.getItem('userId');
    try {
      await axios.post(`http://localhost:8000/api/wishlist`, {
        user_id: userId,
        product_id: id
      });
      setWishlistItems([...wishlistItems, id]);
      toast.success('Added to wishlist');
    } catch (err) {
      toast.error('Error adding to wishlist');
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      const userId = localStorage.getItem('userId');
      await axios.delete(`http://localhost:8000/api/wishlist/${userId}/${id}`);
      setWishlistItems(wishlistItems.filter(item => item !== id));
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error('Error removing from wishlist');
    }
  };

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(p => p.id === product.id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success('Added to cart');
  };

  const handleScroll = (direction) => {
    const container = document.getElementById('related-products-scroll');
    if (!container) return;

    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? scrollPosition - scrollAmount 
      : scrollPosition + scrollAmount;
    
    container.scrollLeft = newPosition;
    setScrollPosition(newPosition);
  };

  if (loading) {
    return (
      <div className="related-products-section">
        <h2 className="related-products-title">You Might Also Like</h2>
        <div className="related-products-loading">
          <p>Loading recommendations...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="related-products-section">
      <h2 className="related-products-title">You Might Also Like</h2>
      
      <div className="related-products-container">
        <button 
          className="related-products-scroll-btn left"
          onClick={() => handleScroll('left')}
          aria-label="Scroll left"
        >
          ‹
        </button>

        <div className="related-products-scroll" id="related-products-scroll">
          {products.map(product => (
            <div 
              key={product.id} 
              className="related-product-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Image Container */}
              <div className="related-product-image-wrapper">
                <img
                  src={resolveImage(product.image)}
                  alt={product.pname}
                  className="related-product-image"
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                  }}
                />

                {/* Product Badges */}
                {(() => {
                  const badges = getProductBadges(product, productRatings[product.id]);
                  if (badges.length > 0) {
                    return (
                      <div className="related-product-badges">
                        {badges.map((badge, idx) => (
                          <span 
                            key={idx} 
                            className={`related-product-badge ${badge.type}`}
                            title={badge.label}
                          >
                            {badge.icon}
                          </span>
                        ))}
                      </div>
                    );
                  }
                })()}

                {/* Out of Stock Overlay */}
                {(product.stock || 0) === 0 && (
                  <div className="related-product-out-of-stock">
                    <span>OUT OF STOCK</span>
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className={`related-product-wishlist-btn ${wishlistItems.includes(product.id) ? 'active' : ''}`}
                  title={wishlistItems.includes(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {wishlistItems.includes(product.id) ? '❤️' : '🤍'}
                </button>

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  className="related-product-add-to-cart-btn"
                  disabled={(product.stock || 0) === 0}
                  title="Add to cart"
                >
                  {(product.stock || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {/* Product Info */}
              <div className="related-product-info">
                <h3 className="related-product-name">{product.pname}</h3>
                
                <div className="related-product-rating">
                  {productRatings[product.id] && (
                    <>
                      <StarRating 
                        rating={productRatings[product.id].rating} 
                        size="small"
                      />
                      <span className="related-product-review-count">
                        ({productRatings[product.id].reviewCount})
                      </span>
                    </>
                  )}
                </div>

                <div className="related-product-price">
                  ₹{product.price?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="related-products-scroll-btn right"
          onClick={() => handleScroll('right')}
          aria-label="Scroll right"
        >
          ›
        </button>
      </div>
    </div>
  );
}

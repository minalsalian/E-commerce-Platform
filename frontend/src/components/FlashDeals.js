import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StarRating } from './StarRating';
import { toast } from 'react-toastify';

export default function FlashDeals() {
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
  const [deals, setDeals] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlashDeals();
  }, []);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59);

      const diff = endOfDay - now;
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchFlashDeals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/flash-deals');
      setDeals(res.data || []);
    } catch (err) {
      console.log('Error fetching flash deals:', err);
      // Fallback to showing some random products as deals
      try {
        const allProducts = await axios.get('http://localhost:8000/api/products?limit=4');
        // Handle pagination response format
        const products = allProducts.data.products || allProducts.data || [];
        setDeals(products.slice(0, 4));
      } catch (fallbackErr) {
        console.log('Fallback fetch also failed:', fallbackErr);
        setDeals([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, e) => {
    e.stopPropagation();
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

  const calculateDiscount = (originalPrice, dealPrice) => {
    return Math.round(((originalPrice - dealPrice) / originalPrice) * 100);
  };

  if (loading) {
    return (
      <div className="flash-deals-section">
        <div className="flash-deals-header">
          <div className="flash-deals-title-section">
            <h2 className="flash-deals-title">
              <span className="flash-icon">⚡</span>
              Flash Deals
            </h2>
            <p className="flash-deals-subtitle">Limited time offers - Don't miss out!</p>
          </div>
        </div>
        <p className="text-center py-8 text-gray-500">Loading deals...</p>
      </div>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <div className="flash-deals-section">
      {/* Header with Countdown */}
      <div className="flash-deals-header">
        <div className="flash-deals-title-section">
          <h2 className="flash-deals-title">
            <span className="flash-icon">⚡</span>
            Flash Deals
          </h2>
          <p className="flash-deals-subtitle">Limited time offers - Don't miss out!</p>
        </div>

        {/* Countdown Timer */}
        <div className="flash-deals-countdown">
          <span className="countdown-label-flash">Ends in:</span>
          <div className="countdown-timer-flash">
            <div className="countdown-box">
              <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="countdown-text">Hours</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-box">
              <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="countdown-text">Mins</span>
            </div>
            <span className="countdown-colon">:</span>
            <div className="countdown-box">
              <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="countdown-text">Secs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="flash-deals-grid">
        {deals.map((product) => {
          const originalPrice = product.original_price || product.price * 1.5;
          const discount = calculateDiscount(originalPrice, product.price);
          const stockValue = product.stock_quantity ?? product.stock ?? 0;
          const stockPercent = Math.min(100, (stockValue / 20) * 100);

          return (
            <div
              key={product.id}
              className="flash-deal-card"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {/* Discount Badge */}
              <div className="flash-deal-badge">
                {discount}% OFF
              </div>

              {/* Product Image */}
              <div className="flash-deal-image-wrapper">
                <img
                  src={resolveImage(product.image)}
                  alt={product.pname}
                  className="flash-deal-image"
                  onError={(e) => {
                    e.currentTarget.src = placeholderImage;
                  }}
                />
              </div>

              {/* Product Info */}
              <div className="flash-deal-info">
                <h3 className="flash-deal-name">{product.pname}</h3>
                
                <div className="flash-deal-pricing">
                  <div className="flash-deal-price-section">
                    <span className="flash-deal-price">₹{product.price}</span>
                    <span className="flash-deal-original-price">₹{Math.round(originalPrice)}</span>
                  </div>
                  <div className="flash-deal-saved">
                    Save ₹{Math.round(originalPrice - product.price)}
                  </div>
                </div>

                {/* Stock Progress Bar */}
                <div className="flash-deal-stock">
                  <div className="stock-info">
                    <span className="stock-text">
                      {stockValue > 0 ? `Only ${stockValue} left!` : "Out of stock"}
                    </span>
                    <span className="stock-percentage">{stockPercent}%</span>
                  </div>
                  <div className="stock-progress-bar">
                    <div 
                      className="stock-progress-fill"
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => addToCart(product, e)}
                  className="flash-deal-btn"
                  disabled={stockValue === 0}
                >
                  {stockValue === 0 ? 'Out of Stock' : 'Add to Cart ⚡'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="flash-deals-footer">
        <button 
          className="flash-deals-view-all"
          onClick={() => navigate('/shop')}
        >
          View All Flash Deals →
        </button>
      </div>
    </div>
  );
}

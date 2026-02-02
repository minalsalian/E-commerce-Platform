import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HeroBanner() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Banner slides with promotional content
  const banners = [
    {
      id: 1,
      title: 'Summer Collection',
      subtitle: 'Up to 50% OFF on selected items',
      image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#667eea',
      cta: 'Shop Now',
      category: 'Electronics'
    },
    {
      id: 2,
      title: 'Fresh & Organic',
      subtitle: 'Quality dairy and groceries at best prices',
      image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      color: '#f5576c',
      cta: 'Explore',
      category: 'Dairy'
    },
    {
      id: 3,
      title: 'Flash Sale',
      subtitle: 'Limited time offers - Ends in 24 hours',
      image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      color: '#00f2fe',
      cta: 'Grab Deals',
      category: 'All'
    },
    {
      id: 4,
      title: 'Clothing & Fashion',
      subtitle: 'Latest trends with incredible discounts',
      image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      color: '#fee140',
      cta: 'View Collection',
      category: 'Clothing'
    }
  ];

  // Auto-rotate slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(timer);
  }, [banners.length]);

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

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const handleShopNow = (category) => {
    if (category === 'All') {
      navigate('/shop');
    } else {
      navigate('/shop');
      // You can also filter by category if needed
    }
  };

  const currentBanner = banners[currentSlide];

  return (
    <div className="hero-banner-container">
      <div 
        className="hero-banner-slide"
        style={{ background: currentBanner.image }}
      >
        {/* Content Section */}
        <div className="hero-banner-content">
          <div className="hero-banner-text">
            <h1 className="hero-banner-title">{currentBanner.title}</h1>
            <p className="hero-banner-subtitle">{currentBanner.subtitle}</p>
            
            {/* Countdown Timer */}
            {currentBanner.id === 3 && (
              <div className="hero-banner-countdown">
                <div className="countdown-item">
                  <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="countdown-label">HRS</span>
                </div>
                <div className="countdown-separator">:</div>
                <div className="countdown-item">
                  <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="countdown-label">MINS</span>
                </div>
                <div className="countdown-separator">:</div>
                <div className="countdown-item">
                  <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="countdown-label">SECS</span>
                </div>
              </div>
            )}
            
            <button 
              className="hero-banner-cta"
              onClick={() => handleShopNow(currentBanner.category)}
            >
              {currentBanner.cta}
              <span className="cta-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Discount Badge */}
        <div className="hero-banner-badge">
          <span className="badge-text">50%</span>
          <span className="badge-subtext">OFF</span>
        </div>
      </div>

      {/* Navigation Controls */}
      <button 
        className="hero-banner-nav-btn prev"
        onClick={handlePrevSlide}
        aria-label="Previous slide"
      >
        ‹
      </button>
      
      <button 
        className="hero-banner-nav-btn next"
        onClick={handleNextSlide}
        aria-label="Next slide"
      >
        ›
      </button>

      {/* Slide Indicators */}
      <div className="hero-banner-indicators">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            className={`indicator ${index === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

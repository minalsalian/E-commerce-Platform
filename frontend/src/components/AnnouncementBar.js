import React, { useState, useEffect } from 'react';

export default function AnnouncementBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const announcements = [
    {
      id: 1,
      icon: '🚚',
      text: 'Free Shipping on orders over ₹499',
      bgColor: 'bg-blue-600'
    },
    {
      id: 2,
      icon: '🔄',
      text: '30 Day Easy Returns - No Questions Asked',
      bgColor: 'bg-green-600'
    },
    {
      id: 3,
      icon: '💳',
      text: 'Secure Checkout - 100% Safe & Protected',
      bgColor: 'bg-purple-600'
    },
    {
      id: 4,
      icon: '📞',
      text: '24/7 Customer Support - We\'re Here to Help',
      bgColor: 'bg-orange-600'
    },
    {
      id: 5,
      icon: '⚡',
      text: 'Flash Sale Live - Up to 70% OFF',
      bgColor: 'bg-red-600'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000); // Change announcement every 4 seconds

    return () => clearInterval(timer);
  }, [announcements.length]);

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className={`announcement-bar ${currentAnnouncement.bgColor}`}>
      <div className="announcement-content">
        <span className="announcement-icon">{currentAnnouncement.icon}</span>
        <span className="announcement-text">{currentAnnouncement.text}</span>
      </div>
      
      {/* Progress indicators */}
      <div className="announcement-indicators">
        {announcements.map((_, index) => (
          <div
            key={index}
            className={`announcement-indicator ${index === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

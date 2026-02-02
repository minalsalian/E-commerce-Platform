import React from "react";

// Star Rating Display Component (Read-only)
export function StarRating({ rating, size = 20, showCount = false, reviewCount = 0 }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(
        <span key={i} style={{ color: "#fbbf24", fontSize: size }}>
          ★
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span key={i} style={{ position: "relative", fontSize: size }}>
          <span style={{ color: "#e5e7eb" }}>★</span>
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              color: "#fbbf24",
              overflow: "hidden",
              width: "50%",
            }}
          >
            ★
          </span>
        </span>
      );
    } else {
      stars.push(
        <span key={i} style={{ color: "#e5e7eb", fontSize: size }}>
          ★
        </span>
      );
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div>{stars}</div>
      {showCount && (
        <span style={{ fontSize: 14, color: "#6b7280", marginLeft: 4 }}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// Interactive Star Rating Input Component
export function StarRatingInput({ rating, onRatingChange, size = 32 }) {
  const [hoverRating, setHoverRating] = React.useState(0);

  const handleClick = (value) => {
    onRatingChange(value);
  };

  const handleMouseEnter = (value) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const stars = [];
  const displayRating = hoverRating || rating;

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        onClick={() => handleClick(i)}
        onMouseEnter={() => handleMouseEnter(i)}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: "pointer",
          fontSize: size,
          color: i <= displayRating ? "#fbbf24" : "#e5e7eb",
          transition: "color 0.2s",
        }}
      >
        ★
      </span>
    );
  }

  return <div style={{ display: "flex", gap: 4 }}>{stars}</div>;
}

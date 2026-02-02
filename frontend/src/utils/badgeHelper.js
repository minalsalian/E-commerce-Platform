// Helper function to determine product badges
export const getProductBadges = (product, productRating = null) => {
  const badges = [];
  
  // Check if product is new (created within last 7 days)
  if (product.created_at) {
    const createdDate = new Date(product.created_at);
    const daysOld = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) {
      badges.push({ type: 'new', label: 'New', icon: '✨' });
    }
  }

  // Check stock levels
  const stock = product.stock || 0;
  if (stock > 0 && stock <= 2) {
    badges.push({ type: 'limited', label: 'Limited', icon: '⚡' });
  } else if (stock > 2 && stock <= 5) {
    badges.push({ type: 'lowstock', label: 'Low Stock', icon: '⏰' });
  }

  // Check if best seller (high rating or many reviews)
  if (productRating) {
    if (productRating.average >= 4.5 && productRating.count >= 5) {
      badges.push({ type: 'bestseller', label: 'Best Seller', icon: '⭐' });
    } else if (productRating.average >= 4.0 && productRating.count >= 3) {
      badges.push({ type: 'popular', label: 'Popular', icon: '🔥' });
    }
  }

  return badges;
};

export default { getProductBadges };

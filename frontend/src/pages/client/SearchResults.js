import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClientNavbar from '../../components/ClientNavbar';
import Breadcrumbs from '../../components/Breadcrumbs';
import { getProductBadges } from '../../utils/badgeHelper';
import { toast } from 'react-toastify';

export default function SearchResults() {
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
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [wishlistItems, setWishlistItems] = useState([]);
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchWishlist();
  }, [query, sortBy, selectedCategory, minPrice, maxPrice]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        search: query,
        ...(selectedCategory && { categoryId: selectedCategory }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice })
      };

      const res = await axios.get('http://localhost:8000/api/products', { params });
      let results = res.data;

      // Apply sorting
      switch (sortBy) {
        case 'price_low':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'name_asc':
          results.sort((a, b) => a.pname.localeCompare(b.pname));
          break;
        case 'name_desc':
          results.sort((a, b) => b.pname.localeCompare(a.pname));
          break;
        default:
          break;
      }

      setProducts(results);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const handleWishlistToggle = async (productId) => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData) {
      toast.info("Please login to add items to wishlist");
      return;
    }

    const isInWishlist = wishlistItems.includes(productId);

    if (isInWishlist) {
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

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  const handleAddToCart = async (product) => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      toast.info('Please login to add items to cart');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/cart', {
        user_id: userData.id,
        product_id: product.id,
        price: product.price
      });

      // Update localStorage cart
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find(c => c.id === product.id && !c.variant_id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));

      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Error adding to cart');
    }
  };

  const openQuickView = (product, e) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <>
      <ClientNavbar />

      <div style={{ padding: '24px', background: '#f9fafb', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: 'Search' }]} />
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 700 }}>
              Search Results
            </h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
              {query ? `Results for "${query}"` : 'All products'} ({products.length} items)
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
            {/* Sidebar Filters */}
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              height: 'fit-content'
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Filters</h3>

              {/* Category Filter */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.cname}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Price Range
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="default">Default</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name_asc">Name: A-Z</option>
                  <option value="name_desc">Name: Z-A</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <div>
              {loading ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-semibold">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="product-empty-state bg-white">
                  <p className="text-lg font-semibold">No products found</p>
                  <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="product-grid">
                  {products.map(product => (
                    <div
                      key={product.id}
                      className="product-card group"
                      onClick={() => handleProductClick(product.id)}
                    >
                      {/* Image Container */}
                      <div className="product-image-wrapper">
                        <img
                          src={resolveImage(product.image)}
                          alt={product.pname}
                          className="product-image"
                          onError={(e) => {
                            e.currentTarget.src = placeholderImage;
                          }}
                        />

                        {/* Product Badges */}
                        {(() => {
                          const productRatings = {};
                          // Assuming ratings are fetched similarly to Shop.js
                          const badges = getProductBadges(product, productRatings[product.id]);
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
                        {product.stock === 0 && (
                          <div className="product-out-of-stock">
                            <span>OUT OF STOCK</span>
                          </div>
                        )}

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWishlistToggle(product.id);
                          }}
                          className={`product-wishlist-btn ${wishlistItems.includes(product.id) ? 'active' : ''}`}
                          title={wishlistItems.includes(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          {wishlistItems.includes(product.id) ? "❤️" : "🤍"}
                        </button>

                        {/* Quick View Button */}
                        <button
                          onClick={(e) => openQuickView(product, e)}
                          className="product-quick-view-btn"
                          title="Quick view"
                        >
                          Quick View
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="product-info">
                        {/* Category */}
                        <p className="product-category">{product.category}</p>

                        {/* Title */}
                        <h3 className="product-title">{product.pname}</h3>

                        {/* Price */}
                        <div className="product-price-section">
                          <span className="product-price">₹{product.price}</span>
                          <span className={`product-stock-badge ${
                            product.stock === 0 ? 'out-of-stock' : 
                            product.stock < 5 ? 'low-stock' : 'in-stock'
                          }`}>
                            {product.stock === 0 ? 'Out' : `${product.stock} left`}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={product.stock === 0}
                          className="product-add-cart w-full"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
                      quickViewProduct.stock === 0 ? 'out-of-stock' :
                      quickViewProduct.stock < 5 ? 'low-stock' : 'in-stock'
                    }`}>
                      {quickViewProduct.stock === 0 ? 'Out' : `${quickViewProduct.stock} left`}
                    </span>
                  </div>

                  {quickViewProduct.description && (
                    <p className="text-gray-600 text-sm">{quickViewProduct.description}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      className="btn-primary btn-md"
                      onClick={() => {
                        handleAddToCart(quickViewProduct);
                        closeQuickView();
                      }}
                      disabled={quickViewProduct.stock === 0}
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

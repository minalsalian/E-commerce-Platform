import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function ClientNavbar() {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "user";
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Update cart count
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartCount(cart.length);
      } catch (err) {
        console.log("Error getting cart:", err);
      }
    };

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  // Detect scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    navigate("/");
  };

  return (
    <>
      <nav
        className={`client-navbar ${scrolled ? 'client-navbar-scrolled' : ''}`}
        style={{ position: "fixed", top: 0, left: 0, right: 0 }}
      >
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate("/")}
            className="flex-shrink-0 cursor-pointer group"
          >
            <h2 className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
              🛒 E-Commerce
            </h2>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {!isLoggedIn && (
              <div className="flex gap-4">
                <Link to="/" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}

            {isLoggedIn && (
              <div className="flex items-center gap-6">
                <Link to="/shop" className="nav-link">Shop</Link>
                <Link to="/wishlist" className="nav-link relative group">
                  Wishlist
                </Link>
                <Link to="/cart" className="nav-link relative group">
                  <span className="flex items-center gap-2">
                    Cart
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-danger text-white text-xs font-bold 
                                     rounded-full w-5 h-5 flex items-center justify-center 
                                     group-hover:scale-110 transition-transform">
                        {cartCount}
                      </span>
                    )}
                  </span>
                </Link>
                <Link to="/myorders" className="nav-link">Orders</Link>
                <Link to="/price-alerts" className="nav-link">Price Alerts</Link>
                <Link to="/profile" className="nav-link">Profile</Link>
                <button 
                  onClick={logout} 
                  className="btn-outline-primary btn-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-slideUp pb-4 border-t border-gray-700">
            <div className="flex flex-col gap-3 mt-4">
              {!isLoggedIn && (
                <>
                  <Link to="/" className="nav-link block py-2">Login</Link>
                  <Link to="/register" className="btn-primary w-full text-center py-2">
                    Register
                  </Link>
                </>
              )}

              {isLoggedIn && (
                <>
                  <Link to="/shop" className="nav-link block py-2">Shop</Link>
                  <Link to="/wishlist" className="nav-link block py-2">Wishlist</Link>
                  <Link to="/cart" className="nav-link block py-2">
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <Link to="/myorders" className="nav-link block py-2">Orders</Link>
                  <Link to="/price-alerts" className="nav-link block py-2">Price Alerts</Link>
                  <Link to="/profile" className="nav-link block py-2">Profile</Link>
                  <button 
                    onClick={logout} 
                    className="btn-outline-primary w-full py-2"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Bar Section */}
      <div className="border-t border-gray-700 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <SearchBar placeholder="🔍 Search products..." />
        </div>
      </div>
      </nav>
      <div className="client-navbar-spacer" />
    </>
  );
}

// Navigation Link Styles (add to index.css or use className)


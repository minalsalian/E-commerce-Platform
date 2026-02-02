import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SearchBar = ({ className, placeholder = "Search products..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const debounceTimer = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setHistory(stored);
  }, []);

  const saveToHistory = (term) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const updated = [
      cleaned,
      ...history.filter((item) => item.toLowerCase() !== cleaned.toLowerCase())
    ].slice(0, 6);
    setHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  // Debounced search function
  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/search/suggestions', {
        params: { q: searchQuery }
      });
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced input handler
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search (300ms delay)
    if (value.trim().length > 0) {
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search submission
  const handleSearch = (e, searchTerm = null) => {
    e.preventDefault();
    const term = searchTerm || query;
    
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term)}`);
      saveToHistory(term);
      setQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (product) => {
    setQuery(product.pname);
    setSuggestions([]);
    setShowSuggestions(false);
    saveToHistory(product.pname);
    navigate(`/search?q=${encodeURIComponent(product.pname)}`);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.className !== 'search-input') {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%' }}>
        <input
          type="text"
          className="search-input"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query && suggestions.length > 0) setShowSuggestions(true);
            if (!query && history.length > 0) setShowHistory(true);
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '6px 0 0 6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: '1px solid #3b82f6',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          🔍
        </button>
      </form>

      {/* Recent Search History */}
      {showHistory && history.length > 0 && !query && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            borderBottom: '1px solid #f3f4f6',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>Recent searches</span>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('searchHistory');
                setShowHistory(false);
              }}
              style={{
                fontSize: '12px',
                color: '#ef4444',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
          {history.map((item, idx) => (
            <button
              key={`${item}-${idx}`}
              type="button"
              onClick={(e) => handleSearch(e, item)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                borderBottom: idx < history.length - 1 ? '1px solid #f3f4f6' : 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#111827'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {loading && (
            <div style={{ padding: '12px 14px', color: '#6b7280', textAlign: 'center', fontSize: '14px' }}>
              Loading...
            </div>
          )}

          {suggestions.map((product, idx) => (
            <div
              key={product.id}
              onClick={() => handleSuggestionClick(product)}
              style={{
                padding: '12px 14px',
                borderBottom: idx < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                transition: 'background 0.2s',
                background: 'transparent',
                _hover: { background: '#f9fafb' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              {/* Product Image */}
              {product.image && (
                <img
                  src={`http://localhost:8000${product.image}`}
                  alt={product.pname}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
              )}

              {/* Product Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 500,
                  color: '#111827',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {product.pname}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>₹{product.price}</span>
                  {product.stock > 0 ? (
                    <span style={{ color: '#10b981' }}>In stock</span>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Out of stock</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {showSuggestions && query && !loading && suggestions.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            padding: '12px 14px',
            color: '#6b7280',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          No products found
        </div>
      )}
    </div>
  );
};

export default SearchBar;

import React, { useState, useEffect } from 'react';

const VariantSelector = ({ productId, onVariantSelect, onVariantClear }) => {
  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/products/${productId}/variants`);
      const data = await response.json();
      setVariants(data);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setVariants([]);
    } finally {
      setLoading(false);
    }
  };

  const sizes = [...new Set(variants.map(v => v.size))].filter(Boolean);
  const colors = [...new Set(variants.map(v => v.color))].filter(Boolean);

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    updateVariantSelection(size, selectedColor);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    updateVariantSelection(selectedSize, color);
  };

  const updateVariantSelection = (size, color) => {
    if (size && color) {
      const variant = variants.find(v => v.size === size && v.color === color);
      setSelectedVariant(variant);
      if (variant) {
        onVariantSelect({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stock: variant.stock
        });
      }
    } else {
      setSelectedVariant(null);
      onVariantClear();
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading variants...</div>;
  }

  if (variants.length === 0) {
    return null; // No variants available
  }

  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Select Options</h3>

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Size
          </label>
          <div className="flex flex-wrap gap-2">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                className={`px-4 py-2 border rounded-lg transition ${
                  selectedSize === size
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map(color => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`px-4 py-2 border rounded-lg transition ${
                  selectedColor === color
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Variant Details */}
      {selectedVariant && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Price</p>
              <p className="text-xl font-bold text-blue-600">₹{selectedVariant.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Stock Available</p>
              <p className={`text-xl font-bold ${selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {selectedVariant.stock > 0 ? `${selectedVariant.stock} items` : 'Out of Stock'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;

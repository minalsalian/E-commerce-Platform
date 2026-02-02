import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VariantManager = ({ productId, onClose }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    size: '',
    color: '',
    price: '',
    stock: '',
    sku: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8000/api/products/${productId}/variants`);
      setVariants(res.data);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setMessage('Error fetching variants');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.size || !formData.color || !formData.price || formData.stock === '') {
      setMessage('Please fill all required fields');
      return;
    }

    try {
      if (editingId) {
        // Update variant
        await axios.put(
          `http://localhost:8000/api/products/${productId}/variants/${editingId}`,
          {
            size: formData.size,
            color: formData.color,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            sku: formData.sku
          }
        );
        setMessage('Variant updated successfully');
      } else {
        // Add new variant
        await axios.post(
          `http://localhost:8000/api/products/${productId}/variants`,
          {
            size: formData.size,
            color: formData.color,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            sku: formData.sku
          }
        );
        setMessage('Variant added successfully');
      }

      setFormData({ size: '', color: '', price: '', stock: '', sku: '' });
      setEditingId(null);
      setShowForm(false);
      fetchVariants();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Error saving variant');
    }
  };

  const handleEdit = (variant) => {
    setFormData({
      size: variant.size,
      color: variant.color,
      price: variant.price,
      stock: variant.stock,
      sku: variant.sku || ''
    });
    setEditingId(variant.id);
    setShowForm(true);
  };

  const handleDelete = async (variantId) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/products/${productId}/variants/${variantId}`);
      setMessage('Variant deleted successfully');
      fetchVariants();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Error deleting variant');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ size: '', color: '', price: '', stock: '', sku: '' });
    setMessage('');
  };

  return (
    <div style={{
      marginTop: 32,
      padding: 20,
      background: '#f9fafb',
      borderRadius: 8,
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Product Variants</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {showForm ? 'Cancel' : 'Add Variant'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: 12,
          background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
          color: message.includes('Error') ? '#991b1b' : '#065f46',
          borderRadius: 6,
          marginBottom: 16,
          fontSize: 14
        }}>
          {message}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#fff',
          padding: 16,
          borderRadius: 6,
          marginBottom: 16,
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Size *
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g., S, M, L, XL"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Color *
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g., Red, Blue, Black"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                SKU (Optional)
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                placeholder="Auto-generated if left blank"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              {editingId ? 'Update Variant' : 'Add Variant'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 20px',
                background: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading variants...</p>
      ) : variants.length === 0 ? (
        <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>
          No variants yet. Add one to get started!
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#fff'
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Size</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Color</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>Stock</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, fontSize: 14 }}>SKU</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, idx) => (
                <tr key={variant.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: 14 }}>{variant.size}</td>
                  <td style={{ padding: '12px', fontSize: 14 }}>{variant.color}</td>
                  <td style={{ padding: '12px', fontSize: 14, fontWeight: 600, color: '#10b981' }}>₹{variant.price}</td>
                  <td style={{
                    padding: '12px',
                    fontSize: 14,
                    color: variant.stock > 10 ? '#10b981' : variant.stock > 5 ? '#f59e0b' : variant.stock > 0 ? '#ef4444' : '#991b1b'
                  }}>
                    {variant.stock}
                  </td>
                  <td style={{ padding: '12px', fontSize: 14, color: '#6b7280' }}>{variant.sku || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEdit(variant)}
                      style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        marginRight: 6
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(variant.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VariantManager;

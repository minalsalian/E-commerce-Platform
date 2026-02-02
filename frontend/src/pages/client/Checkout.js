import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ClientNavbar from "../../components/ClientNavbar";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(data);
    
    // Pre-fill user name if logged in
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData && userData.name) setName(userData.name);
  }, []);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponMsg("Please enter a coupon code");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/coupons/validate", {
        code: couponCode,
        orderTotal: total
      });

      if (res.data.valid) {
        setAppliedCoupon(res.data.coupon);
        setCouponMsg(`Coupon applied! You saved ₹${res.data.coupon.discount_amount.toFixed(2)}`);
      }
    } catch (err) {
      setCouponMsg(err.response?.data?.msg || "Invalid coupon code");
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMsg("");
  };

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const deliveryFee = total > 500 ? 0 : 40;
  const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const grandTotal = total + deliveryFee - discount;

  const placeOrder = async () => {
    if (!name || !phone || !address || !city || !pincode) {
      setMsg("All fields are required");
      return;
    }

    if (cart.length === 0) {
      setMsg("Your cart is empty");
      return;
    }

    if (phone.length < 10) {
      setMsg("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (!userData || !userData.id) {
        setMsg("Please login to place an order");
        setLoading(false);
        return;
      }

      // Check stock availability before placing order
      try {
        const stockCheckRes = await axios.post("http://localhost:8000/api/check-stock", {
          items: cart,
        });
        if (!stockCheckRes.data.available) {
          setMsg("Some items are out of stock. Please update your cart.");
          setLoading(false);
          return;
        }
      } catch (stockErr) {
        if (stockErr.response?.status === 400) {
          const unavailable = stockErr.response.data.unavailable || [];
          const itemList = unavailable.map(i => `${i.name}: ${i.available}/${i.requested} available`).join(", ");
          setMsg(`Out of stock: ${itemList}`);
          setLoading(false);
          return;
        }
      }
      
      const orderData = {
        user_id: userData.id,
        items: cart,
        total: grandTotal,
        shippingAddress: {
          name,
          phone,
          address,
          city,
          pincode,
        },
        paymentMethod,
      };

      const res = await axios.post("http://localhost:8000/api/orders", orderData);

      if (res.data.orderId) {
        // Increment coupon usage if applied
        if (appliedCoupon) {
          await axios.post(`http://localhost:8000/api/coupons/${appliedCoupon.id}/use`);
        }
        
        localStorage.removeItem("cart");
        setMsg("Order placed successfully!");
        
        setTimeout(() => {
          navigate("/myorders");
        }, 1500);
      }
    } catch (err) {
      console.log("Order error:", err);
      setMsg("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ClientNavbar />

      <div
        style={{
          padding: 24,
          background: "#f9fafb",
          minHeight: "100vh",
        }}
      >
        <h1 style={{ marginBottom: 20 }}>Checkout</h1>

        {msg && (
          <p
            style={{
              padding: 12,
              background: msg.includes("success") ? "#d1fae5" : "#fee2e2",
              color: msg.includes("success") ? "#065f46" : "#991b1b",
              borderRadius: 8,
              marginBottom: 16,
              maxWidth: 900,
              margin: "0 auto 16px",
            }}
          >
            {msg}
          </p>
        )}

        {cart.length === 0 ? (
          <div
            style={{
              maxWidth: 600,
              margin: "40px auto",
              background: "#fff",
              padding: 40,
              borderRadius: 12,
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ color: "#6b7280", marginBottom: 16 }}>Your cart is empty</h3>
            <button
              onClick={() => navigate("/shop")}
              style={{ ...btn, background: "#2563eb" }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <Breadcrumbs items={[{ label: "Cart", to: "/cart" }, { label: "Checkout" }]} />
            <div
              style={{
                maxWidth: 1000,
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 400px",
                gap: 24,
              }}
            >
              {/* Left Column - Shipping & Payment */}
            <div>
              {/* Shipping Details */}
              <div
                style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ marginBottom: 16, fontSize: 18 }}>Shipping Details</h3>

                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Full Name *</label>
                  <input
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={input}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={10}
                    style={input}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={label}>Address *</label>
                  <textarea
                    placeholder="House No., Street, Landmark"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ ...input, minHeight: 80, resize: "vertical" }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <label style={label}>City *</label>
                    <input
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={input}
                    />
                  </div>
                  <div>
                    <label style={label}>Pincode *</label>
                    <input
                      type="text"
                      placeholder="6-digit pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      maxLength={6}
                      style={input}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div
                style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <h3 style={{ marginBottom: 16, fontSize: 18 }}>Payment Method</h3>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: 12,
                      border: `2px solid ${
                        paymentMethod === "COD" ? "#10b981" : "#e5e7eb"
                      }`,
                      borderRadius: 8,
                      cursor: "pointer",
                      background: paymentMethod === "COD" ? "#f0fdf4" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="COD"
                      checked={paymentMethod === "COD"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ marginRight: 10, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Cash on Delivery</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Pay when you receive the order
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: 12,
                      border: `2px solid ${
                        paymentMethod === "Online" ? "#10b981" : "#e5e7eb"
                      }`,
                      borderRadius: 8,
                      cursor: "pointer",
                      background: paymentMethod === "Online" ? "#f0fdf4" : "#fff",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="Online"
                      checked={paymentMethod === "Online"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ marginRight: 10, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>Online Payment</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>
                        UPI / Cards / Net Banking
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <div
                style={{
                  background: "#fff",
                  padding: 24,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "sticky",
                  top: 20,
                }}
              >
                <h3 style={{ marginBottom: 16, fontSize: 18 }}>Order Summary</h3>

                <div
                  style={{
                    maxHeight: 300,
                    overflowY: "auto",
                    marginBottom: 16,
                  }}
                >
                  {cart.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>
                          {c.pname || c.name}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280" }}>
                          Qty: {c.qty} × ₹{c.price}
                        </div>
                      </div>
                      <div style={{ fontWeight: 600 }}>₹{c.price * c.qty}</div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 16, marginBottom: 16 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
                    Have a Coupon Code?
                  </h3>
                  
                  {!appliedCoupon ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                      />
                      <button
                        onClick={applyCoupon}
                        style={{
                          padding: "10px 20px",
                          background: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 12,
                        background: "#d1fae5",
                        borderRadius: 6,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#065f46" }}>
                          {appliedCoupon.code} Applied! \u2713
                        </div>
                        <div style={{ fontSize: 12, color: "#059669" }}>
                          You saved \u20b9{appliedCoupon.discount_amount.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        style={{
                          padding: "6px 12px",
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  
                  {couponMsg && !appliedCoupon && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        background: couponMsg.includes("saved") ? "#d1fae5" : "#fee2e2",
                        color: couponMsg.includes("saved") ? "#065f46" : "#991b1b",
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      {couponMsg}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "2px solid #e5e7eb", paddingTop: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      fontSize: 14,
                    }}
                  >
                    <span>Subtotal</span>
                    <span>₹{total}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                      fontSize: 14,
                    }}
                  >
                    <span>Delivery Fee</span>
                    <span style={{ color: deliveryFee === 0 ? "#10b981" : "#000" }}>
                      {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                        fontSize: 14,
                        color: "#10b981",
                      }}
                    >
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>-₹{appliedCoupon.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFee > 0 && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 12,
                      }}
                    >
                      Add ₹{500 - total} more for FREE delivery
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: 700,
                      fontSize: 18,
                      paddingTop: 12,
                      borderTop: "2px solid #e5e7eb",
                    }}
                  >
                    <span>Total</span>
                    <span style={{ color: "#10b981" }}>₹{grandTotal}</span>
                  </div>
                </div>

                <button
                  onClick={placeOrder}
                  disabled={loading}
                  style={{
                    ...btn,
                    width: "100%",
                    marginTop: 20,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Placing Order..." : `Place Order - ₹${grandTotal}`}
                </button>

                <div
                  style={{
                    marginTop: 16,
                    padding: 12,
                    background: "#f9fafb",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#6b7280",
                  }}
                >
                  🔒 Secure checkout • Your information is protected
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </>
  );
}

const label = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const input = {
  display: "block",
  padding: "10px 12px",
  marginBottom: 0,
  width: "100%",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const btn = {
  padding: "14px 20px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: 600,
  transition: "background 0.2s",
};

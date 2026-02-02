import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const register = async () => {
    if (!name || !email || !password) {
      setMsg("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/register", {
        name,
        email,
        password,
        role: "user",
      });

      setMsg(res.data.msg);

      if (res.data.msg === "Registered successfully") {
        setTimeout(() => navigate("/"), 1000);
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Register</h2>

        <div className="form-group">
          <input 
            className="w-full" 
            placeholder="Full Name" 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <input 
            className="w-full" 
            type="email"
            placeholder="Email" 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <input 
            className="w-full" 
            type="password" 
            placeholder="Password" 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button className="btn-primary w-full" onClick={register}>Create Account</button>

        {msg && <p className="text-danger text-sm mt-4 text-center font-semibold">{msg}</p>}

        <p className="text-center text-gray-600 mt-6">
          Already have an account? <Link to="/" className="text-primary font-semibold hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

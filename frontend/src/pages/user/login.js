import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    if (!email || !password) {
      setMsg("Enter email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:8000/api/login", {
        email,
        password,
      });

      if (res.data.msg === "Login successful") {
        localStorage.setItem("isLoggedIn", res.data.user.role);
        localStorage.setItem("userId", res.data.user.id);
        localStorage.setItem("userName", res.data.user.name);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (res.data.user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/shop");
        }
      } else {
        setMsg(res.data.msg);
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Login</h2>

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

        <button className="btn-primary w-full" onClick={login}>Login</button>

        {msg && <p className="text-danger text-sm mt-4 text-center font-semibold">{msg}</p>}

        <p className="text-center text-gray-600 mt-6">
          New user? <Link to="/register" className="text-primary font-semibold hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

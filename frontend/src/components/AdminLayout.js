import React, { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("isLoggedIn");
    if (role !== "admin") {
      navigate("/"); // send back to login
    }
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <nav className="admin-nav">
          <NavItem to="/admin/dashboard" label="Dashboard" />
          <NavItem to="/admin/users" label="Manage Users" />
          <NavItem to="/admin/categories" label="Manage Category" />
          <NavItem to="/admin/products" label="Manage Products" />
          <NavItem to="/admin/product-images" label="Product Images" />
          <NavItem to="/admin/orders" label="Orders" />
          <NavItem to="/admin/coupons" label="Manage Coupons" />
          <NavItem to="/admin/low-stock" label="Low Stock Alerts" />
        </nav>

        <button onClick={logout} className="admin-logout-btn">Logout</button>
      </aside>

      <main className="admin-content">
        <div className="admin-topbar">
          <h1 className="admin-page-title">Admin Panel</h1>
        </div>
        <div className="admin-page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `admin-nav-link${isActive ? " active" : ""}`
      }
    >
      {label}
    </NavLink>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/user/login";
import Register from "./pages/user/register";
import Profile from "./pages/user/Profile";
import Dashboard from "./pages/admin/Dashboard";
import AdminLayout from "./components/AdminLayout";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageCategory from "./pages/admin/ManageCategory";
import Orders from "./pages/admin/Orders";
import ManageProducts from "./pages/admin/ManageProducts";
import ManageCoupons from "./pages/admin/ManageCoupons";
import ManageProductImages from "./pages/admin/ManageProductImages";
import LowStockAlerts from "./pages/admin/LowStockAlerts";
import Shop from "./pages/client/Shop";
import Cart from "./pages/client/Cart";
import Checkout from "./pages/client/Checkout";
import ProductDetails from "./pages/client/ProductDetails";
import MyOrders from "./pages/client/MyOrders";
import Wishlist from "./pages/client/Wishlist";
import SearchResults from "./pages/client/SearchResults";
import PriceAlerts from "./pages/client/PriceAlerts";
import { ToastContainer } from "react-toastify";



function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
  <Routes>
    {/* Public / Client Routes */}
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/shop" element={<Shop />} />
    <Route path="/search" element={<SearchResults />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/myorders" element={<MyOrders />} />
    <Route path="/my-orders" element={<MyOrders />} />
    <Route path="/wishlist" element={<Wishlist />} />
    <Route path="/price-alerts" element={<PriceAlerts />} />

    {/* Admin Routes */}
    <Route path="/admin" element={<AdminLayout />}>
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="users" element={<ManageUsers />} />
      <Route path="categories" element={<ManageCategory />} />
      <Route path="products" element={<ManageProducts />} />
      <Route path="orders" element={<Orders />} />
      <Route path="coupons" element={<ManageCoupons />} />
      <Route path="product-images" element={<ManageProductImages />} />
      <Route path="low-stock" element={<LowStockAlerts />} />
    </Route>
  </Routes>
</BrowserRouter>

  );
}

export default App;


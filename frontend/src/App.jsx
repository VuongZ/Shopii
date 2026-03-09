import React from "react";
import axiosClient from "./api/axiosClient";
import { Routes, Route, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import UsersPage from "./pages/UsersPage";
import Home from "./pages/ShopPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentResult from "./pages/PaymentResult";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";

import "./App.css";

function App() {
  const [searchKeyword, setSearchKeyword] = React.useState("");

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <Link to="/">Shopii</Link>
        </div>

        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          className="search-input"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />

        <nav className="nav">
          <Link to="/" className="nav-link">
            Trang chủ
          </Link>

          <div className="cart-wrapper">
            <Link to="/cart" className="nav-link cart-icon">
              <ShoppingCart size={20} />
            </Link>
          </div>

          <Link to="/orders" className="nav-link">
            Đơn mua
          </Link>

          <Link to="/users" className="nav-link">
            Users
          </Link>
        </nav>
      </header>

      <main className="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/users" element={<UsersPage />} />

          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/" element={<Home searchKeyword={searchKeyword} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

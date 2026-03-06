import React from "react";
import axiosClient from "./api/axiosClient";
import { Routes, Route, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import Home from "./pages/Home";
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
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <Link to="/">Shopii</Link>
        </div>

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          className="search-input"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />

        {/* MENU */}
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
        </nav>
      </header>

      {/* MAIN */}
      <main className="main">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPage />} />

          {/* Trang chi tiết sản phẩm */}
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Trang chủ */}
          <Route
            path="/"
            element={<Home searchKeyword={searchKeyword} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
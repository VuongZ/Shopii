import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentResult from "./pages/PaymentResult";
import "./App.css";
import logoShopii from "../public/logoShopii.png";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import { useState, useEffect } from "react";

//import { ShoppingCart, Home, User } from 'lucide-react';

function App() {
  const [isLogin, setIsLogin] = useState(
    !!localStorage.getItem("ACCESS_TOKEN")
  );

  useEffect(() => {
    const syncLoginState = () => {
      setIsLogin(!!localStorage.getItem("ACCESS_TOKEN"));
    };

    window.addEventListener("storage", syncLoginState);

    return () => {
      window.removeEventListener("storage", syncLoginState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("USER_INFO");
    setIsLogin(false);
  };

  return (
    <div className="app-container">
      <header className="shopee-header">
        <div className="header-content">
          <Link to="/" className="logo">
            <img src={logoShopii} alt="Shopii Logo" />
            Shopii
          </Link>

          <nav className="nav-menu">
            <Link to="/" className="nav-link">Trang chủ</Link>
            <Link to="/reviews" className="nav-link">Đánh Giá</Link>
            <Link to="/cart" className="nav-link">🛒 Giỏ hàng</Link>
            <Link to="/orders" className="nav-link">📦 Đơn mua</Link>

            {isLogin ? (
              <span
                className="nav-link"
                onClick={handleLogout}
                style={{ cursor: "pointer" }}
              >
                Đăng xuất
              </span>
            ) : (
              <>
                <Link to="/login" className="nav-link">Đăng nhập</Link>
                <Link to="/register" className="nav-link">Đăng ký</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
        </Routes>
      </div>
    </div>
  );
}



// Trang chủ đơn giản
function Home() {
  const isLogin = localStorage.getItem("ACCESS_TOKEN");
  const logout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    window.location.reload();
  };

  return (
    <div className="welcome-card">
      <h1 className="home-title">Chào mừng đến với Shopii 🎉</h1>
      <p>Nền tảng thương mại điện tử yêu thích của bạn.</p>

      {isLogin ? (
        <div style={{ marginTop: 20 }}>
          <span style={{ color: "green", fontWeight: "bold" }}>
            ✅ Đã đăng nhập
          </span>
          <button onClick={logout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <p>Bạn chưa đăng nhập.</p>
        </div>
      )}
    </div>
  );
}

export default App;

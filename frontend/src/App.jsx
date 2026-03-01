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
import Categories from "./pages/CategoriesPage";

//import { ShoppingCart, Home, User } from 'lucide-react';

function App() {
  const user = JSON.parse(localStorage.getItem("USER_INFO"));
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
            <Link to="/cart" className="nav-link"> Giỏ hàng</Link>
            <Link to="/orders" className="nav-link"> Đơn mua</Link>
            {isLogin && user?.role === "admin" && (
              <Link to="/categories" className="nav-link">
                Categories
              </Link>
            )}

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
          <Route
            path="/categories"
            element={
              isLogin && user?.role === "admin"
                ? <Categories />
                : <Home />
            }
          />
        </Routes>
      </div>
    </div>
  );
}



// Trang chủ đơn giản
function Home() {
  const [products, setProducts] = React.useState([]);
  const [showLoginNotice, setShowLoginNotice] = React.useState(
    !localStorage.getItem("ACCESS_TOKEN")
  );

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/products"
      );
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "40px", position: "relative" }}>
      
      {/* 🔔 Thông báo chưa đăng nhập */}
      {showLoginNotice && (
  <div
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      background: "white",
      padding: "22px",
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      width: "300px",
      zIndex: 1000,
    }}
  >
    {/* Nút đóng */}
    <button
      onClick={() => setShowLoginNotice(false)}
      style={{
        position: "absolute",
        top: "10px",
        right: "12px",
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#555",
      }}
    >
      ✖
    </button>

    <h3 style={{ marginBottom: "12px" }}>
      Bạn chưa đăng nhập
    </h3>

    <p style={{ fontSize: "14px", marginBottom: "18px", color: "#666" }}>
      Đăng nhập để mua hàng và sử dụng đầy đủ chức năng.
    </p>

    {/* Nút giống banner */}
    <a
      href="/login"
      style={{
        display: "block",
        textAlign: "center",
        background: "linear-gradient(90deg, #ff7a00, #ff3c00)",
        color: "white",
        padding: "10px",
        borderRadius: "8px",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      Đăng nhập ngay
    </a>
  </div>
)}

      <h2 style={{ marginBottom: "30px" }}>
        Danh sách sản phẩm
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "25px",
        }}
      >
        {products.map((product) => {
          const thumbnail = product.product_images?.find(
            (img) => img.is_thumbnail == 1
          );

          const imageUrl =
            thumbnail?.image_url ||
            product.product_images?.[0]?.image_url ||
            "https://via.placeholder.com/200";

          return (
            <div
              key={product.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "8px",
                boxShadow:
                  "0 3px 10px rgba(0,0,0,0.05)",
              }}
            >
              <img
                src={imageUrl}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "6px",
                }}
              />

              <h3 style={{ margin: "12px 0 6px" }}>
                {product.name}
              </h3>

              <p
                style={{
                  color: "#e11d48",
                  fontWeight: "bold",
                }}
              >
                {Number(product.base_price).toLocaleString()} đ
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;

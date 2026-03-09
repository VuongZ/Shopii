import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

import userApi from "./api/userApi";

import UsersPage from "./pages/UsersPage";
import Home from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentResult from "./pages/PaymentResult";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProductDetailPage from "./pages/ProductDetailPage";

import "./App.css";

function App() {
  const navigate = useNavigate();

  const [searchKeyword, setSearchKeyword] = useState("");

  // Load user từ localStorage khi khởi tạo
  const [user, setUser] = useState(() => {
    const info = localStorage.getItem("USER_INFO");
    return info ? JSON.parse(info) : null;
  });

  // Lắng nghe thay đổi localStorage
  useEffect(() => {
    const handleStorage = () => {
      const info = localStorage.getItem("USER_INFO");
      setUser(info ? JSON.parse(info) : null);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.log("Logout error:", err);
    }

    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("USER_INFO");

    setUser(null);

    navigate("/login");
  };

  return (
    <div className="app-container">
      {/* ================= NAVBAR ================= */}
      <header className="shopee-header">
        <div className="header-content">
          {/* LOGO */}
          <Link to="/" className="logo">
            Shopii
          </Link>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Tìm sản phẩm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              marginLeft: "40px",
              padding: "6px 10px",
              width: "300px",
              borderRadius: "6px",
              border: "1px solid #ddd",
            }}
          />

          {/* NAV MENU */}
          <nav className="nav-menu">
            <Link to="/" className="nav-link">
              Trang chủ
            </Link>

            <Link to="/cart" className="nav-link">
              <ShoppingCart size={20} />
            </Link>

            <Link to="/orders" className="nav-link">
              Đơn mua
            </Link>

            <Link to="/users" className="nav-link">
              Users
            </Link>

            {!user ? (
              <>
                <Link to="/login" className="nav-link">
                  Đăng nhập
                </Link>

                <Link to="/register" className="nav-link">
                  Đăng ký
                </Link>
              </>
            ) : (
              <>
                <span style={{ marginLeft: "10px" }}>
                  Xin chào <b>{user.name}</b>
                </span>

                <button className="btn-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home searchKeyword={searchKeyword} />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/cart" element={<CartPage />} />

          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/payment-result" element={<PaymentResult />} />

          <Route path="/orders" element={<OrderHistoryPage />} />

          <Route path="/users" element={<UsersPage />} />

          <Route path="/product/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

import React from 'react';
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import './App.css'; // 👈 QUAN TRỌNG: Nhớ import file CSS vừa tạo

// Nếu bạn chưa cài icon thì dùng chữ thường, không sao cả
// import { ShoppingCart, Home, User } from 'lucide-react'; 

function App() {
  return (
    <div className="app-container">
      {/* HEADER MÀU CAM */}
      <header className="shopee-header">
        <div className="header-content">
          {/* Logo bên trái */}
          <Link to="/" className="logo">
             Shopii
          </Link>

          {/* Menu bên phải */}
          <nav className="nav-menu">
            <Link to="/" className="nav-link">Trang chủ</Link>
              <Link to="/reviews" className="nav-link">Đánh Giá</Link>
            <Link to="/cart" className="nav-link">🛒 Giỏ hàng</Link>
            <span>|</span>
            <Link to="/login" className="nav-link">Đăng nhậpp</Link>
            <Link to="/register" className="nav-link">Đăng ký</Link>
          </nav>
        </div>
      </header>

      {/* NỘI DUNG CHÍNH */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
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
      <h1 style={{ color: '#ee4d2d' }}>Chào mừng đến với Shopii 🎉</h1>
      <p>Nền tảng thương mại điện tử yêu thích của bạn.</p>
      
      {isLogin ? (
        <div style={{ marginTop: 20 }}>
          <span style={{ color: 'green', fontWeight: 'bold' }}>✅ Đã đăng nhập</span>
          <button onClick={logout} className="btn-logout">Đăng xuất</button>
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
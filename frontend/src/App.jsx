import React from "react";
import axiosClient from "./api/axiosClient";
import { Routes, Route, Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

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
import ShopPage from "./pages/ShopPage";
import AdminShopsPage from "./pages/AdminShopsPage";

//import { ShoppingCart, Home, User } from 'lucide-react';

function App() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("USER_INFO")),
  );
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [isLogin, setIsLogin] = useState(
    !!localStorage.getItem("ACCESS_TOKEN"),
  );
  const fetchCart = async () => {
    try {
      const res = await axiosClient.get("/cart");
      const cartData = res.data || {};
      const items = Object.values(cartData).flat();
      setCartItems(items);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const init = async () => {
      if (localStorage.getItem("ACCESS_TOKEN")) {
        await fetchCart();
      }
    };

    init();
  }, []);
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
    setUser(null);
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
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ddd",
                marginRight: "15px",
                width: "200px",
              }}
            />
            <Link to="/" className="nav-link">
              Trang chủ
            </Link>
            <Link to="/reviews" className="nav-link">
              Đánh Giá
            </Link>
            <div
              className="cart-wrapper"
              onMouseEnter={() => setShowCart(true)}
              onMouseLeave={() => setShowCart(false)}
              style={{ position: "relative" }}
            >
              <Link
                to="/cart"
                className="nav-link"
                style={{ position: "relative" }}
              >
                <ShoppingCart size={28} />

                {cartItems.length > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-10px",
                      background: "#ff3c00",
                      color: "white",
                      borderRadius: "50%",
                      fontSize: "12px",
                      padding: "3px 6px",
                    }}
                  >
                    {cartItems.length}
                  </span>
                )}
              </Link>

              {showCart && (
                <div
                  style={{
                    position: "absolute",
                    top: "35px",
                    right: "0",
                    width: "320px",
                    background: "white",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    borderRadius: "8px",
                    padding: "10px",
                    zIndex: 1000,
                  }}
                >
                  <h4 style={{ marginBottom: "10px" }}>Sản phẩm mới thêm</h4>

                  {cartItems.length === 0 ? (
                    <p>Chưa có sản phẩm</p>
                  ) : (
                    cartItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                        }}
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/40"}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            marginRight: "10px",
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px" }}>
                            {item.product_name}
                          </div>
                        </div>

                        <div style={{ color: "#ee4d2d", fontSize: "13px" }}>
                          {Number(item.price).toLocaleString()}đ
                        </div>
                      </div>
                    ))
                  )}

                  <div style={{ textAlign: "right", marginTop: "10px" }}>
                    <Link
                      to="/cart"
                      style={{
                        background: "#ee4d2d",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Xem Giỏ Hàng
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <Link to="/orders" className="nav-link">
              {" "}
              Đơn mua
            </Link>
            {isLogin && user?.role === "admin" && (
              <>
                <Link to="/categories" className="nav-link">
                  Categories
                </Link>

                <Link to="/admin/shops" className="nav-link">
                  Duyệt Shop
                </Link>
              </>
            )}
            {/* SELLER */}
            {isLogin && user?.role === "seller" && (
              <Link to="/shop" className="nav-link">
                Shop của tôi
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
                <Link to="/login" className="nav-link">
                  Đăng nhập
                </Link>
                <Link to="/register" className="nav-link">
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <div className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/" element={<Home searchKeyword={searchKeyword} />} />

          <Route
            path="/categories"
            element={
              isLogin && user?.role === "admin" ? (
                <Categories />
              ) : (
                <Home searchKeyword={searchKeyword} />
              )
            }
          />

          <Route
            path="/shop"
            element={
              isLogin && user?.role === "seller" ? (
                <ShopPage />
              ) : (
                <Home searchKeyword={searchKeyword} />
              )
            }
          />
          <Route
            path="/admin/shops"
            element={
              isLogin && user?.role === "admin" ? (
                <AdminShopsPage />
              ) : (
                <Home searchKeyword={searchKeyword} />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

// Trang chủ đơn giản
function Home({ searchKeyword }) {
  const [products, setProducts] = React.useState([]);
  const [showLoginNotice, setShowLoginNotice] = React.useState(
    !localStorage.getItem("ACCESS_TOKEN"),
  );
  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  React.useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchKeyword.toLowerCase()),
  );
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

          <h3 style={{ marginBottom: "12px" }}>Bạn chưa đăng nhập</h3>

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

      <h2 style={{ marginBottom: "30px" }}>Danh sách sản phẩm</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "25px",
        }}
      >
        {filteredProducts.map((product) => {
          const thumbnail = product.product_images?.find(
            (img) => img.is_thumbnail == 1,
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
                boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
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

              <h3 style={{ margin: "12px 0 6px" }}>{product.name}</h3>

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

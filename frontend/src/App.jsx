import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

import userApi from './api/userApi'
import UsersPage from './pages/UsersPage'
import Home from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentResult from './pages/PaymentResult'
import OrderHistoryPage from './pages/OrderHistoryPage'
import ProductDetailPage from './pages/ProductDetailPage'
import SellerCouponManagementPage from './pages/SellerCouponManagementPage'
import SellerProductDetail from './pages/SellerProductDetail'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'

import CategoriesPage from './pages/CategoriesPage'
import Reviews from './pages/Review'
import AdminShopsPage from './pages/AdminShopsPage'

// 1. ĐÃ THÊM IMPORT TRANG SHOP VÀO ĐÂY
import ShopPage from './pages/ShopPage'

import './App.css'

function App() {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('CART')) || []
      setCartItems(cart)

      const total = cart.reduce((sum, item) => sum + item.quantity, 0)
      setCartCount(total)
    }

    loadCart()
    window.addEventListener('storage', loadCart)

    return () => window.removeEventListener('storage', loadCart)
  }, [])
  const [user, setUser] = useState(() => {
    const info = localStorage.getItem('USER_INFO')
    return info ? JSON.parse(info) : null
  })

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('CART')) || []
      setCartItems(cart)

      // Ép kiểu Number để đảm bảo nó cộng toán học, không bị cộng chuỗi
      const total = cart.reduce((sum, item) => sum + Number(item.quantity), 0)
      setCartCount(total)
    }

    loadCart()

    // Lắng nghe sự kiện mặc định (khi user mở nhiều tab)
    window.addEventListener('storage', loadCart)
    // Lắng nghe sự kiện "Tự chế" của chúng ta (ngay trong cùng 1 tab)
    window.addEventListener('cartUpdated', loadCart)

    return () => {
      window.removeEventListener('storage', loadCart)
      window.removeEventListener('cartUpdated', loadCart)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await userApi.logout()
    } catch (err) {
      console.log('Logout error:', err)
    }
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('USER_INFO')
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="app-container">
      <header className="shopee-header">
        <div className="header-content">
          <Link to="/" className="logo">
            Shopii
          </Link>

          <nav className="nav-menu">
            <Link to="/" className="nav-link">
              Trang chủ
            </Link>
            <div className="cart-wrapper">
              <Link to="/cart" className="nav-link cart-icon">
                <ShoppingCart size={22} />

                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>

              <div className="cart-dropdown">
                {cartItems.length === 0 ? (
                  <p className="empty-cart-mini">Chưa có sản phẩm</p>
                ) : (
                  <>
                    {cartItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="mini-item">
                        <img src={item.image} />
                        <div>
                          <p>{item.name}</p>
                          <span>{item.price}đ</span>
                        </div>
                      </div>
                    ))}

                    <Link to="/cart" className="view-cart-btn">
                      Xem Giỏ Hàng
                    </Link>
                  </>
                )}
              </div>
            </div>
            <Link to="/orders" className="nav-link">
              Đơn mua
            </Link>

            {/* <Link to="/users" className="nav-link">
              Users
            </Link> */}

            {/* ADMIN */}
            {user && (user.role === 'admin' || user.role === 1) && (
              <Link
                to="/categories"
                className="nav-link"
                style={{ color: '#3b82f6', fontWeight: 'bold' }}
              >
                Categories
              </Link>
            )}

            {/* SELLER */}
            {user && (user.role === 'seller' || user.role === 2) && (
              <>
                <Link
                  to="/shop"
                  className="nav-link"
                  style={{ color: '#ee4d2d', fontWeight: 'bold' }}
                >
                  Cửa hàng của tôi
                </Link>

                <Link
                  to="/seller-coupons"
                  className="nav-link"
                  style={{ color: 'green', fontWeight: 'bold' }}
                >
                  Coupons
                </Link>
              </>
            )}

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
                <span style={{ marginLeft: '10px' }}>
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

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route
            path="/seller-coupons"
            element={<SellerCouponManagementPage />}
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/categories" element={<CategoriesPage />} />

          <Route path="/reviews" element={<Reviews />} />

          {/* shop */}

          <Route path="/admin/shops" element={<AdminShopsPage />} />

          {/* 3. ĐÃ KHAI BÁO ROUTE CHO TRANG SHOP */}

          <Route path="/shop" element={<ShopPage />} />

          <Route
            path="/seller/products/:id"
            element={<SellerProductDetail />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App

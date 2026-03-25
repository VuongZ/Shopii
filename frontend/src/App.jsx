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
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import CategoriesPage from './pages/CategoriesPage'
import Reviews from './pages/Review'
import ShopPage from './pages/ShopPage'

import './App.css'

function App() {
  const navigate = useNavigate()

  const [user, setUser] = useState(() => {
    const info = localStorage.getItem('USER_INFO')
    return info ? JSON.parse(info) : null
  })

  useEffect(() => {
    const handleStorage = () => {
      const info = localStorage.getItem('USER_INFO')
      setUser(info ? JSON.parse(info) : null)
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
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
            <Link to="/cart" className="nav-link">
              <ShoppingCart size={20} />
            </Link>
            <Link to="/orders" className="nav-link">
              Đơn mua
            </Link>
            <Link to="/users" className="nav-link">
              Users
            </Link>

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
          <Route path="/shop" element={<ShopPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

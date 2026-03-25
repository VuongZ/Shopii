import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import './ShopPage.css'
import SellerCouponManagementPage from './SellerCouponManagementPage'

export default function ShopPage() {
  const [shop, setShop] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('products')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    base_price: '',
    stock: '',
    description: '',
    image_url: '',
  })

  const [hasVariations, setHasVariations] = useState(false)
  const [skus, setSkus] = useState([{ sku_code: '', price: '', stock: '' }])

  const fetchShop = async () => {
    try {
      const res = await axiosClient.get('/my-shop')
      setShop(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShop()
    axiosClient
      .get('/categories')
      .then((res) => setCategories(res.data))
      .catch(console.log)
  }, [])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSkuChange = (index, field, value) => {
    const newSkus = [...skus]
    newSkus[index][field] = value
    setSkus(newSkus)
  }

  const addSkuRow = () =>
    setSkus([...skus, { sku_code: '', price: formData.base_price, stock: 0 }])

  const removeSkuRow = (index) => setSkus(skus.filter((_, i) => i !== index))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const dataToSend = {
      ...formData,
      skus: hasVariations ? skus : [],
    }

    try {
      const res = await axiosClient.post('/products', dataToSend)
      alert(res.data.message || 'Thêm sản phẩm thành công!')

      setIsModalOpen(false)
      setFormData({
        name: '',
        category_id: '',
        base_price: '',
        stock: '',
        description: '',
        image_url: '',
      })
      setHasVariations(false)
      setSkus([{ sku_code: '', price: '', stock: '' }])

      fetchShop()
    } catch (err) {
      alert(
        'Lỗi: ' +
          (err.response?.data?.error ||
            err.response?.data?.message ||
            'Không thể thêm sản phẩm')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading)
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Đang tải dữ liệu...
      </div>
    )

  if (!shop)
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Không tìm thấy thông tin shop
      </div>
    )

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
      }}
    >
      {/* SIDEBAR */}
      <div
        style={{
          width: '250px',
          background: '#1e293b',
          color: 'white',
          padding: '20px',
        }}
      >
        <h2 style={{ marginBottom: '30px' }}>Kênh Người Bán</h2>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li
            onClick={() => setActiveTab('products')}
            style={{
              padding: '12px',
              background: activeTab === 'products' ? '#3b82f6' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '10px',
            }}
          >
            Quản lý Sản phẩm
          </li>

          <li
            onClick={() => setActiveTab('coupons')}
            style={{
              padding: '12px',
              background: activeTab === 'coupons' ? '#22c55e' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Mã giảm giá
          </li>
        </ul>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, padding: '40px' }}>
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}
        >
          <h2>{shop.name}</h2>

          {activeTab === 'products' && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: '#ee4d2d',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
              }}
            >
              + Thêm sản phẩm
            </button>
          )}
        </div>

        {/* PRODUCTS */}
        {activeTab === 'products' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
              gap: '20px',
            }}
          >
            {shop.products?.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                }}
              >
                <h4>{p.name}</h4>
                <p>{p.base_price} đ</p>
              </div>
            ))}
          </div>
        )}

        {/* COUPONS */}
        {activeTab === 'coupons' && <SellerCouponManagementPage />}
      </div>

      {/* MODAL */}
      {activeTab === 'products' && isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ background: 'white', padding: '20px' }}>
            <h3>Thêm sản phẩm</h3>

            <form onSubmit={handleSubmit}>
              <input
                name="name"
                placeholder="Tên"
                value={formData.name}
                onChange={handleInputChange}
              />
              <br />

              <input
                name="base_price"
                placeholder="Giá"
                value={formData.base_price}
                onChange={handleInputChange}
              />
              <br />

              <button type="submit">Lưu</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

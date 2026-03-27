import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'
import './ShopPage.css'
import SellerCouponManagementPage from './SellerCouponManagementPage'
import SellerOrderManagementPage from './SellerOrderManagementPage'

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
      <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
    )

  if (!shop)
    return <div style={{ padding: '40px', textAlign: 'center' }}>No shop</div>

  return (
    <div className="seller-layout">
      {/* SIDEBAR */}
      <div className="seller-sidebar">
        <h2>Kênh Người Bán</h2>
        <ul>
          <li
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Quản lý Sản phẩm
          </li>
          <li
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Quản lý Đơn hàng
          </li>
          <li
            className={activeTab === 'coupons' ? 'active' : ''}
            onClick={() => setActiveTab('coupons')}
          >
            Mã giảm giá
          </li>
        </ul>
      </div>

      {/* CONTENT */}
      <div className="seller-content">
        {/* ================= TAB PRODUCTS ================= */}
        {activeTab === 'products' && (
          <>
            <div className="shop-header">
              <h2>{shop.name}</h2>

              <button
                className="add-product-btn"
                disabled={!shop.is_verified}
                onClick={() => setIsModalOpen(true)}
              >
                + Thêm sản phẩm
              </button>
            </div>

            <div className="product-grid">
              {shop.products?.map((product) => {
                let image = 'https://placehold.co/200x200?text=No+Image'
                const imageObj = product.product_images?.[0]

                if (imageObj) {
                  const imgUrl = imageObj.image_url || imageObj.image_path
                  if (imgUrl) {
                    image = imgUrl.startsWith('http')
                      ? imgUrl
                      : `http://localhost:8000/storage/${imgUrl}`
                  }
                }

                const price =
                  product.skus?.[0]?.price ?? product.base_price ?? 0
                const stock = product.skus?.[0]?.stock ?? 0

                return (
                  <div key={product.id} className="product-card">
                    <img src={image} alt={product.name} />
                    <h4>{product.name}</h4>
                    <p className="price">{price.toLocaleString()} VNĐ</p>
                    <p className="stock">Tồn kho: {stock}</p>
                  </div>
                )
              })}
            </div>
          </>
        )}
        {/* ================= TAB ĐƠN HÀNG ================= */}
        {activeTab === 'orders' && <SellerOrderManagementPage />}
        {/* ================= TAB COUPONS ================= */}
        {activeTab === 'coupons' && <SellerCouponManagementPage />}

        {/* ================= MODAL THÊM SẢN PHẨM ================= */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '600px',
                maxWidth: '90%',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <h2
                style={{ marginTop: 0, marginBottom: '20px', color: '#1e293b' }}
              >
                Thêm sản phẩm mới
              </h2>

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Danh mục *
                  </label>
                  <select
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Giá cơ bản chung (VNĐ) *
                  </label>
                  <input
                    type="number"
                    name="base_price"
                    required
                    min="0"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                </div>

                {/* --- KHU VỰC BẬT TẮT SKU PHÂN LOẠI --- */}
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#3b82f6',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => setHasVariations(e.target.checked)}
                      style={{
                        marginRight: '10px',
                        width: '18px',
                        height: '18px',
                      }}
                    />
                    Sản phẩm có nhiều phân loại (Màu sắc, Kích thước...)
                  </label>

                  {/* NẾU KHÔNG CÓ PHÂN LOẠI -> Hiện ô nhập Tồn kho chung */}
                  {!hasVariations && (
                    <div style={{ marginTop: '15px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        Tồn kho chung *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        required={!hasVariations}
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                        }}
                      />
                    </div>
                  )}

                  {/* NẾU CÓ PHÂN LOẠI -> Hiện danh sách SKU */}
                  {hasVariations && (
                    <div style={{ marginTop: '15px' }}>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#64748b',
                          marginBottom: '10px',
                        }}
                      >
                        Thêm các phân loại (VD: Áo Đỏ Size M, Áo Xanh Size L...)
                      </p>

                      {skus.map((sku, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            gap: '10px',
                            marginBottom: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            placeholder="Tên phân loại (VD: Đen)"
                            value={sku.sku_code}
                            onChange={(e) =>
                              handleSkuChange(index, 'sku_code', e.target.value)
                            }
                            required
                            style={{
                              flex: 2,
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Giá tiền"
                            value={sku.price}
                            onChange={(e) =>
                              handleSkuChange(index, 'price', e.target.value)
                            }
                            required
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          <input
                            type="number"
                            placeholder="Tồn kho"
                            value={sku.stock}
                            onChange={(e) =>
                              handleSkuChange(index, 'stock', e.target.value)
                            }
                            required
                            style={{
                              flex: 1,
                              padding: '8px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          />
                          {skus.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSkuRow(index)}
                              style={{
                                padding: '8px 12px',
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              X
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSkuRow}
                        style={{
                          padding: '8px 15px',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '13px',
                        }}
                      >
                        + Thêm phân loại
                      </button>
                    </div>
                  )}
                </div>
                {/* --- KẾT THÚC KHU VỰC SKU --- */}

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  ></textarea>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Hình ảnh sản phẩm (Link URL)
                  </label>
                  <input
                    type="text"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                    }}
                  />
                </div>

                <div
                  style={{ display: 'flex', gap: '10px', marginTop: '10px' }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 2,
                      padding: '12px',
                      background: '#ee4d2d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Đăng sản phẩm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

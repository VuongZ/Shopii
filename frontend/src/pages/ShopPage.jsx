import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
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
  
  // STATE MỚI: Lưu ID của sản phẩm đang được chỉnh sửa (null = Thêm mới)
  const [editingProductId, setEditingProductId] = useState(null)

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

  // HÀM MỚI: Reset form và Đóng Modal
  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProductId(null)
    setFormData({
      name: '', category_id: '', base_price: '', stock: '', description: '', image_url: '',
    })
    setHasVariations(false)
    setSkus([{ sku_code: '', price: '', stock: '' }])
  }

  // HÀM MỚI: Mở Modal Chỉnh Sửa và Điền dữ liệu cũ vào
  const openEditModal = (product) => {
    setEditingProductId(product.id)
    
    // Tìm ảnh đầu tiên
    let imageUrl = '';
    if (product.product_images && product.product_images.length > 0) {
      imageUrl = product.product_images[0].image_url || product.product_images[0].image_path || '';
    }

    setFormData({
      name: product.name || '',
      category_id: product.category_id || '',
      base_price: product.base_price || '',
      stock: product.stock || '',
      description: product.description || '',
      image_url: imageUrl,
    })

    // Kiểm tra xem sản phẩm có phân loại (SKU) không
    const hasRealSkus = product.skus && product.skus.length > 0 && product.skus[0].sku !== 'Mặc định' && !product.skus[0].sku.startsWith('SKU-');
    
    if (hasRealSkus) {
      setHasVariations(true)
      // Chuyển đổi dữ liệu SKU từ Backend để render lên Form
      const loadedSkus = product.skus.map(s => ({
        id: s.id, // Lưu lại ID để update
        sku_code: s.sku || '',
        price: s.price || '',
        stock: s.stock || 0
      }))
      setSkus(loadedSkus)
    } else {
      setHasVariations(false)
      setSkus([{ sku_code: '', price: '', stock: '' }])
      // Nếu không có phân loại, gán tồn kho của sản phẩm (hoặc SKU mặc định) vào form
      setFormData(prev => ({ ...prev, stock: product.skus?.[0]?.stock || product.stock || 0 }))
    }

    setIsModalOpen(true)
  }

  // CẬP NHẬT: Xử lý Submit cho cả THÊM MỚI và CẬP NHẬT
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const dataToSend = {
      ...formData,
      skus: hasVariations ? skus : [],
    }

    try {
      if (editingProductId) {
        // GỌI API CẬP NHẬT (PUT)
        const res = await axiosClient.put(`/products/${editingProductId}`, dataToSend)
        alert(res.data.message || 'Cập nhật sản phẩm thành công!')
      } else {
        // GỌI API THÊM MỚI (POST)
        const res = await axiosClient.post('/products', dataToSend)
        alert(res.data.message || 'Thêm sản phẩm thành công!')
      }

      closeModal()
      fetchShop()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // HÀM MỚI: Xử lý Xóa Sản Phẩm
  const handleDeleteProduct = async () => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN sản phẩm "${formData.name}" không? Hành động này không thể hoàn tác!`)) return;

    setIsSubmitting(true);
    try {
      await axiosClient.delete(`/products/${editingProductId}`);
      alert("Xóa sản phẩm thành công!");
      closeModal();
      fetchShop();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.response?.data?.message || 'Không thể xóa sản phẩm'));
    } finally {
      setIsSubmitting(false);
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
                onClick={() => {
                  closeModal(); // Đảm bảo form trống trơn
                  setIsModalOpen(true);
                }}
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
                  <div 
                    key={product.id} 
                    className="product-card"
                    onClick={() => openEditModal(product)} // BẤM VÀO ĐỂ SỬA
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    title="Bấm vào để chỉnh sửa"
                  >
                    <img src={image} alt={product.name} />
                    <h4>{product.name}</h4>
                    <p className="price">{price.toLocaleString()} VNĐ</p>
                    <p className="stock">Tồn kho: {stock}</p>
                    {/* Thêm một icon bút chì nhỏ cho thân thiện UX */}
                    
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

        {/* ================= MODAL THÊM / SỬA SẢN PHẨM ================= */}
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
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>
                  {editingProductId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>
                
                {/* Nút XÓA chỉ hiện khi đang ở chế độ Chỉnh sửa */}
                {editingProductId && (
                  <button 
                    type="button"
                    onClick={handleDeleteProduct}
                    disabled={isSubmitting}
                    style={{
                      background: 'white', color: '#5a5df0', border: '1.5px solid #5a5df0', 
                      padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f5f3ff';
                      e.target.style.boxShadow = '0 2px 8px rgba(90, 93, 240, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🗑️ Xóa sản phẩm
                  </button>
                )}
              </div>

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
                      boxSizing: 'border-box'
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
                      boxSizing: 'border-box'
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
                      boxSizing: 'border-box'
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
                          boxSizing: 'border-box'
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
                      boxSizing: 'border-box'
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
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={closeModal}
                    style={{
                      flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                    onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      flex: 2, padding: '12px', background: '#5a5df0', color: 'white',
                      border: 'none', borderRadius: '8px', fontWeight: 'bold', 
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(90, 93, 240, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.target.style.background = '#4346de';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(90, 93, 240, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.target.style.background = '#5a5df0';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(90, 93, 240, 0.3)';
                      }
                    }}
                  >
                    {isSubmitting ? 'Đang lưu...' : (editingProductId ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm')}
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
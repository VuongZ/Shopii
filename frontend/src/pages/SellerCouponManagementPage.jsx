import React, { useEffect, useMemo, useState } from 'react'
import axiosClient from '../api/axiosClient'
import couponApi from '../api/couponApi'

const SellerCouponManagementPage = () => {
  const [shop, setShop] = useState(null)
  const [coupons, setCoupons] = useState([])

  const [globalError, setGlobalError] = useState('')

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState('fixed')
  const [discountValue, setDiscountValue] = useState('')
  const [minOrderValue, setMinOrderValue] = useState('')

  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const canCreate = useMemo(() => {
    return shop && code && discountValue && minOrderValue
  }, [shop, code, discountValue, minOrderValue])

  const loadData = async () => {
    setGlobalError('')
    try {
      const shopRes = await axiosClient.get('/my-shop')
      setShop(shopRes.data)

      const couponsRes = await couponApi.getCoupons(shopRes.data.id)
      setCoupons(couponsRes.data || [])
    } catch (err) {
      setGlobalError('Không tải được dữ liệu');
      console.log(err);
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      await axiosClient.post('/coupons', {
        shop_id: shop.id,
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order_value: Number(minOrderValue),
      })

      setCode('')
      setDiscountValue('')
      setMinOrderValue('')
      await loadData()
    } catch {
      setGlobalError('Không thể tạo coupon')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa coupon này?')) return

    setDeletingId(id)
    try {
      await axiosClient.delete(`/coupons/${id}`)
      await loadData()
    } catch {
      setGlobalError('Không thể xóa')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20 }}>🎟 Quản lý mã giảm giá</h2>

      {globalError && (
        <div style={{ color: 'red', marginBottom: 10 }}>{globalError}</div>
      )}

      {/* CREATE */}
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 12,
          boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
          marginBottom: 30,
        }}
      >
        <h3>Tạo coupon</h3>

        <form
          onSubmit={handleCreate}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2,1fr)',
            gap: 15,
          }}
        >
          <input
            placeholder="Mã coupon (SALE10)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={inputStyle}
          />

          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            style={inputStyle}
          >
            <option value="fixed">Giảm tiền</option>
            <option value="percent">Giảm %</option>
          </select>

          <input
            type="number"
            placeholder="Giá trị giảm"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            style={inputStyle}
          />

          <input
            type="number"
            placeholder="Đơn tối thiểu"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={!canCreate}
            style={{
              gridColumn: 'span 2',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: '#ee4d2d',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {creating ? 'Đang tạo...' : 'Tạo coupon'}
          </button>
        </form>
      </div>

      {/* LIST */}
      <div>
        <h3>Danh sách coupon</h3>

        {coupons.length === 0 && <p>Chưa có coupon</p>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: 20,
          }}
        >
          {coupons.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                position: 'relative',
              }}
            >
              <h3 style={{ color: '#ee4d2d' }}>{c.code}</h3>

              <p>
                Giảm:{' '}
                <b>
                  {c.discount_type === 'percent'
                    ? `${c.discount_value}%`
                    : `${c.discount_value}đ`}
                </b>
              </p>

              <p>Đơn tối thiểu: {c.min_order_value}đ</p>

              <button
                onClick={() => handleDelete(c.id)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {deletingId === c.id ? '...' : 'Xóa'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  outline: 'none',
}

export default SellerCouponManagementPage

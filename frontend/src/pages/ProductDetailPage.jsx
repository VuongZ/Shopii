import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient"; 
import orderApi from "../api/orderApi";
import ReviewForm from "../components/Review/ReviewForm";

function ProductDetailPage() {
    const { id } = useParams();
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [canReview, setCanReview] = useState(false);
useEffect(() => {
  fetchOrderId();
}, [id]);

const fetchOrderId = async () => {
  try {
    const res = await orderApi.getMyOrders();
    const orders = res.data;

    console.log("ORDERS:", orders); // debug

    for (const order of orders) {
      const hasProduct = order.items?.some((item) => {
        const productId = item?.sku?.product?.id;
        return String(productId) === String(id);
      });

      if (!hasProduct) continue;

      // Only allow review when the order is completed
      if (order.status === "completed") {
        setReviewOrderId(order.id);
        setCanReview(true);
        return;
      }

      // Remember any matching order, but disable review
      if (!reviewOrderId) {
        setReviewOrderId(order.id);
        setCanReview(false);
      }
    }

    // No order contains this product
    if (!reviewOrderId) {
      setReviewOrderId(null);
      setCanReview(false);
    }
  } catch (err) {
    console.error(err);
  }
};

  const navigate = useNavigate();
 
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  
  // STATE MỚI: Lưu lại SKU (Màu sắc/Kích thước) đang được chọn
  const [selectedSku, setSelectedSku] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axiosClient.get(`/products/${id}`);
      const data = res.data;

      setProduct(data);

      const thumbnail = data.product_images?.find(img => img.is_thumbnail == 1) || data.product_images?.[0];
      let imgUrl = "https://placehold.co/400x400?text=No+Image";
      if (thumbnail) {
          const rawUrl = thumbnail.image_url || thumbnail.image_path;
          if (rawUrl) {
              imgUrl = rawUrl.startsWith("http") ? rawUrl : `http://localhost:8000/storage/${rawUrl}`;
          }
      }
      setMainImage(imgUrl);

    } catch (err) {
      console.error(err);
    }
  }

  if (!product) return <p style={{ padding: '50px', textAlign: 'center' }}>Đang tải dữ liệu...</p>;

  // === LOGIC TÍNH TOÁN GIÁ & TỒN KHO THÔNG MINH ===
  let displayPrice = "";
  let displayStock = 0;

  if (selectedSku) {
    // Nếu ĐÃ CHỌN 1 phân loại (Màu/Size) -> Hiện giá và tồn kho của riêng cái đó
    displayPrice = `${Number(selectedSku.price).toLocaleString()} VNĐ`;
    displayStock = selectedSku.stock;
  } else {
    // Nếu CHƯA CHỌN -> Hiện khoảng giá và TỔNG tồn kho
    if (product.skus && product.skus.length > 0) {
      const prices = product.skus.map(s => Number(s.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      displayPrice = minPrice !== maxPrice 
        ? `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} VNĐ`
        : `${minPrice.toLocaleString()} VNĐ`;

      displayStock = product.skus.reduce((sum, sku) => sum + Number(sku.stock), 0);
    } else {
      displayPrice = `${Number(product.base_price || 0).toLocaleString()} VNĐ`;
    }
    
  }

  return (
    
    <div className="main-content" style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
    <button
        className="btn-back"
        onClick={() => navigate(-1)}
        style={{ 
          marginBottom: '20px', 
          padding: '10px 20px', 
          border: '1px solid #e2e8f0', 
          background: 'white', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          fontWeight: 'bold',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease', // Hiệu ứng mượt mà
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
        // Thêm hiệu ứng khi rê chuột vào
        onMouseEnter={(e) => {
          e.target.style.background = '#f8fafc';
          e.target.style.transform = 'translateX(-5px)'; // Nhích nhẹ sang trái kiểu "quay về"
          e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
        }}
        // Trả lại trạng thái cũ khi bỏ chuột ra
        onMouseLeave={(e) => {
          e.target.style.background = 'white';
          e.target.style.transform = 'translateX(0)';
          e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        }}
      >
        ← Quay lại
      </button>

      <div className="product-detail-card" style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div className="product-detail-grid" style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
          
          {/* IMAGE */}
          <div style={{ flex: '1 1 400px' }}>
            <img
              src={mainImage}
              alt={product.name}
              className="product-image-main"
              style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            />
            <div className="product-gallery" style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto' }}>
              {product.product_images?.map(img => {
                  let thumbUrl = img.image_url || img.image_path;
                  thumbUrl = thumbUrl.startsWith("http") ? thumbUrl : `http://localhost:8000/storage/${thumbUrl}`;
                  return (
                    <img
                      key={img.id}
                      src={thumbUrl}
                      className="product-thumb"
                      onClick={() => setMainImage(thumbUrl)}
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: mainImage === thumbUrl ? '2px solid #ee4d2d' : '1px solid #e2e8f0' }}
                      alt="thumbnail"
                    />
                  );
              })}
            </div>
          </div>

          {/* INFO */}
          <div style={{ flex: '1.5 1 500px' }}>
            <h1 className="product-title" style={{ fontSize: '28px', color: '#0f172a', marginTop: 0 }}>
              {product.name}
            </h1>
            
            {/* KHU VỰC HIỂN THỊ GIÁ (Sẽ tự động nhảy số) */}
            <div className="product-price" style={{ margin: '20px 0', background: '#fef2f2', padding: '15px 20px', borderRadius: '8px' }}>
              <div style={{ fontSize: '30px', color: '#ee4d2d', fontWeight: 'bold' }}>
                {displayPrice}
              </div>
            </div>
            
            {/* KHU VỰC PHÂN LOẠI (SKU) */}
            {product.skus && product.skus.length > 0 && product.skus[0].sku !== 'Mặc định' && !product.skus[0].sku.startsWith('SKU-') && (
              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ color: '#475569', fontSize: '15px', marginBottom: '10px' }}>Phân loại:</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {product.skus.map(sku => {
                    // Kiểm tra xem nút này có đang được bấm hay không
                    const isSelected = selectedSku?.id === sku.id;
                    
                    return (
                      <button 
                        key={sku.id} 
                        onClick={() => setSelectedSku(sku)} // Bấm vào thì lưu state
                        style={{ 
                          border: isSelected ? '2px solid #ee4d2d' : '1px solid #cbd5e1', 
                          padding: '8px 20px', 
                          borderRadius: '6px', 
                          background: isSelected ? '#fffafa' : 'white',
                          color: isSelected ? '#ee4d2d' : '#1e293b',
                          cursor: 'pointer',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.2s'
                        }}
                      >
                        {sku.sku}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px', fontSize: '15px', color: '#64748b' }}>
              Số lượng còn lại: <b style={{ color: '#1e293b' }}>{displayStock}</b> sản phẩm
            </div>

            <div style={{ marginBottom: '10px', fontSize: '15px' }}><b>Danh mục:</b> {product.category?.name || 'Đang cập nhật'}</div>
            <div style={{ marginBottom: '20px', fontSize: '15px' }}><b>Shop:</b> {product.shop?.name || 'Đang cập nhật'}</div>
            
            <div className="product-description" style={{ lineHeight: '1.6', color: '#475569', marginBottom: '30px' }}>
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </div>

            <button 
              disabled={displayStock === 0} // Hết hàng thì mờ nút đi
              className="btn-add-cart" 
              style={{ 
                padding: '15px 40px', 
                background: displayStock > 0 ? '#ee4d2d' : '#cbd5e1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                fontWeight: 'bold', 
                cursor: displayStock > 0 ? 'pointer' : 'not-allowed' 
              }}
            >
              {displayStock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
         <ReviewForm
    productId={id}
    orderId={reviewOrderId}
    canReview={canReview}
/>
         
          </div>
        </div>

      </div>
         
    </div>
  );
}

export default ProductDetailPage;
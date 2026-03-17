import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import "./ShopPage.css";

export default function ShopPage() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await axiosClient.get("/my-shop");

        console.log("SHOP DATA:", res.data);

        setShop(res.data);
      } catch (err) {
        console.error("ERROR:", err.response?.data || err);

        if (err.response?.status === 401) {
          alert("Bạn cần đăng nhập để xem shop.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, []);

  if (loading) return <div className="loading">Đang tải shop...</div>;

  if (!shop) return <div className="loading">Không tìm thấy shop</div>;

  return (
    <div className="seller-layout">
      {/* Sidebar */}
      <div className="seller-sidebar">
        <h2>Seller Panel</h2>

        <ul>
          <li className="active">Shop của tôi</li>
          <li>Sản phẩm</li>
          <li>Đơn hàng</li>
          <li>Doanh thu</li>
        </ul>
      </div>

      {/* Content */}
      <div className="seller-content">
        {/* Header */}
        <div className="shop-header">
          <div>
            <h2>{shop.name}</h2>

            <p className={shop.is_verified ? "verified" : "pending"}>
              {shop.is_verified ? "Đã được duyệt" : "Chờ duyệt"}
            </p>
          </div>

          <button className="add-product-btn" disabled={!shop.is_verified}>
            Thêm sản phẩm
          </button>
        </div>

        {/* Product grid */}
        {shop.is_verified ? (
          <div className="product-grid">
            {shop.products?.map((product) => {
              const image = product.product_images?.[0]
                ? `https://shopii-backend-latest.onrender.com/storage/${product.product_images[0].image_path}`
                : "https://via.placeholder.com/200";

              const price = product.skus?.[0]?.price ?? 0;
              const stock = product.skus?.[0]?.stock ?? 0;

              return (
                <div key={product.id} className="product-card">
                  <img src={image} alt={product.name} />

                  <h4>{product.name}</h4>

                  <p className="price">{price.toLocaleString()} VNĐ</p>

                  <p className="stock">Tồn kho: {stock}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pending-message">
            Shop của bạn đang chờ duyệt.
            <br />
            Sản phẩm sẽ hiển thị sau khi được phê duyệt.
          </div>
        )}
      </div>
    </div>
  );
}

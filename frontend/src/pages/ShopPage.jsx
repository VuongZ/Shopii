import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import "./ShopPage.css";

export default function ShopPage() {
    const [shop, setShop] = useState(null);

    useEffect(() => {
  axiosClient.get("/my-shop")
    .then(res => {
      console.log("SHOP DATA:", res.data);
      setShop(res.data);
    })
    .catch(err => {
      console.log("ERROR:", err.response?.data || err);
    });
}, []);

    if (!shop) return <div className="loading">Đang tải shop...</div>;

    return (
        <div className="seller-layout">

            {/* Sidebar */}
            <div className="seller-sidebar">
                <h2>Seller Panel</h2>
                <ul>
                    <li className="active"> Shop của tôi</li>
                    <li> Sản phẩm</li>
                    <li> Đơn hàng</li>
                    <li> Doanh thu</li>
                </ul>
            </div>

            {/* Content */}
            <div className="seller-content">

                {/* Shop Header */}
                <div className="shop-header">
                    <div>
                        <h2>{shop.name}</h2>
                        <p className={shop.is_verified ? "verified" : "pending"}>
                            {shop.is_verified ? "Đã được duyệt" : "Chờ duyệt"}
                        </p>
                    </div>

                    <button
                        className="add-product-btn"
                        disabled={!shop.is_verified}
                    >
                        Thêm sản phẩm
                    </button>
                </div>

                {/* Product Grid */}
                {/* Product Section */}
                {shop.is_verified ? (
                    <div className="product-grid">
                        {shop.products?.map(product => (
                            <div key={product.id} className="product-card">
                                <img
                                    src={
                                        product.product_images?.[0]
                                            ? `http://127.0.0.1:8000/storage/${product.product_images[0].image_path}`
                                            : "https://via.placeholder.com/200"
                                    }
                                    alt={product.name}
                                />
                                <h4>{product.name}</h4>
                                <p className="price">
                                    {product.skus?.[0]?.price?.toLocaleString()} VNĐ
                                </p>
                                <p className="stock">
                                    Tồn kho: {product.skus?.[0]?.stock ?? 0}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="pending-message">
                        Shop của bạn đang chờ duyệt.
                        <br />
                        Sản phẩm của bạn sẽ hiển thị sau khi được phê duyệt.
                    </div>
                )}

            </div>
        </div>
    );
}
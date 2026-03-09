import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function HomePage({ searchKeyword }) {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient
      .get("/products")
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // Filter search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()),
  );

  return (
    <div style={{ padding: "40px", background: "#f5f5f5", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "25px" }}>Danh sách sản phẩm</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: "20px",
        }}
      >
        {filteredProducts.map((product) => {
          const image = product.product_images?.[0]
            ? `https://shopii-backend-latest.onrender.com/storage/${product.product_images[0].image_path}`
            : "https://via.placeholder.com/200";

          const price = product.skus?.[0]?.price ?? 0;

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/product/${product.id}`)}
              style={{
                background: "white",
                borderRadius: "10px",
                padding: "12px",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.05)";
              }}
            >
              {/* IMAGE */}
              <img
                src={image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              />

              {/* NAME */}
              <h4
                style={{
                  fontSize: "15px",
                  marginBottom: "6px",
                  minHeight: "40px",
                }}
              >
                {product.name}
              </h4>

              {/* PRICE */}
              <p
                style={{
                  color: "#ee4d2d",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {price.toLocaleString()} VNĐ
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // States cho bộ lọc
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriceRange, setSelectedPriceRange] = useState("");
  const [searchInput, setSearchInput] = useState(""); 
  const [activeSearch, setActiveSearch] = useState(""); 
  
  const navigate = useNavigate();

  useEffect(() => {
    // API gọi về local chuẩn xịn
    axiosClient.get("/products").then((res) => setProducts(res.data)).catch(console.log);
    axiosClient.get("/categories").then((res) => setCategories(res.data)).catch(console.log);
  }, []);

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  // LOGIC LỌC TỔNG HỢP: TÌM KIẾM + DANH MỤC + GIÁ TIỀN
  const filteredProducts = products.filter((p) => {
    // 1. Lấy giá thực tế của sản phẩm (SKU hoặc Base Price)
    const currentPrice = p.skus?.[0]?.price ?? p.base_price ?? 0;

    // 2. Kiểm tra từ khóa tìm kiếm
    const matchSearch = p.name.toLowerCase().includes(activeSearch.toLowerCase());
    
    // 3. Kiểm tra danh mục
    const matchCategory = selectedCategory ? p.category_id === parseInt(selectedCategory) : true;

    // 4. Kiểm tra khoảng giá
    let matchPrice = true;
    if (selectedPriceRange === "under-2m") matchPrice = currentPrice < 2000000;
    else if (selectedPriceRange === "2m-10m") matchPrice = currentPrice >= 2000000 && currentPrice <= 10000000;
    else if (selectedPriceRange === "10m-20m") matchPrice = currentPrice > 10000000 && currentPrice <= 20000000;
    else if (selectedPriceRange === "above-20m") matchPrice = currentPrice > 20000000;

    return matchSearch && matchCategory && matchPrice;
  });

  return (
    <div style={{ padding: "40px", background: "#f5f5f5", minHeight: "100vh" }}>
      
      {/* KHU VỰC 1: THANH TÌM KIẾM HIỆU ỨNG HIỆN ĐẠI */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '35px' }}>
        <div style={{ 
          display: 'flex', 
          width: '100%', 
          maxWidth: '500px', 
          height: '46px',
          background: 'white',
          borderRadius: '8px',
          padding: '2px',
          transition: 'all 0.3s ease',
          border: '2px solid #e2e8f0', 
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm bạn mong muốn..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '0 15px',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              background: 'transparent',
              height: '100%'
            }}
          />
        </div>

        <button
          onClick={handleSearch}
          style={{
            height: '46px',
            padding: '0 28px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.2)';
          }}
        >
          Tìm kiếm
        </button>
      </div>

      {/* KHU VỰC 2: BỘ LỌC CŨNG ĐƯỢC LÀM ĐẸP LẠI */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "25px", flexWrap: "wrap", gap: "15px"
      }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
          Danh sách sản phẩm
        </h2>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Lọc danh mục */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ 
              padding: "10px 15px", borderRadius: "10px", border: "1px solid #cbd5e1", 
              background: "white", fontSize: "14px", color: "#475569", cursor: "pointer",
              outline: "none", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Lọc giá */}
          <select
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            style={{ 
              padding: "10px 15px", borderRadius: "10px", border: "1px solid #cbd5e1", 
              background: "white", fontSize: "14px", color: "#475569", cursor: "pointer",
              outline: "none", transition: "all 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
          >
             <option value="">Tất cả mức giá</option>
             <option value="under-2m">Dưới 2 triệu</option>
             <option value="2m-10m">2 - 10 triệu</option>
             <option value="10m-20m">10 - 20 triệu</option>
             <option value="above-20m">Trên 20 triệu</option>
          </select>
        </div>
      </div>

      {/* KHU VỰC 3: LƯỚI SẢN PHẨM */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "20px" }}>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            
            // 1. FIX LỖI ẢNH THÔNG MINH
            let image = "https://placehold.co/200x200?text=No+Image"; 
            const imageObj = product.product_images?.[0];
            if (imageObj) {
              const imgUrl = imageObj.image_url || imageObj.image_path; 
              if (imgUrl) {
                image = imgUrl.startsWith("http") ? imgUrl : `http://localhost:8000/storage/${imgUrl}`;
              }
            }

            // 2. FIX TÍNH TOÁN GIÁ THÔNG MINH
            let priceDisplay = `${Number(product.base_price || 0).toLocaleString()} VNĐ`;

            if (product.skus && product.skus.length > 0) {
              const prices = product.skus.map(sku => Number(sku.price));
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              
              if (minPrice !== maxPrice) {
                priceDisplay = `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} VNĐ`;
              } else {
                priceDisplay = `${minPrice.toLocaleString()} VNĐ`;
              }
            }

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                style={{
                  background: "white", borderRadius: "10px", padding: "12px", cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)", transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <img src={image} alt={product.name} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "8px", marginBottom: "10px", border: '1px solid #f1f5f9' }} />
                <h4 style={{ fontSize: "15px", marginBottom: "6px", minHeight: "40px", color: '#1e293b' }}>{product.name}</h4>
                <p style={{ color: "#ee4d2d", fontWeight: "bold", fontSize: "16px" }}>{priceDisplay}</p>
              </div>
            );
          })
        ) : (
          <p style={{ textAlign: "center", gridColumn: "1 / -1", color: "#888", padding: "40px" }}>Không tìm thấy sản phẩm nào phù hợp.</p>
        )}
      </div>
    </div>
  );
}
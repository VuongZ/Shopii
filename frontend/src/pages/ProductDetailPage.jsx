import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function ProductDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [product,setProduct] = useState(null);
  const [mainImage,setMainImage] = useState("");

  useEffect(()=>{
    fetchProduct();
  },[id]);

  const fetchProduct = async () =>{
    try{

      const res = await fetch(
        `https://shopii-backend-latest.onrender.com/api/products/${id}`
      );

      const data = await res.json();

      setProduct(data);

      const thumbnail =
        data.product_images?.find(img => img.is_thumbnail == 1) ||
        data.product_images?.[0];

      setMainImage(thumbnail?.image_url);

    }catch(err){
      console.error(err);
    }
  }

  if(!product) return <p>Loading...</p>

  return (

    <div className="main-content">

      <button
        className="btn-back"
        onClick={()=>navigate(-1)}
      >
        ← Quay lại
      </button>

      <div className="product-detail-card">

        <div className="product-detail-grid">

          {/* IMAGE */}

          <div>

            <img
              src={mainImage}
              alt={product.name}
              className="product-image-main"
            />

            <div className="product-gallery">

              {product.product_images?.map(img=>(
                <img
                  key={img.id}
                  src={img.image_url}
                  className="product-thumb"
                  onClick={()=>setMainImage(img.image_url)}
                />
              ))}

            </div>

          </div>


          {/* INFO */}

          <div>

            <div className="product-title">
              {product.name}
            </div>

            <div className="product-price">
              {Number(product.base_price).toLocaleString()} VNĐ
            </div>

            <div className="product-meta">
              <b>Danh mục:</b> {product.category?.name}
            </div>

            <div className="product-meta">
              <b>Shop:</b> {product.shop?.name}
            </div>

            <div className="product-description">
              {product.description}
            </div>

            <button className="btn-add-cart">
              Thêm vào giỏ hàng
            </button>

          </div>

        </div>


        {/* SKU */}

        <div style={{marginTop:"30px"}}>

          <h3>Biến thể sản phẩm</h3>

          {product.skus?.map(sku=>(
            <div
              key={sku.id}
              className="sku-box"
            >
              Giá: {Number(sku.price).toLocaleString()} VNĐ
            </div>
          ))}

        </div>

      </div>

    </div>

  );
}

export default ProductDetailPage;
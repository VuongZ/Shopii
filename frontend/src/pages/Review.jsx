import { useEffect, useState } from "react";
import axios from "axios";

export default function ReviewSection({ productId, orderId, token }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load review
  useEffect(() => {
    fetchReviews();
  }, [productId]);

 const fetchReviews = async () => {
  try {
    const res = await axios.get("/api/reviews", {
      params: { product_id: productId }
    });

    console.log("API RESPONSE:", res.data);

    // xử lý mọi trường hợp backend trả về
    if (Array.isArray(res.data)) {
      setReviews(res.data);
    } else if (Array.isArray(res.data.data)) {
      setReviews(res.data.data);
    } else {
      setReviews([]);
    }

  } catch (error) {
    console.error(error);
    setReviews([]);
  }
};
  const submitReview = async () => {
    if (!rating || !comment) {
      alert("Vui lòng chọn sao và nhập nhận xét");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "/api/reviews",
        {
          product_id: productId,
          order_id: orderId,
          rating,
          comment
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRating(0);
      setComment("");
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.message || "Không thể gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-box">
      <h3>Đánh giá sản phẩm</h3>

      {/* Rating */}
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "star active" : "star"}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      {/* Comment */}
      <textarea
        placeholder="Nhập nhận xét của bạn..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={submitReview} disabled={loading}>
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>

      {/* Review List */}
      <div className="review-list">
        <h4>Nhận xét ({Array.isArray(reviews) ? reviews.length : 0})</h4>
        {reviews.map((r) => (
          <div className="review-item" key={r.id}>
            <div className="review-header">
              <strong>{r.user?.name || "Ẩn danh"}</strong>
              <div className="stars small">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={s <= r.rating ? "star active" : "star"}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p>{r.comment}</p>
            <small>{new Date(r.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

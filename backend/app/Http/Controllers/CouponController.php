<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Coupon;
use Carbon\Carbon;

class CouponController extends Controller
{
    // Lấy danh sách mã giảm giá còn hiệu lực
    public function index(Request $request)
    {
        $now = Carbon::now();
        
        
        $query = Coupon::where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where('usage_limit', '>', 0); 

        if ($request->has('shop_id')) {
            $query->where(function($q) use ($request) {
                $q->where('shop_id', $request->shop_id) // Mã của Shop
                  ->orWhereNull('shop_id');             // Hoặc mã toàn sàn
            });
        } else {
            $query->whereNull('shop_id'); // Mặc định lấy mã sàn
        }

        $coupons = $query->get();
        return response()->json($coupons);
    }
    public function apply(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'order_total' => 'required|numeric',
        ]);

        $code = $request->coupon_code;
        $total = $request->order_total;
        $now = Carbon::now();

        $coupon = Coupon::where('code', $code)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->first();

        if (!$coupon) {
            return response()->json(['message' => 'Mã giảm giá không tồn tại hoặc đã hết hạn'], 400);
        }

        if ($coupon->usage_limit <= 0) {
             return response()->json(['message' => 'Mã giảm giá đã hết lượt sử dụng'], 400);
        }

        if ($total < $coupon->min_order_value) {
            return response()->json([
                'message' => 'Đơn hàng chưa đạt giá trị tối thiểu: ' . number_format($coupon->min_order_value) . 'đ'
            ], 400);
        }

        // Tính toán số tiền được giảm
        $discountAmount = 0;
        if ($coupon->discount_type == 'fixed') {
            $discountAmount = $coupon->discount_value;
        } else {
            // Loại phần trăm
            $discountAmount = ($total * $coupon->discount_value) / 100;
            // Kiểm tra giảm tối đa
            if ($coupon->max_discount_value && $discountAmount > $coupon->max_discount_value) {
                $discountAmount = $coupon->max_discount_value;
            }
        }

        // Đảm bảo không giảm quá số tiền đơn hàng
        if ($discountAmount > $total) {
            $discountAmount = $total;
        }

        return response()->json([
            'message' => 'Áp dụng mã thành công',
            'coupon_id' => $coupon->id,
            'code' => $coupon->code,
            'discount_amount' => $discountAmount,
            'final_total' => $total - $discountAmount
        ]);
    }
}
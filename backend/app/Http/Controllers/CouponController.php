<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Coupon;
use Carbon\Carbon;

class CouponController extends Controller
{
    // 1. Lấy danh sách Coupon (Seller lấy mã của shop, User lấy mã sàn)
    public function index(Request $request)
{
    $query = Coupon::with('tier'); // Eager load tier để check hạng
    $now = now();

    // Lấy mã toàn sàn (shop_id là null)
    $query->where(function($q) use ($request) {
        $q->whereNull('shop_id'); 

        // NẾU CÓ TRUYỀN DANH SÁCH SHOP_IDS TỪ GIỎ HÀNG
        if ($request->has('shop_ids')) {
            $ids = explode(',', $request->shop_ids);
            $q->orWhereIn('shop_id', $ids); // Lấy thêm mã của các shop đó
        }
    });

    return response()->json(
        $query->where('start_date', '<=', $now)
              ->where('end_date', '>=', $now)
              ->where('usage_limit', '>', 0)
              ->orderBy('created_at', 'desc')
              ->get()
    );
}
    // 2. Seller tạo Coupon mới với đầy đủ thông tin
    public function store(Request $request)
    {
    
        $validated = $request->validate([
            'code'               => 'required|string|unique:coupons,code',
            'discount_type'      => 'required|in:fixed,percent', 
            'discount_value'     => 'required|numeric|min:0',
            'min_order_value'    => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit'        => 'required|integer|min:1',
            'start_date'         => 'required|date',
            'end_date'           => 'required|date|after:start_date',
            'shop_id'            => 'required|integer'
        ]);

        try {
            $coupon = Coupon::create($validated);
            return response()->json([
                'message' => 'Tạo coupon thành công!',
                'data' => $coupon
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi DB: ' . $e->getMessage()
            ], 500);
        }
    }

    // 3. Xóa Coupon (Dành cho Seller)
    public function destroy($id)
    {
        $coupon = Coupon::find($id);
        
        if (!$coupon) {
            return response()->json(['message' => 'Không tìm thấy mã này'], 404);
        }

        $coupon->delete();
        return response()->json(['message' => 'Đã xóa mã giảm giá thành công']);
    }

    // 4. Logic áp dụng Coupon 
    public function apply(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'order_total' => 'required|numeric|min:0',
            'shop_id'     => 'nullable|integer',
        ]);

        $now = Carbon::now();
        $coupon = Coupon::where('code', $request->coupon_code)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where('usage_limit', '>', 0)
            ->first();

        if (!$coupon) {
            return response()->json(['message' => 'Mã không tồn tại hoặc hết hạn'], 400);
        }

        // Kiểm tra đơn hàng tối thiểu
        if ($request->order_total < $coupon->min_order_value) {
            return response()->json(['message' => 'Chưa đủ giá trị đơn hàng tối thiểu'], 400);
        }

        // Tính toán số tiền giảm
        $discount = 0;
        if ($coupon->discount_type === 'fixed') {
            $discount = $coupon->discount_value;
        } else {
            $discount = ($request->order_total * $coupon->discount_value) / 100;
            // Áp dụng mức giảm tối đa nếu có (max_discount_value)
            if ($coupon->max_discount_value && $discount > $coupon->max_discount_value) {
                $discount = $coupon->max_discount_value;
            }
        }

        return response()->json([
            'message' => 'Áp dụng thành công',
            'discount_amount' => min($discount, $request->order_total),
            'coupon_id' => $coupon->id
        ]);

    }
    public function adminIndex()
    {
        // Load kèm thông tin hạng để hiển thị ở bảng
        return Coupon::with('tier')->whereNull('shop_id')->orderBy('created_at', 'desc')->get();
    }

    // API Admin tạo mã toàn sàn
    public function adminStore(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:coupons,code',
            'membership_tier_id' => 'nullable|exists:membership_tiers,id',
            'discount_type' => 'required|in:fixed,percent',
            'discount_value' => 'required|numeric|min:0',
            'min_order_value' => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit' => 'required|integer|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        // shop_id sẽ là null vì đây là mã toàn sàn của hệ thống
        $coupon = Coupon::create($validated);

        return response()->json([
            'message' => 'Tạo mã giảm giá hệ thống thành công!',
            'data' => $coupon->load('tier')
        ], 201);
    }

    // API Xóa mã
    public function adminDestroy($id)
    {
        $coupon = Coupon::whereNull('shop_id')->findOrFail($id);
        $coupon->delete();
        return response()->json(['message' => 'Đã xóa mã giảm giá']);
    }
   public function getAvailableVouchers(Request $request) {
    // Lấy danh sách ID shop từ giỏ hàng gửi lên
    $shopIdsParam = $request->query('shop_ids'); 

    $query = Coupon::with('tier');

    $query->where(function($q) use ($shopIdsParam) {
        // 1. Lấy mã Shopee (Mã toàn sàn - shop_id là NULL)
        $q->whereNull('shop_id');
        
        // 2. Lấy mã của các Seller khách đang mua hàng
        if ($shopIdsParam) {
            $ids = explode(',', $shopIdsParam);
            $q->orWhereIn('shop_id', $ids);
        }
    });

    
    return response()->json($query->orderBy('created_at', 'desc')->get());
}

}
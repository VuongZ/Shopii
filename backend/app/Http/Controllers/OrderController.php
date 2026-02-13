<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon; // <--- Nhớ import Model Coupon
use Carbon\Carbon;

class OrderController extends Controller
{
    public function checkout(Request $request) {
        // 1. Validate dữ liệu
        $request->validate([
            'cart_item_ids' => 'required|array',
            'address_id' => 'required|exists:user_addresses,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'coupon_code' => 'nullable|string|exists:coupons,code',
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            // 2. Lấy sản phẩm từ giỏ
            $items = CartItem::with('sku.product')
                        ->whereIn('id', $request->cart_item_ids)
                        ->whereHas('cart', function($q) use ($user) {
                            $q->where('user_id', $user->id);
                        })
                        ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm hợp lệ'], 400);
            }

            // --- LOGIC COUPON (MỚI) ---
            $coupon = null;
            if ($request->has('coupon_code')) {
                $coupon = Coupon::where('code', $request->coupon_code)
                    ->where('start_date', '<=', Carbon::now())
                    ->where('end_date', '>=', Carbon::now())
                    ->where('usage_limit', '>', 0)
                    ->first();
                
                if (!$coupon) {
                    
                }
            }

            // 3. Gom nhóm theo Shop
            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            $createdOrderIds = []; 
            $grandTotal = 0; 
            
            // Biến cờ để đảm bảo mã giảm giá chỉ áp dụng 1 lần (nếu là mã toàn sàn)
            $couponApplied = false; 

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;
                
                // Tính tiền hàng và check tồn kho
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                // --- TÍNH GIẢM GIÁ CHO ĐƠN HÀNG NÀY ---
                $discountAmount = 0;
                if ($coupon && !$couponApplied) {
                    // Logic: 
                    // 1. Nếu Coupon của Shop (shop_id trùng khớp) -> Áp dụng
                    // 2. Nếu Coupon sàn (shop_id null) -> Áp dụng cho đơn đầu tiên hoặc chia đều (ở đây mình làm đơn giản là áp dụng cho đơn đầu tiên thỏa mãn)
                    
                    $isValidShop = ($coupon->shop_id === null) || ($coupon->shop_id == $shopId);
                    $isMinOrderReached = $shopTotal >= $coupon->min_order_value;

                    if ($isValidShop && $isMinOrderReached) {
                        if ($coupon->discount_type == 'fixed') {
                            $discountAmount = $coupon->discount_value;
                        } else {
                            $discountAmount = ($shopTotal * $coupon->discount_value) / 100;
                            if ($coupon->max_discount_value && $discountAmount > $coupon->max_discount_value) {
                                $discountAmount = $coupon->max_discount_value;
                            }
                        }
                        
                        // Đảm bảo không giảm âm tiền
                        if ($discountAmount > $shopTotal) $discountAmount = $shopTotal;
                        
                        $couponApplied = true; // Đánh dấu đã dùng mã
                    }
                }
                // ---------------------------------------

                $shippingFee = 30000; 
                $finalTotal = $shopTotal + $shippingFee - $discountAmount; // Trừ giảm giá
                if ($finalTotal < 0) $finalTotal = 0;

                $grandTotal += $finalTotal;

                // 4. Tạo Order
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $shopTotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $discountAmount, // <--- Lưu số tiền giảm
                    'final_total' => $finalTotal,
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,
                    'shipping_method_id' => $request->shipping_method_id ?? 1, 
                    'status' => 'pending',
                    'payment_status' => 'unpaid' 
                ]);

                $createdOrderIds[] = $order->id;

                // 5. Lưu Order Items và Trừ kho
                foreach ($shopItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_sku_id' => $item->product_sku_id,
                        'quantity' => $item->quantity,
                        'price' => $item->sku->price
                    ]);
                    
                    $item->sku->decrement('stock', $item->quantity);
                    $item->delete(); 
                }
            }
            
            // --- TRỪ LƯỢT DÙNG COUPON ---
            if ($couponApplied && $coupon) {
                $coupon->decrement('usage_limit');
            }
            // -----------------------------

            DB::commit();

            // 6. Trả về cho Frontend
            return response()->json([
                'message' => 'Tạo đơn hàng thành công!',
                'order_ids' => $createdOrderIds, 
                'total_amount' => $grandTotal, 
                'payment_method_id' => $request->payment_method_id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }
    public function index(Request $request)
    {
        $user = Auth::user();

        // Lấy đơn hàng kèm theo Shop và các sản phẩm bên trong
        $orders = Order::with(['shop', 'items.sku.product'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc') // Mới nhất lên đầu
            ->get();

        return response()->json($orders);
    }
    
    // Xem chi tiết một đơn hàng (Dùng khi bấm vào xem chi tiết)
    public function show($id)
    {
        $user = Auth::user();
        $order = Order::with(['shop', 'items.sku.product', 'userAddress'])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($order);
    }
}
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
                    return response()->json([
                     'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
                    ], 400);
                }
            }

            // 3. Gom nhóm theo Shop
            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            // Pre-compute shop totals for coupon validation/discount base.
            $shopTotals = $itemsByShop->map(function ($shopItems) {
                return $shopItems->sum(function ($item) {
                    return $item->sku->price * $item->quantity;
                });
            });

            $createdOrderIds = [];
            $grandTotal = 0;

            // Coupon logic (apply at most once per checkout).
            // - shop-scoped: applied to that shop only if min_order_value is met.
            // - global (shop_id null): discount is computed from cart total, and distributed across shop orders.
            $couponDiscountAmount = 0;
            $couponTargetShopId = null;
            $couponWillBeApplied = false;
            $couponRemainingDiscountAmount = 0;

            if ($coupon) {
                $cartProductTotal = (float) $shopTotals->sum();
                if ($coupon->shop_id === null) {
                    $couponBaseTotal = $cartProductTotal;
                    if ($couponBaseTotal >= (float) $coupon->min_order_value) {
                        if ($coupon->discount_type === 'fixed') {
                            $couponDiscountAmount = min((float) $coupon->discount_value, $couponBaseTotal);
                        } else {
                            $couponDiscountAmount = ($couponBaseTotal * (float) $coupon->discount_value) / 100;
                            if ($coupon->max_discount_value && $couponDiscountAmount > (float) $coupon->max_discount_value) {
                                $couponDiscountAmount = (float) $coupon->max_discount_value;
                            }
                            if ($couponDiscountAmount > $couponBaseTotal) {
                                $couponDiscountAmount = $couponBaseTotal;
                            }
                        }

                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponRemainingDiscountAmount = (float) $couponDiscountAmount;
                    }
                } else {
                    $targetShopId = (int) $coupon->shop_id;
                    $couponBaseTotal = (float) ($shopTotals->get($targetShopId) ?? 0);
                    if ($couponBaseTotal >= (float) $coupon->min_order_value && $shopTotals->has($targetShopId)) {
                        if ($coupon->discount_type === 'fixed') {
                            $couponDiscountAmount = min((float) $coupon->discount_value, $couponBaseTotal);
                        } else {
                            $couponDiscountAmount = ($couponBaseTotal * (float) $coupon->discount_value) / 100;
                            if ($coupon->max_discount_value && $couponDiscountAmount > (float) $coupon->max_discount_value) {
                                $couponDiscountAmount = (float) $coupon->max_discount_value;
                            }
                            if ($couponDiscountAmount > $couponBaseTotal) {
                                $couponDiscountAmount = $couponBaseTotal;
                            }
                        }

                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponTargetShopId = $targetShopId;
                        $couponRemainingDiscountAmount = 0;
                    }
                }
            }

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;
                
                // Tính tiền hàng và check tồn kho
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                $discountAmount = 0;
                if ($couponWillBeApplied) {
                    if ($coupon->shop_id === null) {
                        // Global coupon: distribute discount across shops in iteration order.
                        if ($couponRemainingDiscountAmount > 0) {
                            $discountAmount = min((float) $couponRemainingDiscountAmount, (float) $shopTotal);
                            $couponRemainingDiscountAmount -= $discountAmount;
                        }
                    } elseif ($couponTargetShopId !== null && (int) $shopId === (int) $couponTargetShopId) {
                        // Shop-scoped coupon: apply to the matching shop only.
                        $discountAmount = (float) $couponDiscountAmount;
                    }
                }

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
            if ($couponWillBeApplied && $coupon) {
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
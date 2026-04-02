<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use App\Models\ShippingMethod;
use App\Models\PaymentMethod;
use App\Models\UserMembership;
use App\Models\MembershipTier;

class OrderController extends Controller
{
    // 1. API lấy danh sách Đơn vị vận chuyển
    public function getShippingMethods()
    {
        $methods = ShippingMethod::all();
        return response()->json($methods);
    }

    // 2. API lấy danh sách Phương thức thanh toán
    public function getPaymentMethods()
    {
        $methods = PaymentMethod::where('is_active', 1)->get();
        return response()->json($methods);
    }
    
    public function checkout(Request $request) {
        $request->validate([
            'cart_item_ids' => 'required|array',
            'address_id' => 'required|exists:user_addresses,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'coupon_code' => 'nullable|string|exists:coupons,code',
        ]);

        DB::beginTransaction();
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();
            
            // --- LOGIC HẠNG THÀNH VIÊN: Lấy % giảm giá của User ---
            $tierDiscountPercent = $user->getDiscountRate(); 
            // -----------------------------------------------------

            $items = CartItem::with('sku.product')
                        ->whereIn('id', $request->cart_item_ids)
                        ->whereHas('cart', function($q) use ($user) {
                            $q->where('user_id', $user->id);
                        })
                        ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm hợp lệ'], 400);
            }

            // --- LOGIC COUPON ---
            $coupon = null;
            if ($request->has('coupon_code')) {
                $coupon = Coupon::where('code', $request->coupon_code)
                    ->where('start_date', '<=', Carbon::now())
                    ->where('end_date', '>=', Carbon::now())
                    ->where('usage_limit', '>', 0)
                    ->lockForUpdate()
                    ->first();
                
                if (!$coupon) {
                    return response()->json([
                     'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
                    ], 400);
                }
            }

            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            $shopTotals = $itemsByShop->map(function ($shopItems) {
                return $shopItems->sum(function ($item) {
                    return $item->sku->price * $item->quantity;
                });
            });

            $createdOrderIds = [];
            $grandTotal = 0;

            // Coupon logic variables (Giữ nguyên của bạn)
            $couponDiscountAmount = 0;
            $couponTargetShopId = null;
            $couponWillBeApplied = false;
            $couponRemainingDiscountAmount = 0;

            if ($coupon) {
                // ... (Giữ nguyên logic tính coupon tổng của bạn) ...
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
                        }
                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponTargetShopId = $targetShopId;
                        $couponRemainingDiscountAmount = 0;
                    }
                }
            }

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;
                
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                // Tiền giảm từ Coupon
                $couponDiscountForThisShop = 0;
                if ($couponWillBeApplied) {
                    if ($coupon->shop_id === null) {
                        if ($couponRemainingDiscountAmount > 0) {
                            $couponDiscountForThisShop = min((float) $couponRemainingDiscountAmount, (float) $shopTotal);
                            $couponRemainingDiscountAmount -= $couponDiscountForThisShop;
                        }
                    } elseif ($couponTargetShopId !== null && (int) $shopId === (int) $couponTargetShopId) {
                        $couponDiscountForThisShop = (float) $couponDiscountAmount;
                    }
                }

                // --- LOGIC HẠNG THÀNH VIÊN: Tính tiền giảm giá theo Hạng ---
                $tierDiscountAmount = 0;
                if ($tierDiscountPercent > 0) {
                    $tierDiscountAmount = ($shopTotal * $tierDiscountPercent) / 100;
                }
                
                // Gom chung tổng giảm giá (Coupon + Tier) để lưu vào DB
                $totalDiscount = $couponDiscountForThisShop + $tierDiscountAmount;
                // -----------------------------------------------------------

                $shippingMethod = ShippingMethod::find($request->shipping_method_id);
                $shippingFee = $shippingMethod ? $shippingMethod->base_fee : 30000; 
                
                // Tính final total với tổng giảm giá mới
                $finalTotal = $shopTotal + $shippingFee - $totalDiscount;
                if ($finalTotal < 0) $finalTotal = 0;

                $grandTotal += $finalTotal;

                $isAutoConfirm = Cache::get('shop_auto_confirm_' . $shopId, false);
                $initialStatus = $isAutoConfirm ? 'confirmed' : 'pending';

                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $shopTotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $totalDiscount, // <--- Lưu tổng tiền đã giảm
                    'final_total' => $finalTotal,
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,
                    'shipping_method_id' => $request->shipping_method_id ?? 1, 
                    'status' => $initialStatus,
                    'payment_status' => 'unpaid' 
                ]);

                $createdOrderIds[] = $order->id;

                if ($isAutoConfirm) {
                    \App\Models\OrderHistory::create([
                        'order_id' => $order->id,
                        'status' => 'confirmed',
                        'note' => 'Hệ thống tự động duyệt đơn'
                    ]);
                }

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
            
            if ($couponWillBeApplied && $coupon) {
                $coupon->decrement('usage_limit');
            }

            DB::commit();

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
        $orders = Order::with(['items.sku.product', 'userAddress', 'paymentMethod'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($orders);
    }
    
    public function show($id)
    {
        $user = Auth::user();
        $order = Order::with(['shop', 'items.sku.product', 'userAddress'])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();
        return response()->json($order);
    }

    public function getSellerOrders(Request $request)
    {
        $user = Auth::user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có cửa hàng'], 403);
        }

        $orders = Order::with(['items.sku.product', 'userAddress'])
            ->leftJoin('users', 'orders.user_id', '=', 'users.id')
            ->where('orders.shop_id', $shop->id)
            ->orderBy('orders.created_at', 'desc')
            ->select('orders.*', 'users.name as user_name')
            ->get();

        return response()->json($orders);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,shipping,completed,cancelled'
        ]);

        $user = Auth::user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có cửa hàng'], 403);
        }

        $order = Order::where('id', $id)->where('shop_id', $shop->id)->first();
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $order->status = $request->status;
        $order->save();

        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'status' => $request->status,
            'note' => 'Shop cập nhật trạng thái'
        ]);

        // --- LOGIC HẠNG THÀNH VIÊN: Thăng hạng nếu shop set là Completed ---
        if ($order->status === 'completed') {
            $this->updateUserMembership($order->user_id, $order->final_total);
        }
        // ------------------------------------------------------------------

        return response()->json(['message' => 'Cập nhật trạng thái đơn hàng thành công', 'order' => $order]);
    }

    public function getAutoConfirmSetting()
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['auto_confirm' => false]);

        $isAuto = Cache::get('shop_auto_confirm_' . $shop->id, false);
        return response()->json(['auto_confirm' => $isAuto]);
    }

    public function toggleAutoConfirm(Request $request)
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['message' => 'Lỗi'], 403);

        $isAuto = $request->auto_confirm; 
        Cache::forever('shop_auto_confirm_' . $shop->id, $isAuto);

        return response()->json([
            'message' => 'Cập nhật cấu hình thành công!',
            'auto_confirm' => $isAuto
        ]);
    }

    public function confirmReceipt($id)
    {
        $user = Auth::user();
        $order = Order::where('id', $id)
                      ->where('user_id', $user->id)
                      ->where('status', 'shipping')
                      ->first();
                      
        if (!$order) {
            return response()->json(['message' => 'Không thể cập nhật đơn hàng này'], 400);
        }

        $order->status = 'completed';
        $order->payment_status = 'paid';
        $order->save();

        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'status' => 'completed',
            'note' => 'Khách hàng đã xác nhận nhận hàng'
        ]);

        // --- LOGIC HẠNG THÀNH VIÊN: Thăng hạng khi khách xác nhận nhận hàng ---
        $this->updateUserMembership($order->user_id, $order->final_total);
        // ----------------------------------------------------------------------

        return response()->json(['message' => 'Cảm ơn bạn đã mua sắm!']);
    }

    /**
     * =====================================================================
     * HÀM PRIVATE XỬ LÝ LOGIC CỘNG TIỀN VÀ XÉT THĂNG HẠNG
     * =====================================================================
     */
    private function updateUserMembership($userId, $orderTotal)
    {
        $membership = UserMembership::firstOrCreate(
            ['user_id' => $userId],
            ['total_spent' => 0, 'tier_id' => null]
        );

        $membership->total_spent += $orderTotal;

        $newTier = MembershipTier::where('is_active', true)
            ->where('min_spent', '<=', $membership->total_spent)
            ->orderBy('min_spent', 'desc')
            ->first();

        if ($newTier) {
            $membership->tier_id = $newTier->id;
        }

        $membership->save();
    }
}
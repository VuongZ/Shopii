<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserAddressController;
use App\Http\Controllers\CouponController;  
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\AdminShopController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReviewController;

use App\Http\Controllers\OrderProcessingController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\ChatController;

use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\MembershipTierController;

/*
|--------------------------------------------------------------------------
| 1. KHU VỰC CÔNG KHAI
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']); 
Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
Route::post('/payment/momo', [PaymentController::class, 'createMoMoPayment']);
Route::get('/payment/momo-callback', [PaymentController::class, 'momoCallback']);
Route::get('/health', function () {
    return response()->json(['status' => 'OK']);
});

Route::get('/provinces', function () { return Http::get("https://provinces.open-api.vn/api/p")->json(); });   
Route::get('/provinces/{code}', function ($code) { return Http::get("https://provinces.open-api.vn/api/p/$code?depth=2")->json(); });
Route::get('/districts/{code}', function ($code) { return Http::get("https://provinces.open-api.vn/api/d/$code?depth=2")->json(); });

Route::get('/reviews', [ReviewController::class, 'index']);

/*
|--------------------------------------------------------------------------
| 2. PROTECTED ROUTES (Cần đăng nhập)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Thông tin User & Hạng thành viên (Dành cho cả User và Admin)
    Route::get('/user', function (Request $request) {
        $user = $request->user()->load('membership.tier');
        return response()->json($user);
    });
    
    // ĐÃ FIX: Chỉ để route này ở đây để mọi User đã đăng nhập đều xem được
    Route::get('/membership-tiers', [MembershipTierController::class, 'index']);

    Route::put('/user/update', [UserController::class, 'updateProfile']);
    Route::post('/user/update-avatar', [UserController::class, 'updateAvatar']);

    /* ----------------------- GIỎ HÀNG ----------------------- */
    Route::get('/cart', [CartController::class, 'getCart']);
    Route::post('/cart/add', [CartController::class, 'addToCart']);
    Route::put('/cart/update', [CartController::class, 'updateCart']);
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']);
    Route::get('/shipping-methods', [OrderController::class, 'getShippingMethods']);
    Route::get('/payment-methods', [OrderController::class, 'getPaymentMethods']);

    /* ----------------------- ĐƠN HÀNG ----------------------- */
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::put('/orders/{id}/complete', [OrderController::class, 'confirmReceipt']);

    /* ----------------------- ORDER HISTORIES (User) ----------------------- */
    Route::middleware('user')->group(function () {
        Route::get('/order-histories', [OrderProcessingController::class, 'userIndex']);
        Route::get('/order-histories/{orderId}', [OrderProcessingController::class, 'userShow']);
        Route::post('/conversations', [ChatController::class, 'createConversation']);
        Route::get('/product-reviews', [ProductReviewController::class, 'index']);
        Route::post('/product-reviews', [ProductReviewController::class, 'store']);
        Route::put('/product-reviews/{reviewId}', [ProductReviewController::class, 'update']);
        Route::delete('/product-reviews/{reviewId}', [ProductReviewController::class, 'destroy']);
    });

    /* ----------------------- CHAT ----------------------- */
    Route::get('/conversations', [ChatController::class, 'listConversations']);
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'listMessages']);
    Route::post('/conversations/{conversationId}/messages', [ChatController::class, 'sendMessage']);

    /* ----------------------- SELLER ----------------------- */
    Route::middleware('seller')->group(function () {
        Route::get('/seller/orders', [OrderProcessingController::class, 'sellerIndex']);
        Route::post('/seller/orders/{orderId}/confirm', [OrderProcessingController::class, 'confirm']);
        Route::post('/seller/orders/{orderId}/shipping', [OrderProcessingController::class, 'shipping']);
        Route::post('/seller/orders/{orderId}/complete', [OrderProcessingController::class, 'completed']);
        Route::post('/seller/orders/{orderId}/cancel', [OrderProcessingController::class, 'cancelled']);
    });

    /* ----------------------- ĐỊA CHỈ & PASSWORD ----------------------- */
    Route::get('/user/addresses', [UserAddressController::class, 'index']);
    Route::post('/user/addresses', [UserAddressController::class, 'store']);
    Route::put('/user/addresses/{id}', [UserAddressController::class, 'update']);
    Route::delete('/user/addresses/{id}', [UserAddressController::class, 'destroy']);
    Route::put('/user/addresses/{id}/default', [UserAddressController::class, 'setDefault']);
    Route::post('/user/change-password', [UserController::class, 'changePassword']);

    /* ----------------------- COUPON & THANH TOÁN ----------------------- */
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
    Route::post('/payment/vnpay', [PaymentController::class, 'createPayment']);
    
    /* ----------------------- SHOP MANAGEMENT ----------------------- */
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/my-shop', [ShopController::class, 'myShop']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::get('/seller/orders', [OrderController::class, 'getSellerOrders']);
    Route::put('/seller/orders/{id}/status', [OrderController::class, 'updateOrderStatus']);
    Route::get('/seller/statistics', [StatisticsController::class, 'sellerDashboard']);
    Route::get('/seller/settings/auto-confirm', [OrderController::class, 'getAutoConfirmSetting']);
    Route::post('/seller/settings/auto-confirm', [OrderController::class, 'toggleAutoConfirm']);
    Route::get('/seller/products/{id}/forecast', [StatisticsController::class, 'getProductForecast']);
    Route::post('/reviews', [ReviewController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | 3. ADMIN ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        Route::get('/admin/shops', [AdminShopController::class, 'index']);
        Route::put('/admin/shops/{id}/approve', [AdminShopController::class, 'approve']);

        Route::get('/admin/statistics', [StatisticsController::class, 'adminDashboard']);
        
        // Cấu hình Hạng (Chỉ Admin mới có quyền Thêm/Sửa/Xóa)
        Route::get('/admin/membership-tiers', [MembershipTierController::class, 'index']);
        Route::post('/admin/membership-tiers', [MembershipTierController::class, 'store']);
        Route::put('/admin/membership-tiers/{id}', [MembershipTierController::class, 'update']);
        Route::delete('/admin/membership-tiers/{id}', [MembershipTierController::class, 'destroy']);
        
        // Quản lý Coupon toàn sàn
        Route::get('/admin/coupons', [CouponController::class, 'adminIndex']);
        Route::post('/admin/coupons', [CouponController::class, 'adminStore']);
        Route::delete('/admin/coupons/{id}', [CouponController::class, 'adminDestroy']);      
    });
});
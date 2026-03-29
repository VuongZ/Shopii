<?php

use Illuminate\Http\Request;
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
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\OrderProcessingController;
use App\Http\Controllers\ProductReviewController;
use App\Http\Controllers\ChatController;
/*
|--------------------------------------------------------------------------
| 1. KHU VỰC CÔNG KHAI (Không cần đăng nhập)
|--------------------------------------------------------------------------
*/
// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/forgot-password', [ForgotPasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('/verify-otp', [ForgotPasswordController::class, 'verifyOtp']);

// Products & Categories (Ai cũng xem được)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::get('/categories', [CategoryController::class, 'index']); 

Route::get('/health', function () {
    return response()->json([
        'status' => 'OK'
    ]);
});
    /* ----------------------- Review (USER) ----------------------- */

    Route::get('/reviews', [ReviewController::class, 'index']);
/*
|--------------------------------------------------------------------------
| 2. PROTECTED ROUTES (Cần đăng nhập)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Lấy thông tin user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    /* ----------------------- GIỎ HÀNG ----------------------- */
    Route::get('/cart', [CartController::class, 'getCart']);
    Route::post('/cart/add', [CartController::class, 'addToCart']);
    Route::put('/cart/update', [CartController::class, 'updateCart']);
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']);

    /* ----------------------- ĐƠN HÀNG ----------------------- */
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    /* ----------------------- ORDER HISTORIES (User) ----------------------- */
    Route::middleware('user')->group(function () {
        Route::get('/order-histories', [OrderProcessingController::class, 'userIndex']);
        Route::get('/order-histories/{orderId}', [OrderProcessingController::class, 'userShow']);
        Route::post('/conversations', [ChatController::class, 'createConversation']);

        /* ----------------------- PRODUCT REVIEWS (User) ----------------------- */
        Route::get('/product-reviews', [ProductReviewController::class, 'index']);
        Route::post('/product-reviews', [ProductReviewController::class, 'store']);
        Route::put('/product-reviews/{reviewId}', [ProductReviewController::class, 'update']);
        Route::delete('/product-reviews/{reviewId}', [ProductReviewController::class, 'destroy']);
    });

    /* ----------------------- CHAT (User & Seller) ----------------------- */
    Route::get('/conversations', [ChatController::class, 'listConversations']);
    Route::get('/conversations/{conversationId}/messages', [ChatController::class, 'listMessages']);
    Route::post('/conversations/{conversationId}/messages', [ChatController::class, 'sendMessage']);

    /* ----------------------- SELLER ORDER MANAGEMENT ----------------------- */
    Route::middleware('seller')->group(function () {
        Route::get('/seller/orders', [OrderProcessingController::class, 'sellerIndex']);
        Route::post('/seller/orders/{orderId}/confirm', [OrderProcessingController::class, 'confirm']);
        Route::post('/seller/orders/{orderId}/shipping', [OrderProcessingController::class, 'shipping']);
        Route::post('/seller/orders/{orderId}/complete', [OrderProcessingController::class, 'completed']);
        Route::post('/seller/orders/{orderId}/cancel', [OrderProcessingController::class, 'cancelled']);
    });

    /* ----------------------- ĐỊA CHỈ ----------------------- */
    Route::get('/user/addresses', [UserAddressController::class, 'index']);
    Route::post('/user/addresses', [UserAddressController::class, 'store']);

    /* ----------------------- COUPON ----------------------- */
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);
    Route::post('/coupons', [CouponController::class, 'store']);
    Route::delete('/coupons/{id}', [CouponController::class, 'destroy']);
    /* ----------------------- THANH TOÁN ----------------------- */
    Route::post('/payment/vnpay', [PaymentController::class, 'createPayment']);
    Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);

    /* ----------------------- SHOP (SELLER) ----------------------- */
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/my-shop', [ShopController::class, 'myShop']);
    Route::post('/products', [ProductController::class, 'store']);
    
        /* ----------------------- Review (USER) ----------------------- */

        Route::post('/reviews', [ReviewController::class, 'store']);
        /*
    |--------------------------------------------------------------------------
    | 3. ADMIN ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {
        // Admin quản lý Categories
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Shop approve
        Route::get('/admin/shops', [AdminShopController::class, 'index']);
        Route::put('/admin/shops/{id}/approve', [AdminShopController::class, 'approve']);
    });
});
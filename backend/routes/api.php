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

/*
|--------------------------------------------------------------------------
| 1. PUBLIC ROUTES (Không cần đăng nhập)
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Products
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);


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

    /*
    -----------------------
    GIỎ HÀNG
    -----------------------
    */
    Route::get('/cart', [CartController::class, 'getCart']);
    Route::post('/cart/add', [CartController::class, 'addToCart']);
    Route::put('/cart/update', [CartController::class, 'updateCart']);
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']);

    /*
    -----------------------
    ĐƠN HÀNG
    -----------------------
    */
    Route::post('/checkout', [OrderController::class, 'checkout']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    /*
    -----------------------
    ĐỊA CHỈ
    -----------------------
    */
    Route::get('/user/addresses', [UserAddressController::class, 'index']);
    Route::post('/user/addresses', [UserAddressController::class, 'store']);

    /*
    -----------------------
    COUPON
    -----------------------
    */
    Route::get('/coupons', [CouponController::class, 'index']);
    Route::post('/coupons/apply', [CouponController::class, 'apply']);

    /*
    -----------------------
    THANH TOÁN
    -----------------------
    */
    Route::post('/payment/vnpay', [PaymentController::class, 'createPayment']);
    Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);

    /*
    -----------------------
    SHOP (SELLER)
    -----------------------
    */
    Route::post('/shops', [ShopController::class, 'store']);
    Route::get('/my-shop', [ShopController::class, 'myShop']);


    /*
    |--------------------------------------------------------------------------
    | 3. ADMIN ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('admin')->group(function () {

        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Shop approve
        Route::get('/admin/shops', [AdminShopController::class, 'index']);
        Route::put('/admin/shops/{id}/approve', [AdminShopController::class, 'approve']);
    });

});
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Import các Controller
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController; 
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserAddressController;

// 1. KHU VỰC CÔNG KHAI (Không cần đăng nhập)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->name('login');

// Lấy danh sách sản phẩm
Route::get('/products', [ProductController::class, 'index']); 
Route::get('/products/{id}', [ProductController::class, 'show']);

// 2. KHU VỰC BẢO MẬT (Cần Token đăng nhập)
Route::middleware('auth:sanctum')->group(function () {
    
    // Lấy thông tin user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Giỏ hàng
    Route::get('/cart', [CartController::class, 'getCart']);           
    Route::post('/cart/add', [CartController::class, 'addToCart']);    
    Route::put('/cart/update', [CartController::class, 'updateCart']); 
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']); 

    // Đặt hàng (Xử lý cả COD và tạo đơn chờ cho VNPay)
    Route::post('/checkout', [OrderController::class, 'checkout']);    
    Route::get('/user/addresses', [UserAddressController::class, 'index']);
    Route::post('/user/addresses', [UserAddressController::class, 'store']);
    // Thanh toán VNPay (Tạo link thanh toán)
    Route::post('/payment/vnpay', [PaymentController::class, 'createPayment']);
    Route::get('/payment/vnpay-callback', [PaymentController::class, 'vnpayCallback']);
});
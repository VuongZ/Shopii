<?php
use App\Http\Controllers\AuthController; // <-- Phải có dòng này ở trên cùng
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\CartController;
use App\Http\Controllers\OrderController;
Route::post('/register', [AuthController::class, 'register']); // <-- Phải có dòng này
Route::post('/login', [AuthController::class, 'login']);
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    
    // Giỏ hàng
    Route::post('/cart/add', [CartController::class, 'addToCart']); // Thêm vào giỏ
    Route::get('/cart', [CartController::class, 'getCart']);       // Xem giỏ
    Route::delete('/cart/{id}', [CartController::class, 'removeItem']); // Xóa item
    Route::put('/cart/update', [CartController::class, 'updateCart']);
    // Thanh toán
    Route::post('/checkout', [OrderController::class, 'checkout']); // Đặt hàng
    //Nhận Xét Cuả Tao
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
});